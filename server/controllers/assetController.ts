import { Request, Response } from 'express';
import { Asset } from '../models/Asset.js';
import { AuditLog } from '../models/AuditLog.js';
import { withTransaction } from '../models/TransactionSession.js';
import { AssetCondition, AssetStatus } from '../types/index.js';

/**
 * ============================================================================
 * Controller Inventaris & Manajemen Aset (Asset Controller)
 * Lokasi file: server/controllers/assetController.ts
 *
 * Menerima request yang diarahkan dari:
 * -> Folder Rute: server/routes/assetRoutes.ts
 *
 * Mengelola siklus hidup aset (pendaftaran, checkout, check-in, dan audit lapangan)
 * serta mengimplementasikan 'TransactionSession' untuk menjamin integritas data (ACID).
 * ============================================================================
 */

/**
 * Mengambil daftar aset dengan parameter filter (status, kategori, kondisi, pencarian)
 * Endpoint rute: GET /api/assets (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function listAssets(req: Request, res: Response) {
  try {
    const { status, category, condition, search, location } = req.query;

    const assets = await Asset.findAll({
      status: status as string,
      category: category as string,
      condition: condition as string,
      search: search as string,
      location: location as string,
    });

    const metrics = Asset.getMetrics();
    const categories = Asset.getCategories();

    res.json({
      success: true,
      data: assets,
      metrics,
      categories,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Mengambil detail aset tunggal beserta riwayat audit log.
 * Entitas 'req.asset' telah dimuat terlebih dahulu oleh middleware 'routeModelBinding.ts'.
 * Endpoint rute: GET /api/assets/:assetId (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function getAsset(req: Request, res: Response) {
  // req.asset telah dipastikan keberadaannya melalui Route Model Binding
  const asset = req.asset!;
  const history = AuditLog.find({ assetId: asset.id });

  res.json({
    success: true,
    data: {
      ...asset,
      history,
    },
  });
}

/**
 * Penangan pemindaian QR code untuk lookup cepat data aset berdasarkan Tag/QR.
 * Endpoint rute: GET /api/assets/tag/:assetTag (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function scanAssetTag(req: Request, res: Response) {
  // req.asset telah diikat secara otomatis oleh bindAssetByTag
  const asset = req.asset!;
  const history = AuditLog.find({ assetId: asset.id });

  res.json({
    success: true,
    data: {
      ...asset,
      history,
    },
  });
}

/**
 * Pendaftaran aset baru ke dalam inventaris dan pembuatan QR Code digital resolusi tinggi.
 * Operasi dijalankan secara atomik dalam TransactionSession bersama pencatatan audit log pertama.
 * Endpoint rute: POST /api/assets (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function createAsset(req: Request, res: Response) {
  try {
    const {
      assetTag,
      name,
      category,
      serialNumber,
      modelNumber,
      manufacturer,
      location,
      department,
      purchaseCost,
      condition = 'excellent',
      notes,
      specifications = {},
    } = req.body;

    if (!assetTag || !name || !serialNumber || !category) {
      res.status(400).json({
        success: false,
        error: 'Tag Aset, Nama, Kategori, dan Nomor Seri wajib diisi.',
      });
      return;
    }

    const existing = await Asset.findByTag(assetTag);
    if (existing) {
      res.status(409).json({
        success: false,
        error: `Tag Aset '${assetTag}' sudah terdaftar untuk perangkat ${existing.name}.`,
      });
      return;
    }

    // Jalankan operasi dengan sesi transaksi atomik ala Mongoose / MongoDB Session
    const createdAsset = await withTransaction(async (session) => {
      const asset = await Asset.create(
        {
          assetTag: assetTag.trim().toUpperCase(),
          name,
          category,
          serialNumber,
          modelNumber: modelNumber || 'N/A',
          manufacturer: manufacturer || 'N/A',
          status: 'available',
          condition: condition as AssetCondition,
          location: location || 'Gudang Pusat (Central Warehouse)',
          department: department || 'Logistik Umum',
          purchaseDate: new Date().toISOString().split('T')[0],
          purchaseCost: Number(purchaseCost) || 0,
          currentCustody: null,
          specifications,
          notes,
        },
        session
      );

      // Catat transaksi penambahan aset ke buku besar append-only
      AuditLog.create(
        {
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          action: 'created',
          actorId: req.user?.id || 'sys_operator',
          actorName: req.user?.name || 'Petugas Sistem',
          actorRole: req.user?.role || 'admin',
          details: {
            note: 'Aset berhasil didaftarkan ke inventaris. Label QR digital telah dibuat.',
            initialLocation: asset.location,
            initialCondition: asset.condition,
          },
          newState: asset,
        },
        session
      );

      return asset;
    });

    res.status(201).json({
      success: true,
      data: createdAsset,
      message: `Aset ${createdAsset.assetTag} berhasil didaftarkan.`,
    });
  } catch (error: any) {
    console.error('Kesalahan pendaftaran aset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Alur Peminjaman Aset Keluar (Checkout Workflow).
 * Menjalankan multi-langkah: validasi ketersediaan, pembaruan status & penanggung jawab (custody),
 * serta pencatatan audit log dalam 1 transaksi atomik (TransactionSession).
 * Endpoint rute: POST /api/assets/:assetId/checkout (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function checkoutAsset(req: Request, res: Response) {
  try {
    const asset = req.asset!;
    const {
      borrowerId,
      borrowerName,
      borrowerEmail,
      borrowerDepartment,
      expectedReturnDate,
      purpose,
      projectCode,
      destinationLocation,
    } = req.body;

    if (asset.status !== 'available') {
      res.status(400).json({
        success: false,
        error: `Aset ${asset.assetTag} tidak dapat dipinjam karena statusnya saat ini '${asset.status}'.`,
      });
      return;
    }

    if (!borrowerName || !expectedReturnDate) {
      res.status(400).json({
        success: false,
        error: 'Nama peminjam dan perkiraan tanggal kembali wajib diisi.',
      });
      return;
    }

    // Jalankan sesi transaksi atomik multi-langkah
    const updatedAsset = await withTransaction(async (session) => {
      const custody = {
        userId: borrowerId || req.user?.id || 'guest_user',
        name: borrowerName,
        email: borrowerEmail || 'field@company.com',
        department: borrowerDepartment || 'Operasional Lapangan',
        checkoutDate: new Date().toISOString(),
        expectedReturnDate,
        purpose: purpose || 'Penugasan Lapangan',
        projectCode: projectCode || 'INTERNAL-OPS',
      };

      // Perbarui status aset menjadi 'checked_out'
      const updated = await Asset.updateWithSession(
        asset.id,
        {
          status: 'checked_out',
          currentCustody: custody,
          location: destinationLocation || `Penugasan Lapangan (${custody.name})`,
        },
        session
      );

      // Sisipkan rekaman ke buku besar audit log
      AuditLog.create(
        {
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          action: 'checkout',
          actorId: req.user?.id || 'sys_op',
          actorName: req.user?.name || 'Petugas Logistik Berwenang',
          actorRole: req.user?.role || 'technician',
          details: {
            borrowerName: custody.name,
            department: custody.department,
            expectedReturnDate: custody.expectedReturnDate,
            purpose: custody.purpose,
            projectCode: custody.projectCode,
          },
          previousState: {
            status: asset.status,
            currentCustody: asset.currentCustody,
            location: asset.location,
          },
          newState: {
            status: 'checked_out',
            currentCustody: custody,
            location: updated?.location,
          },
        },
        session
      );

      return updated;
    });

    res.json({
      success: true,
      data: updatedAsset,
      message: `Aset ${asset.assetTag} berhasil dipinjamkan kepada ${borrowerName}.`,
    });
  } catch (error: any) {
    console.error('Kesalahan proses checkout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Alur Pengembalian Aset Masuk (Check-in / Return Workflow).
 * Menjalankan inspeksi kondisi fisik, pembaruan status gudang atau pemeliharaan,
 * serta penulisan log audit atomik.
 * Endpoint rute: POST /api/assets/:assetId/checkin (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function checkinAsset(req: Request, res: Response) {
  try {
    const asset = req.asset!;
    const {
      returnLocation,
      condition,
      inspectionNotes,
      requiresMaintenance,
    } = req.body;

    if (asset.status !== 'checked_out') {
      res.status(400).json({
        success: false,
        error: `Aset ${asset.assetTag} tidak sedang dalam status dipinjam (checked out).`,
      });
      return;
    }

    const nextStatus: AssetStatus = requiresMaintenance ? 'under_maintenance' : 'available';
    const finalCondition: AssetCondition = condition || asset.condition;

    // Jalankan sesi transaksi atomik multi-langkah
    const updatedAsset = await withTransaction(async (session) => {
      const previousCustody = asset.currentCustody;

      const updated = await Asset.updateWithSession(
        asset.id,
        {
          status: nextStatus,
          condition: finalCondition,
          currentCustody: null,
          location: returnLocation || 'Gudang Pusat - Area Penerimaan Kembali',
          notes: inspectionNotes ? `${asset.notes || ''}\n[Inspeksi Masuk]: ${inspectionNotes}` : asset.notes,
        },
        session
      );

      // Sisipkan log audit transaksi pengembalian
      AuditLog.create(
        {
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          action: 'checkin',
          actorId: req.user?.id || 'sys_op',
          actorName: req.user?.name || 'Petugas Penerimaan Aset',
          actorRole: req.user?.role || 'manager',
          details: {
            returnedBy: previousCustody?.name || 'Tidak diketahui',
            returnLocation: updated?.location,
            returnCondition: finalCondition,
            inspectionNotes: inspectionNotes || 'Lolos verifikasi inspeksi fisik tanpa kerusakan.',
            sentToMaintenance: Boolean(requiresMaintenance),
          },
          previousState: {
            status: asset.status,
            currentCustody: previousCustody,
            condition: asset.condition,
            location: asset.location,
          },
          newState: {
            status: nextStatus,
            currentCustody: null,
            condition: finalCondition,
            location: updated?.location,
          },
        },
        session
      );

      return updated;
    });

    res.json({
      success: true,
      data: updatedAsset,
      message: `Aset ${asset.assetTag} berhasil dikembalikan dan tercatat berstatus ${nextStatus}.`,
    });
  } catch (error: any) {
    console.error('Kesalahan proses check-in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Alur Audit Lapangan Real-Time (Field Audit Workflow).
 * Menangkap koordinat GPS geolocation, kondisi fisik terbaru, dan catatan verifikasi langsung dari kamera/HP.
 * Endpoint rute: POST /api/assets/:assetId/field-audit (didefinisikan di server/routes/assetRoutes.ts)
 */
