import { IAuditLog, AuditAction, UserRole, IAsset } from '../types/index.js';
import { calculateAuditHash, verifyAuditChain } from '../services/cryptoService.js';
import { TransactionSession } from './TransactionSession.js';

/**
 * ============================================================================
 * Model Buku Besar Jejak Audit Kriptografi (Audit Log Model)
 * Lokasi file: server/models/AuditLog.ts
 *
 * Mengimplementasikan buku besar transaksi append-only yang kebal terhadap manipulasi.
 * Setiap transaksi baru terikat secara kriptografi dengan hash transaksi sebelumnya
 * (merupakan prinsip dasar Blockchain & SHA-256 hashing).
 *
 * Jika ada pihak yang mencoba mengubah riwayat lama, seluruh rantai hash setelahnya
 * akan rusak dan dapat terdeteksi secara otomatis melalui fungsi verifikasi.
 * ============================================================================
 */

const GENESIS_HASH = 'GENESIS_000000000000000000000000000000000000000000000000000000000000';

class AuditLogModel {
  private logs: IAuditLog[] = [];

  constructor() {
    this.seedInitialLogs();
  }

  /**
   * Menginisialisasi blok pertama (Genesis Block) sebagai jangkar rantai audit
   */
  private seedInitialLogs() {
    const genesisLog: IAuditLog = {
      id: 'LOG-000001',
      timestamp: '2026-09-01T08:00:00.000Z',
      assetId: 'SYSTEM-ROOT',
      assetTag: 'SYS-INIT',
      assetName: 'AssetPulse Cryptographic Ledger',
      action: 'created',
      actorId: 'user_admin_01',
      actorName: 'Chief Security Officer',
      actorRole: 'admin',
      details: {
        note: 'Buku besar append-only diinisialisasi. Blok genesis berhasil ditambatkan.',
      },
      newState: {},
      previousHash: GENESIS_HASH,
      hash: '',
    };

    genesisLog.hash = calculateAuditHash({
      id: genesisLog.id,
      timestamp: genesisLog.timestamp,
      assetId: genesisLog.assetId,
      assetTag: genesisLog.assetTag,
      action: genesisLog.action,
      actorId: genesisLog.actorId,
      previousHash: genesisLog.previousHash,
      details: genesisLog.details,
      newState: genesisLog.newState,
    });

    this.logs.push(genesisLog);
  }

  /**
   * Mengambil nilai hash dari blok transaksi paling terakhir di buku besar
   */
  getLatestHash(): string {
    if (this.logs.length === 0) return GENESIS_HASH;
    return this.logs[this.logs.length - 1].hash;
  }

  /**
   * Menambahkan entri transaksi baru ke dalam buku besar secara append-only.
   * Nilai hash dihitung secara otomatis berdasarkan isi data dan hash transaksi sebelumnya.
   */
  create(params: {
    assetId: string;
    assetTag: string;
    assetName: string;
    action: AuditAction;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    details: Record<string, any>;
    previousState?: Partial<IAsset>;
    newState: Partial<IAsset>;
    locationCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      address?: string;
    };
  }, session?: TransactionSession): IAuditLog {
    const previousHash = this.getLatestHash();
    const id = `LOG-${String(this.logs.length + 1).padStart(6, '0')}`;
    const timestamp = new Date().toISOString();

    const hash = calculateAuditHash({
      id,
      timestamp,
      assetId: params.assetId,
      assetTag: params.assetTag,
      action: params.action,
      actorId: params.actorId,
      previousHash,
      details: params.details,
      newState: params.newState,
    });

    const newLog: IAuditLog = {
      id,
      timestamp,
      assetId: params.assetId,
      assetTag: params.assetTag,
      assetName: params.assetName,
      action: params.action,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      details: params.details,
      previousState: params.previousState,
      newState: params.newState,
      previousHash,
      hash,
      locationCoordinates: params.locationCoordinates,
    };

    if (session && session.inTransaction) {
      session.register({
        description: `Tambah rekaman log audit ${id} untuk aset ${params.assetTag}`,
        execute: () => {
          this.logs.push(newLog);
        },
        rollback: () => {
          const index = this.logs.findIndex((l) => l.id === id);
          if (index !== -1) {
            this.logs.splice(index, 1);
          }
        },
      });
    } else {
      this.logs.push(newLog);
    }

    return newLog;
  }

  /**
   * Menelusuri rekaman audit dengan filter multi-parameter
   */
  find(filter: {
    assetId?: string;
    assetTag?: string;
    action?: string;
    actorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): IAuditLog[] {
    let result = [...this.logs];

    if (filter.assetId) {
      result = result.filter((l) => l.assetId === filter.assetId);
    }
    if (filter.assetTag) {
      result = result.filter((l) => l.assetTag.toLowerCase() === filter.assetTag?.toLowerCase());
    }
    if (filter.action && filter.action !== 'all') {
      result = result.filter((l) => l.action === filter.action);
    }
    if (filter.actorId) {
      result = result.filter((l) => l.actorId === filter.actorId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.assetTag.toLowerCase().includes(q) ||
          l.assetName.toLowerCase().includes(q) ||
          l.actorName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.hash.toLowerCase().includes(q) ||
          (l.details?.notes && String(l.details.notes).toLowerCase().includes(q))
      );
    }
    if (filter.startDate) {
      result = result.filter((l) => l.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      result = result.filter((l) => l.timestamp <= filter.endDate!);
    }

    // Urutkan kronologis terbalik (transaksi terbaru di atas)
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Mengambil log berdasarkan ID transaksi
   */
  findById(id: string): IAuditLog | undefined {
    return this.logs.find((l) => l.id === id);
  }

  /**
   * Melakukan validasi matematis terhadap seluruh rangkaian hash di buku besar
   */
  verifyLedgerIntegrity() {
    const chronChain = [...this.logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return verifyAuditChain(chronChain);
  }

  count(): number {
    return this.logs.length;
  }
}

export const AuditLog = new AuditLogModel();
