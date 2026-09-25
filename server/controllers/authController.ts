import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendOtpEmail, getRecentSmtpLogs } from '../services/mailerService.js';

/**
 * ============================================================================
 * Controller Autentikasi, 2FA & Manajemen Akun (Auth Controller)
 * Lokasi file: server/controllers/authController.ts
 *
 * Menerima request yang diarahkan dari:
 * -> Folder Rute: server/routes/authRoutes.ts
 *
 * Mengelola alur login, verifikasi 2FA dengan kode OTP 6-digit via Nodemailer (Google SMTP),
 * pengiriman ulang OTP, pemulihan kata sandi (forgot password), serta pembuatan token sesi JWT.
 * ============================================================================
 */

/**
 * Autentikasi login pengguna via email dan kata sandi (bcrypt).
 * Jika pengguna mengaktifkan Two-Factor Authentication (2FA), kode OTP 6 digit akan di-generate
 * dan dikirimkan secara otomatis via Google SMTP Nodemailer.
 * Endpoint rute: POST /api/auth/login (didefinisikan di server/routes/authRoutes.ts)
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Email atau kata sandi tidak valid.' });
      return;
    }

    const isMatch = await User.verifyPassword(user, password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Email atau kata sandi tidak valid.' });
      return;
    }

    // Periksa apakah fitur autentikasi dua faktor (2FA) diaktifkan
    if (user.isTwoFactorEnabled) {
      const otpCode = User.generate6DigitOtp();
      await User.setPendingOtp(user.id, otpCode);

      // Kirim kode OTP 6 digit ke email teknisi melalui Nodemailer dengan konfigurasi Google SMTP
      await sendOtpEmail({
        to: user.email,
        technicianName: user.name,
        otpCode,
        type: '2FA_VERIFICATION',
      });

      res.json({
        success: true,
        requires2FA: true,
        userId: user.id,
        email: user.email,
        maskedEmail: user.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`),
        message: 'Kode OTP 6-digit 2FA telah dikirimkan ke alamat email terverifikasi via Google SMTP Nodemailer.',
      });
      return;
    }

    // Login langsung jika 2FA dinonaktifkan
    const token = generateToken(user);
    res.json({
      success: true,
      requires2FA: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Kesalahan proses login:', error);
    res.status(500).json({ success: false, error: error.message || 'Terjadi kesalahan internal pada server.' });
  }
}

/**
 * Verifikasi kode OTP 6 digit untuk Two-Factor Authentication.
 * Setelah lolos, token JWT diterbitkan untuk sesi kerja teknisi/petugas.
 * Endpoint rute: POST /api/auth/verify-2fa (didefinisikan di server/routes/authRoutes.ts)
 */
export async function verify2FA(req: Request, res: Response) {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({ success: false, error: 'ID Pengguna dan 6-digit OTP wajib disertakan.' });
      return;
    }

    const isValid = await User.verifyOtp(userId, otp);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Kode OTP 6-digit tidak valid atau sudah kedaluwarsa. Silakan periksa email terbaru atau minta kode baru.',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
      },
      message: 'Verifikasi 2FA berhasil. Sesi pengguna telah terautentikasi.',
    });
  } catch (error: any) {
    console.error('Kesalahan verifikasi 2FA:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memverifikasi OTP.' });
  }
}

/**
 * Mengirimkan ulang kode OTP 6 digit yang baru jika pengguna tidak menerimanya atau kedaluwarsa.
 * Endpoint rute: POST /api/auth/resend-otp (didefinisikan di server/routes/authRoutes.ts)
 */
export async function resendOtp(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'ID Pengguna wajib disertakan.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const otpCode = User.generate6DigitOtp();
    await User.setPendingOtp(user.id, otpCode);

    await sendOtpEmail({
      to: user.email,
      technicianName: user.name,
      otpCode,
      type: '2FA_VERIFICATION',
    });

    res.json({
      success: true,
      message: `Kode OTP 6-digit baru telah dikirimkan via Nodemailer ke ${user.email}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Permintaan pemulihan sandi (Forgot Password).
 * Menghasilkan token pemulihan 6-digit dan mengirimkannya ke email teknisi terkait.
 * Endpoint rute: POST /api/auth/forgot-password (didefinisikan di server/routes/authRoutes.ts)
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Alamat email wajib diisi.' });
      return;
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Standar keamanan: jangan membocorkan keberadaan email kepada penyerang
      res.json({
        success: true,
        message: 'Jika akun tersebut terdaftar, kode pemulihan 6 digit telah dikirimkan.',
      });
      return;
    }

    const otpCode = User.generate6DigitOtp();
    await User.setResetToken(user.id, otpCode);

    await sendOtpEmail({
      to: user.email,
      technicianName: user.name,
      otpCode,
      type: 'PASSWORD_RESET',
    });

    res.json({
      success: true,
      userId: user.id,
      message: 'Kode pemulihan sandi 6-digit telah dikirimkan melalui Google SMTP Nodemailer.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Mengubah kata sandi lama menjadi sandi baru berdasarkan validasi kode OTP pemulihan.
 * Endpoint rute: POST /api/auth/reset-password (didefinisikan di server/routes/authRoutes.ts)
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      res.status(400).json({ success: false, error: 'ID Pengguna, kode OTP, dan sandi baru wajib disertakan.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'Kata sandi minimal harus terdiri dari 8 karakter.' });
      return;
    }

    const success = await User.resetPasswordWithToken(userId, otp, newPassword);
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Kode pemulihan tidak valid atau sudah kedaluwarsa. Silakan lakukan permohonan baru.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Anda sekarang dapat masuk dengan kredensial baru.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Mengambil informasi profil sesi pengguna yang sedang login saat ini.
 * Endpoint rute: GET /api/auth/me (didefinisikan di server/routes/authRoutes.ts)
 */
export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Tidak terautentikasi.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      avatarUrl: req.user.avatarUrl,
      isTwoFactorEnabled: req.user.isTwoFactorEnabled,
    },
  });
}

/**
 * Mengambil log riwayat pengiriman email SMTP untuk inspeksi keamanan dan debugging teknis.
 * Endpoint rute: GET /api/auth/smtp-logs (didefinisikan di server/routes/authRoutes.ts)
 */
export async function getSmtpLogs(req: Request, res: Response) {
  const logs = getRecentSmtpLogs();
  res.json({
    success: true,
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      authMethod: 'Google SMTP App Passwords (16-Digit)',
      configuredUser: process.env.GOOGLE_SMTP_USER || 'fieldtech-ops@assetpulse.internal (Simulasi)',
    },
    logs,
  });
}

/**
 * Mengambil daftar seluruh teknisi terdaftar untuk kemudahan pemilihan penerima kuasa aset.
 * Endpoint rute: GET /api/auth/technicians (didefinisikan di server/routes/authRoutes.ts)
 */
export async function listTechnicians(req: Request, res: Response) {
  const users = User.listAll();
  res.json({
    success: true,
    technicians: users,
  });
}
