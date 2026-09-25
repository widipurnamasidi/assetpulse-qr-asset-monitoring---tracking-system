import { Router } from 'express';
import authRoutes from './authRoutes.js';
import assetRoutes from './assetRoutes.js';
import auditRoutes from './auditRoutes.js';
import exportRoutes from './exportRoutes.js';

/**
 * ============================================================================
 * Router Pusat API (Gateway Endpoint)
 * Berada di folder: server/routes/index.ts
 *
 * File ini mendistribusikan lalu lintas endpoint Express ke modul rute spesifik:
 * - /api/auth   -> mengarah ke server/routes/authRoutes.ts (Controller: server/controllers/authController.ts)
 * - /api/assets -> mengarah ke server/routes/assetRoutes.ts (Controller: server/controllers/assetController.ts)
 * - /api/audit  -> mengarah ke server/routes/auditRoutes.ts (Controller: server/controllers/auditController.ts)
 * - /api/export -> mengarah ke server/routes/exportRoutes.ts (Controller: server/controllers/exportController.ts)
 * ============================================================================
 */
const apiRouter = Router();

// Sub-rute autentikasi dan manajemen akun teknisi
apiRouter.use('/auth', authRoutes);

// Sub-rute inventaris aset, pemindaian QR code, checkout, check-in, dan audit lapangan
apiRouter.use('/assets', assetRoutes);

// Sub-rute log audit transaksi append-only dan verifikasi integritas rantai kriptografi
apiRouter.use('/audit', auditRoutes);

// Sub-rute ekspor data laporan dalam format Excel (.xlsx)
apiRouter.use('/export', exportRoutes);

// Endpoint pemeriksaan kesehatan server (Healthcheck & Diagnostic)
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AssetPulse Enterprise Core',
    version: '2.4.0',
  });
});

export default apiRouter;
