import crypto from 'crypto';

/**
 * ============================================================================
 * Layanan Kriptografi & Rantai Hash SHA-256 (Crypto Service)
 * Lokasi file: server/services/cryptoService.ts
 *
 * Mengimplementasikan pengacakan dan penautan hash SHA-256 ala blockchain
 * untuk memastikan setiap transaksi pada buku besar audit saling terikat.
 * Jika satu rekaman lama diubah, seluruh nilai hash berikutnya akan menjadi tidak valid.
 * ============================================================================
 */

/**
 * Menghitung nilai hash SHA-256 untuk satu entri log audit transaksi
 */
export function calculateAuditHash(params: {
  id: string;
  timestamp: string;
  assetId: string;
  assetTag: string;
  action: string;
  actorId: string;
  previousHash: string;
  details: Record<string, any>;
  newState: Record<string, any>;
}): string {
  const canonicalString = JSON.stringify({
    id: params.id,
    timestamp: params.timestamp,
    assetId: params.assetId,
    assetTag: params.assetTag,
    action: params.action,
    actorId: params.actorId,
    previousHash: params.previousHash,
    details: params.details,
    newState: params.newState,
  });

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Memvalidasi keaslian seluruh rantai hash audit dari Genesis Block sampai ke Head Block
 */
export function verifyAuditChain(chain: Array<{
  id: string;
  timestamp: string;
  assetId: string;
  assetTag: string;
  action: string;
  actorId: string;
  previousHash: string;
  hash: string;
  details: Record<string, any>;
  newState: Record<string, any>;
}>): {
  isValid: boolean;
  tamperedIndex: number;
  totalBlocks: number;
  verifiedAt: string;
} {
  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];
    
    // Periksa apakah tautan ke previousHash sesuai dengan hash blok sebelumnya
    if (i > 0) {
      if (entry.previousHash !== chain[i - 1].hash) {
        return {
          isValid: false,
          tamperedIndex: i,
          totalBlocks: chain.length,
          verifiedAt: new Date().toISOString(),
        };
      }
    }

    // Hitung ulang hash untuk memverifikasi kesesuaian konten rekaman
    const expectedHash = calculateAuditHash({
      id: entry.id,
      timestamp: entry.timestamp,
      assetId: entry.assetId,
      assetTag: entry.assetTag,
      action: entry.action,
      actorId: entry.actorId,
      previousHash: entry.previousHash,
      details: entry.details,
      newState: entry.newState,
    });

    if (expectedHash !== entry.hash) {
      return {
        isValid: false,
        tamperedIndex: i,
        totalBlocks: chain.length,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  return {
    isValid: true,
    tamperedIndex: -1,
    totalBlocks: chain.length,
    verifiedAt: new Date().toISOString(),
  };
}
