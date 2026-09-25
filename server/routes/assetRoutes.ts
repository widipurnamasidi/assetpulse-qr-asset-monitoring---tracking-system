import { Router } from 'express';
import {
  listAssets,
  getAsset,
  createAsset,
  checkoutAsset,
  checkinAsset,
  fieldAuditAsset,
  scanAssetTag,
} from '../controllers/assetController.js';
import { bindAssetById, bindAssetByTag } from '../middleware/routeModelBinding.js';

/**
 * ============================================================================
 * Rute Inventaris Aset & Pemindaian QR (Asset Routes)
 * Lokasi file: server/routes/assetRoutes.ts
 *
 * Mengarahkan setiap request HTTP ke fungsi penangan di:
 * -> Folder Controller: server/controllers/assetController.ts
 *
 * Menggunakan middleware Route Model Binding dari:
 * -> Folder Middleware: server/middleware/routeModelBinding.ts
 *    Memuat data model aset langsung ke dalam 'req.asset' sebelum controller dipanggil,
 *    sehingga mencegah query ganda dan lazy-loading.
 * ============================================================================
 */
const router = Router();

/**
 * Pendaftaran Route Model Binding:
 * - Parameter ':assetId' secara otomatis mengikat entitas aset ke 'req.asset' via bindAssetById
 * - Parameter ':assetTag' mengikat entitas aset berdasarkan kode tag QR via bindAssetByTag
 */
router.param('assetId', bindAssetById);
router.param('assetTag', bindAssetByTag);

// GET /api/assets -> Mengambil daftar seluruh inventaris aset dengan filter (status, kategori, dsb)
// Mengarah ke: listAssets() di server/controllers/assetController.ts
router.get('/', listAssets);

// GET /api/assets/tag/:assetTag -> Pencarian cepat data aset via hasil pindai QR Code
// Mengarah ke: scanAssetTag() di server/controllers/assetController.ts (data aset sudah ada di req.asset)
router.get('/tag/:assetTag', scanAssetTag);

// GET /api/assets/:assetId -> Mengambil rincian 1 aset beserta riwayat pergerakannya
// Mengarah ke: getAsset() di server/controllers/assetController.ts
router.get('/:assetId', getAsset);

// POST /api/assets -> Pendaftaran aset baru beserta pembuatan QR Code digital resolusi tinggi
// Mengarah ke: createAsset() di server/controllers/assetController.ts
router.post('/', createAsset);

// POST /api/assets/:assetId/checkout -> Alur peminjaman aset keluar (Checkout) dengan Transaction Session
// Mengarah ke: checkoutAsset() di server/controllers/assetController.ts
router.post('/:assetId/checkout', checkoutAsset);

// POST /api/assets/:assetId/checkin -> Alur pengembalian aset masuk (Check-in) dengan inspeksi fisik
// Mengarah ke: checkinAsset() di server/controllers/assetController.ts
router.post('/:assetId/checkin', checkinAsset);

// POST /api/assets/:assetId/field-audit -> Alur audit fisik di lapangan dengan GPS Geolocation
// Mengarah ke: fieldAuditAsset() di server/controllers/assetController.ts
router.post('/:assetId/field-audit', fieldAuditAsset);

export default router;
