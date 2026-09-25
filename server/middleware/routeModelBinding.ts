import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/Asset.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { IAsset, IUser, IAuditLog } from '../types/index.js';

/**
 * ============================================================================
 * Middleware Route Model Binding
 * Lokasi file: server/middleware/routeModelBinding.ts
 *
 * Pola arsitektur ini mencegat parameter URL (seperti :assetId, :assetTag, :logId)
 * dan memuat langsung entitas model database ke dalam objek request Express ('req.asset', 'req.auditLog').
 *
 * Keuntungan:
 * 1. Mengeliminasi pemanggilan query berulang di setiap fungsi controller.
 * 2. Mengatasi masalah lazy loading & mengoptimalkan performa response API.
 * 3. Otomatis mengembalikan status HTTP 404 jika entitas yang dicari tidak ditemukan,
 *    sehingga controller hanya menerima data yang sudah valid dan ada.
 * ============================================================================
 */

// Perluasan interface Request Express untuk memuat model yang telah terikat
declare global {
  namespace Express {
    interface Request {
      asset?: IAsset;
      boundUser?: IUser;
      auditLog?: IAuditLog;
    }
  }
}

/**
 * Route Model Binding untuk parameter ':assetId'.
 * Mengambil data aset berdasarkan ID unik dan menyimpannya di 'req.asset'.
 */
export async function bindAssetById(
  req: Request,
  res: Response,
  next: NextFunction,
  assetId: string
) {
  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      res.status(404).json({
        success: false,
        error: `Aset dengan ID '${assetId}' tidak ditemukan di sistem.`,
      });
      return;
    }
    // Ikat instance model aset ke objek request
    req.asset = asset;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Route Model Binding untuk parameter ':assetTag'.
 * Sangat ideal untuk pencarian instan via hasil scan QR Code kamera.
 */
export async function bindAssetByTag(
  req: Request,
  res: Response,
  next: NextFunction,
  assetTag: string
) {
  try {
    const asset = await Asset.findByTag(assetTag);
    if (!asset) {
      res.status(404).json({
        success: false,
        error: `Aset dengan Tag '${assetTag}' tidak ditemukan di sistem.`,
      });
      return;
    }
    req.asset = asset;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Route Model Binding untuk parameter ':userId'.
 * Mengikat entitas pengguna / teknisi ke 'req.boundUser'.
 */
export async function bindUserById(
  req: Request,
  res: Response,
  next: NextFunction,
  userId: string
) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: `Pengguna dengan ID '${userId}' tidak ditemukan.`,
      });
      return;
    }
    req.boundUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Route Model Binding untuk parameter ':logId'.
 * Mengikat entitas catatan audit transaksi ke 'req.auditLog'.
 */
export async function bindAuditLogById(
  req: Request,
  res: Response,
  next: NextFunction,
  logId: string
) {
  try {
    const log = AuditLog.findById(logId);
    if (!log) {
      res.status(404).json({
        success: false,
        error: `Catatan transaksi audit dengan ID '${logId}' tidak ditemukan.`,
      });
      return;
    }
    req.auditLog = log;
    next();
  } catch (error) {
    next(error);
  }
}
