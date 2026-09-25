import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { IUser, UserRole } from '../types/index.js';

/**
 * ============================================================================
 * Middleware Autentikasi JWT & Otorisasi Hak Akses (RBAC)
 * Lokasi file: server/middleware/authMiddleware.ts
 *
 * Mengatur pembuatan dan verifikasi token stateless JSON Web Token (JWT)
 * serta penyaringan hak akses berdasarkan peran pengguna (Admin, Manager, Auditor, Teknisi).
 * ============================================================================
 */

const JWT_SECRET = process.env.JWT_SECRET || 'assetpulse_enterprise_jwt_secret_994829104';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Membuat token stateless JSON Web Token dengan masa berlaku 7 hari
 */
export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware untuk memastikan request membawa token Bearer Authorization yang valid
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token autentikasi Bearer wajib disertakan.',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Sesi pengguna tidak valid atau akun telah dihapus.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token sesi kedaluwarsa atau tidak valid.',
    });
  }
}

/**
 * Middleware Otorisasi Berdasarkan Peran (Role-Based Access Control / RBAC)
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Akses tidak terautentikasi.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Akses ditolak: Hak akses tidak mencukupi untuk peran '${req.user.role}'. Peran yang diizinkan: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
