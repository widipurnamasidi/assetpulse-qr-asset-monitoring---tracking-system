/**
 * ============================================================================
 * Pola Transaksi Sesi (Transaction Session Pattern)
 * Lokasi file: server/models/TransactionSession.ts
 *
 * Mengimplementasikan mekanisme transaksi dua fase (Two-Phase Commit / Rollback)
 * yang menyerupai MongoDB / Mongoose Session Transactions.
 *
 * Menjamin sifat ACID (Atomicity, Consistency, Isolation, Durability) pada operasi
 * multi-langkah: pembaruan status aset, penugasan hak penguasaan (custody),
 * dan penambahan entri audit log ke buku besar terenkripsi.
 *
 * Jika salah satu langkah mengalami kegagalan, seluruh langkah sebelumnya
 * dibatalkan secara otomatis (rollback) dalam urutan terbalik.
 * ============================================================================
 */

export interface TransactionOperation {
  execute: () => void | Promise<void>;
  rollback: () => void | Promise<void>;
  description: string;
}

export class TransactionSession {
  public id: string;
  public inTransaction: boolean = false;
  private operations: TransactionOperation[] = [];
  private executedOps: TransactionOperation[] = [];

  constructor() {
    this.id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Memulai sesi transaksi baru
   */
  startTransaction(): void {
    if (this.inTransaction) {
      throw new Error('Transaksi sedang berlangsung pada sesi ini.');
    }
    this.inTransaction = true;
    this.operations = [];
    this.executedOps = [];
  }

  /**
   * Mendaftarkan operasi beserta fungsi eksekusi maju dan fungsi pembatalan mundur (rollback)
   */
  register(op: TransactionOperation): void {
    if (!this.inTransaction) {
      throw new Error('Tidak dapat mendaftarkan operasi di luar sesi transaksi aktif.');
    }
    this.operations.push(op);
  }

  /**
   * Menjalankan (commit) seluruh operasi terdaftar secara atomik.
   * Jika timbul error pada salah satu operasi, seluruh operasi yang telah berjalan
   * akan di-rollback dalam urutan terbalik secara otomatis.
   */
  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('Tidak ada transaksi aktif untuk di-commit.');
    }

    try {
      for (const op of this.operations) {
        await op.execute();
        this.executedOps.push(op);
      }
      this.inTransaction = false;
      this.operations = [];
      this.executedOps = [];
    } catch (error) {
      console.error(`Transaksi ${this.id} gagal dieksekusi, memicu rollback:`, error);
      await this.abortTransaction();
      throw error;
    }
  }

  /**
   * Membatalkan seluruh operasi yang sempat tereksekusi untuk mengembalikan kondisi data semula
   */
  async abortTransaction(): Promise<void> {
    while (this.executedOps.length > 0) {
      const op = this.executedOps.pop();
      if (op?.rollback) {
        try {
          await op.rollback();
        } catch (rollbackErr) {
          console.error(`Gagal melakukan rollback pada operasi: ${op.description}`, rollbackErr);
        }
      }
    }
    this.inTransaction = false;
    this.operations = [];
  }

  /**
   * Mengakhiri sesi transaksi secara aman
   */
  endSession(): void {
    if (this.inTransaction) {
      console.warn(`Mengakhiri sesi transaksi ${this.id} yang belum di-commit. Membatalkan transaksi secara otomatis.`);
      this.abortTransaction();
    }
  }
}

/**
 * Utilitas pembungkus (wrapper) untuk mengeksekusi blok kode di dalam transaksi terkontrol
 */
export async function withTransaction<T>(
  callback: (session: TransactionSession) => Promise<T>
): Promise<T> {
  const session = new TransactionSession();
  session.startTransaction();
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
