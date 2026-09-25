import { Router } from 'express';
import {
  login,
  verify2FA,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  getSmtpLogs,
  listTechnicians,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

/**
 * ============================================================================
 * Rute Autentikasi, 2FA & Pemulihan Akun (Auth Routes)
 * Lokasi file: server/routes/authRoutes.ts
 *
 * Mengarahkan setiap request HTTP ke fungsi penangan di:
 * -> Folder Controller: server/controllers/authController.ts
 *
 * Menggunakan middleware proteksi token JWT di:
 * -> Folder Middleware: server/middleware/authMiddleware.ts
 * ============================================================================
 */
const router = Router();

// POST /api/auth/login -> Autentikasi kredensial (Email & Password), memicu OTP 2FA jika aktif
// Mengarah ke: login() di server/controllers/authController.ts
router.post('/login', login);

// POST /api/auth/verify-2fa -> Verifikasi kode OTP 6 digit yang dikirim melalui Nodemailer Google SMTP
// Mengarah ke: verify2FA() di server/controllers/authController.ts
router.post('/verify-2fa', verify2FA);

// POST /api/auth/resend-otp -> Kirim ulang kode OTP 6 digit jika kedaluwarsa atau belum diterima
// Mengarah ke: resendOtp() di server/controllers/authController.ts
router.post('/resend-otp', resendOtp);

// POST /api/auth/forgot-password -> Permintaan pemulihan sandi via pengiriman kode OTP ke email teknisi
// Mengarah ke: forgotPassword() di server/controllers/authController.ts
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password -> Penggantian kata sandi baru dengan validasi kode OTP
// Mengarah ke: resetPassword() di server/controllers/authController.ts
router.post('/reset-password', resetPassword);

// GET /api/auth/me -> Mengambil profil pengguna yang sedang aktif (memerlukan Bearer token)
// Mengarah ke: getMe() di server/controllers/authController.ts dengan filter requireAuth
router.get('/me', requireAuth, getMe);

// GET /api/auth/smtp-logs -> Mengambil riwayat pengiriman email OTP Nodemailer (untuk audit & pengujian)
// Mengarah ke: getSmtpLogs() di server/controllers/authController.ts
router.get('/smtp-logs', getSmtpLogs);

// GET /api/auth/technicians -> Mengambil daftar seluruh teknisi terdaftar untuk penugasan & peminjaman
// Mengarah ke: listTechnicians() di server/controllers/authController.ts
router.get('/technicians', listTechnicians);

export default router;