export async function fieldAuditAsset(req: Request, res: Response) {
  try {
    const asset = req.asset!;
    const {
      verifiedLocation,
      condition,
      auditNotes,
      latitude,
      longitude,
      accuracy,
    } = req.body;

    const auditorName = req.user?.name || 'Teknisi Auditor Lapangan';

    const updatedAsset = await withTransaction(async (session) => {
      const now = new Date().toISOString();

      const updated = await Asset.updateWithSession(
        asset.id,
        {
          condition: (condition as AssetCondition) || asset.condition,
          location: verifiedLocation || asset.location,
          lastAuditedAt: now,
          lastAuditedBy: auditorName,
          status: asset.status === 'in_audit' ? 'available' : asset.status,
        },
        session
      );

      // Sisipkan rekaman audit lengkap beserta koordinat GPS ke buku besar kriptografi
      AuditLog.create(
        {
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          action: 'field_audit',
          actorId: req.user?.id || 'field_auditor',
          actorName: auditorName,
          actorRole: req.user?.role || 'auditor',
          details: {
            auditType: 'Inspeksi Fisik Lapangan & Pemindaian QR',
            verifiedLocation: verifiedLocation || asset.location,
            inspectedCondition: condition || asset.condition,
            notes: auditNotes || 'Nomor seri fisik dan segel pengaman terverifikasi utuh.',
          },
          previousState: {
            condition: asset.condition,
            lastAuditedAt: asset.lastAuditedAt,
            lastAuditedBy: asset.lastAuditedBy,
          },
          newState: {
            condition: updated?.condition,
            location: updated?.location,
            lastAuditedAt: now,
            lastAuditedBy: auditorName,
          },
          locationCoordinates:
            latitude && longitude
              ? {
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                  accuracy: accuracy ? Number(accuracy) : undefined,
                  address: verifiedLocation,
                }
              : undefined,
        },
        session
      );

      return updated;
    });

    res.json({
      success: true,
      data: updatedAsset,
      message: `Audit lapangan berhasil untuk aset ${asset.assetTag}. Blok kriptografi baru telah terpasang.`,
    });
  } catch (error: any) {
    console.error('Kesalahan proses audit lapangan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
