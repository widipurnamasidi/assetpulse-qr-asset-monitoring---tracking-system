import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';

/**
 * ============================================================================
 * Controller Jejak Audit Kriptografi (Audit Controller)
 * Lokasi file: server/controllers/auditController.ts
 *
 * Menerima request yang diarahkan dari:
 * -> Folder Rute: server/routes/auditRoutes.ts
 *
 * Mengelola buku besar audit transaksi append-only yang kebal manipulasi (tamper-proof)
 * menggunakan perantaian kriptografi hash SHA-256 ala Blockchain.
 * ============================================================================
 */

/**
 * Mengambil daftar catatan riwayat transaksi audit log dengan filter multi-bidang.
 * Endpoint rute: GET /api/audit (didefinisikan di server/routes/auditRoutes.ts)
 */
export async function listAuditLogs(req: Request, res: Response) {
  try {
    const { assetId, assetTag, action, actorId, search, startDate, endDate } = req.query;

    const logs = AuditLog.find({
      assetId: assetId as string,
      assetTag: assetTag as string,
      action: action as string,
      actorId: actorId as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    const verification = AuditLog.verifyLedgerIntegrity();

    res.json({
      success: true,
      count: logs.length,
      data: logs,
      integrity: verification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Mengambil satu catatan log audit tertentu berdasarkan ID transaksi.
 * 'req.auditLog' diisi otomatis oleh middleware Route Model Binding.
 * Endpoint rute: GET /api/audit/:logId (didefinisikan di server/routes/auditRoutes.ts)
 */
export async function getAuditLogById(req: Request, res: Response) {
  // req.auditLog telah diikat secara eager oleh bindAuditLogById
  res.json({
    success: true,
    data: req.auditLog,
  });
}

/**
 * Melakukan verifikasi matematis terhadap seluruh rantai blok transaksi audit log.
 * Memastikan tidak ada rekaman yang pernah diedit, dihapus, atau dimodifikasi secara ilegal.
 * Endpoint rute: GET /api/audit/verify (didefinisikan di server/routes/auditRoutes.ts)
 */
export async function verifyAuditIntegrity(req: Request, res: Response) {
  try {
    const verification = AuditLog.verifyLedgerIntegrity();
    res.json({
      success: true,
      verification,
      status: verification.isValid ? 'UNCOMPROMISED' : 'CORRUPTED',
      message: verification.isValid
        ? `Integritas buku besar terkonfirmasi secara matematis pada seluruh ${verification.totalBlocks} blok transaksi append-only.`
        : `Pelanggaran integritas kriptografi terdeteksi pada indeks blok ke-${verification.tamperedIndex}!`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
