import { Router } from 'express';
import {
  listAuditLogs,
  getAuditLogById,
  verifyAuditIntegrity,
} from '../controllers/auditController.js';
import { bindAuditLogById } from '../middleware/routeModelBinding.js';

/**
 * ============================================================================
 * Rute Audit Trail Kriptografi (Audit Routes)
 * Lokasi file: server/routes/auditRoutes.ts
 *
 * Mengarahkan request HTTP ke fungsi penangan di:
 * -> Folder Controller: server/controllers/auditController.ts
 *
 * Menggunakan middleware Route Model Binding dari:
 * -> Folder Middleware: server/middleware/routeModelBinding.ts
 * ============================================================================
 */
const router = Router();

// Route Model Binding untuk parameter ':logId'
// Mengikat rekaman audit log secara otomatis ke 'req.auditLog'
router.param('logId', bindAuditLogById);

// GET /api/audit -> Mengambil daftar seluruh riwayat audit transaksi append-only
// Mengarah ke: listAuditLogs() di server/controllers/auditController.ts
router.get('/', listAuditLogs);

// GET /api/audit/verify -> Verifikasi matematis integritas seluruh rantai hash SHA-256 (Blockchain-style)
// Mengarah ke: verifyAuditIntegrity() di server/controllers/auditController.ts
router.get('/verify', verifyAuditIntegrity);

// GET /api/audit/:logId -> Mengambil 1 rincian log audit spesifik berdasarkan ID
// Mengarah ke: getAuditLogById() di server/controllers/auditController.ts
router.get('/:logId', getAuditLogById);

export default router;
