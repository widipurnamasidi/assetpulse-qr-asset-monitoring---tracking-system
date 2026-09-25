import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { AuditLog } from '../models/AuditLog.js';
import { Asset } from '../models/Asset.js';

/**
 * ============================================================================
 * Controller Ekspor Laporan & Dokumen Spreadsheet (Export Controller)
 * Lokasi file: server/controllers/exportController.ts
 *
 * Menerima request yang diarahkan dari:
 * -> Folder Rute: server/routes/exportRoutes.ts
 *
 * Menghasilkan file spreadsheet Microsoft Excel (.xlsx) berdesain profesional
 * menggunakan pustaka ExcelJS lengkap dengan styling, header, borders, dan warna status.
 * ============================================================================
 */

/**
 * Ekspor Buku Besar Jejak Audit Kriptografi ke Format Excel (.xlsx).
 * Endpoint rute: GET /api/export/audit/excel (didefinisikan di server/routes/exportRoutes.ts)
 */
export async function exportAuditExcel(req: Request, res: Response) {
  try {
    const { assetTag, action, search, startDate, endDate } = req.query;

    const logs = AuditLog.find({
      assetTag: assetTag as string,
      action: action as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const verification = AuditLog.verifyLedgerIntegrity();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AssetPulse Enterprise System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Buku Besar Audit Imutabel', {
      views: [{ showGridLines: true }],
    });

    // 1. Blok Judul Header Laporan
    worksheet.mergeCells('A1:J1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'ASSETPULSE ENTERPRISE — BUKU BESAR TRANSAKSI AUDIT APPEND-ONLY';
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    worksheet.getRow(1).height = 36;

    // 2. Blok Metadata & Status Rantai Kriptografi
    worksheet.mergeCells('A2:J2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Tanggal Ekspor: ${new Date().toISOString()} | Total Blok: ${logs.length} | Integritas Rantai Kriptografi: ${
      verification.isValid ? 'TERVERIFIKASI (100% UTUH / BEBAS MANIPULASI)' : 'TERDETEKSI MODIFIKASI ILEGAL'
    } | Head Hash: ${AuditLog.getLatestHash().substring(0, 16)}...`;
    metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    worksheet.getRow(2).height = 22;

    // Baris spasi kosong
    worksheet.getRow(3).height = 10;

    // 3. Header Kolom Tabel
    const headers = [
      { header: 'ID Transaksi', key: 'id', width: 16 },
      { header: 'Waktu Stempel (UTC)', key: 'timestamp', width: 22 },
      { header: 'Tag Aset', key: 'assetTag', width: 15 },
      { header: 'Nama Aset', key: 'assetName', width: 34 },
      { header: 'Tindakan (Action)', key: 'action', width: 18 },
      { header: 'Nama Pelaksana', key: 'actorName', width: 20 },
      { header: 'Peran (Role)', key: 'actorRole', width: 14 },
      { header: 'Detail Transaksi', key: 'details', width: 38 },
      { header: 'Tautan Hash Sebelumnya', key: 'previousHash', width: 24 },
      { header: 'Hash Blok SHA-256', key: 'hash', width: 28 },
    ];

    worksheet.columns = headers;

    // Penerapan styling pada baris header kolom
    const headerRow = worksheet.getRow(4);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: 'FFF8FAFC' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // 4. Pengisian Baris Data Transaksi
    logs.forEach((log, index) => {
      const row = worksheet.addRow({
        id: log.id,
        timestamp: log.timestamp,
        assetTag: log.assetTag,
        assetName: log.assetName,
        action: log.action.toUpperCase(),
        actorName: log.actorName,
        actorRole: log.actorRole.toUpperCase(),
        details: formatDetails(log.details),
        previousHash: `${log.previousHash.substring(0, 16)}...`,
        hash: `${log.hash.substring(0, 20)}...`,
      });

      row.height = 22;
      const isEven = index % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 4 || colNumber === 8 ? 'left' : 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Pemberian warna tematik sesuai jenis tindakan (Action)
        if (colNumber === 5) {
          cell.font = { name: 'Arial', size: 9, bold: true };
          if (log.action === 'checkout') {
            cell.font.color = { argb: 'FFD97706' }; // Kuning Amber untuk peminjaman
          } else if (log.action === 'checkin') {
            cell.font.color = { argb: 'FF16A34A' }; // Hijau untuk pengembalian
          } else if (log.action === 'field_audit') {
            cell.font.color = { argb: 'FF0284C7' }; // Biru Langit untuk audit lapangan
          } else if (log.action === 'created') {
            cell.font.color = { argb: 'FF7C3AED' }; // Ungu untuk registrasi aset baru
          }
        }
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=AssetPulse_Buku_Besar_Audit_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Kesalahan ekspor Excel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Ekspor Registri Master Inventaris Aset ke Format Spreadsheet Excel (.xlsx).
 * Endpoint rute: GET /api/export/assets/excel (didefinisikan di server/routes/exportRoutes.ts)
 */
export async function exportAssetsExcel(req: Request, res: Response) {
  try {
    const assets = await Asset.findAll();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AssetPulse Inventory';

    const worksheet = workbook.addWorksheet('Master Inventaris Aset', {
      views: [{ showGridLines: true }],
    });

    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ASSETPULSE ENTERPRISE — MASTER REGISTRI INVENTARIS ASET';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
    worksheet.getRow(1).height = 32;

    worksheet.columns = [
      { header: 'Tag Aset', key: 'assetTag', width: 15 },
      { header: 'Nama Aset', key: 'name', width: 34 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Nomor Seri', key: 'serialNumber', width: 18 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Kondisi', key: 'condition', width: 14 },
      { header: 'Lokasi Saat Ini', key: 'location', width: 28 },
      { header: 'Penanggung Jawab', key: 'custody', width: 22 },
      { header: 'Nilai Pembelian ($)', key: 'cost', width: 18 },
    ];

    const headerRow = worksheet.getRow(2);
    headerRow.height = 24;
    headerRow.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    assets.forEach((a) => {
      const row = worksheet.addRow({
        assetTag: a.assetTag,
        name: a.name,
        category: a.category,
        serialNumber: a.serialNumber,
        status: a.status.replace('_', ' ').toUpperCase(),
        condition: a.condition.toUpperCase(),
        location: a.location,
        custody: a.currentCustody?.name || 'Di Gudang',
        cost: a.purchaseCost || 0,
      });
      row.height = 20;
      row.getCell(9).numFmt = '$#,##0.00';
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=AssetPulse_Master_Inventaris_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Utilitas pemformat objek rincian transaksi untuk sel Excel
 */
function formatDetails(details: Record<string, any>): string {
  if (!details) return '';
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
}
