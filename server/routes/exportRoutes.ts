import { Router } from 'express';
import { exportAuditExcel, exportAssetsExcel } from '../controllers/exportController.js';

/**
 * ============================================================================
 * Rute Ekspor Laporan Excel & Spreadsheet (Export Routes)
 * Lokasi file: server/routes/exportRoutes.ts
 *
 * Mengarahkan request unduhan dokumen ke fungsi penangan di:
 * -> Folder Controller: server/controllers/exportController.ts
 * ============================================================================
 */
const router = Router();

// GET /api/export/audit/excel -> Ekspor buku besar log audit ke format spreadsheet Excel (.xlsx) via ExcelJS
// Mengarah ke: exportAuditExcel() di server/controllers/exportController.ts
router.get('/audit/excel', exportAuditExcel);

// GET /api/export/assets/excel -> Ekspor seluruh daftar inventaris aset master ke format spreadsheet Excel (.xlsx)
// Mengarah ke: exportAssetsExcel() di server/controllers/exportController.ts
router.get('/assets/excel', exportAssetsExcel);

export default router;
