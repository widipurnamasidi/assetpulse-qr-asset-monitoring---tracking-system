import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types/index.js';

class UserModel {
  private users: IUser[] = [];

  constructor() {
    this.seedInitialUsers();
  }

  private async seedInitialUsers() {
    // Default password for demo users: "AssetPulse2026!"
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('AssetPulse2026!', salt);

    this.users = [
      {
        id: 'usr_tech_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@fieldops.com',
        role: 'technician',
        department: 'Field Diagnostics & Survey',
        passwordHash,
        isTwoFactorEnabled: true,
        phone: '+1 (555) 234-5678',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        createdAt: '2026-01-10T00:00:00.000Z',
      },
      {
        id: 'usr_admin_01',
        name: 'Marcus Vance',
        email: 'marcus.vance@assetpulse.internal',
        role: 'admin',
        department: 'Asset Governance & Systems',
        passwordHash,
        isTwoFactorEnabled: true,
        phone: '+1 (555) 876-5432',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'usr_mgr_01',
        name: 'Elena Rostova',
        email: 'elena.rostova@operations.com',
        role: 'manager',
        department: 'Warehouse Logistics B',
        passwordHash,
        isTwoFactorEnabled: true,
        phone: '+1 (555) 345-6789',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        createdAt: '2026-02-15T00:00:00.000Z',
      },
      {
        id: 'usr_audit_01',
        name: 'David Chen',
        email: 'david.chen@compliance.org',
        role: 'auditor',
        department: 'Independent Quality & Audit',
        passwordHash,
        isTwoFactorEnabled: false,
        phone: '+1 (555) 456-7890',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        createdAt: '2026-03-01T00:00:00.000Z',
      },
    ];
  }

  async findByEmail(email: string): Promise<IUser | undefined> {
    const normalized = email.toLowerCase().trim();
    return this.users.find((u) => u.email.toLowerCase() === normalized);
  }

  async findById(id: string): Promise<IUser | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async verifyPassword(user: IUser, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }

  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const user = await this.findById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  /**
   * Generates a 6-digit cryptographically random OTP for 2FA or Password Reset
   */
  generate6DigitOtp(): string {
    const min = 100000;
    const max = 999999;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }

  /**
   * Stores a temporary OTP for 2FA (valid 10 minutes)
   */
  async setPendingOtp(userId: string, otp: string): Promise<void> {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await this.update(userId, {
      pendingOtp: otp,
      otpExpiresAt: expiresAt,
    });
  }

  /**
   * Verifies a 6-digit OTP code
   */
  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.pendingOtp || !user.otpExpiresAt) {
      return false;
    }

    if (Date.now() > user.otpExpiresAt) {
      return false; // Expired
    }

    if (user.pendingOtp.trim() !== otp.trim()) {
      return false;
    }

    // Clear OTP once used
    await this.update(userId, {
      pendingOtp: undefined,
      otpExpiresAt: undefined,
    });

    return true;
  }

  /**
   * Sets password reset token
   */
  async setResetToken(userId: string, token: string): Promise<void> {
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
    await this.update(userId, {
      resetToken: token,
      resetExpiresAt: expiresAt,
    });
  }

  /**
   * Resets password using valid token
   */
  async resetPasswordWithToken(userId: string, token: string, newPasswordPlain: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || !user.resetToken || !user.resetExpiresAt) {
      return false;
    }

    if (Date.now() > user.resetExpiresAt || user.resetToken !== token) {
      return false;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPasswordPlain, salt);

    await this.update(userId, {
      passwordHash,
      resetToken: undefined,
      resetExpiresAt: undefined,
    });

    return true;
  }

  listAll(): Omit<IUser, 'passwordHash' | 'pendingOtp' | 'resetToken'>[] {
    return this.users.map(({ passwordHash, pendingOtp, resetToken, ...safeUser }) => safeUser);
  }
}

export const User = new UserModel();
