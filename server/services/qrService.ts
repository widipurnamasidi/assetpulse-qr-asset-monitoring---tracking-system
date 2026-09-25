import QRCode from 'qrcode';

/**
 * ============================================================================
 * Layanan Generator QR Code Digital (QR Service)
 * Lokasi file: server/services/qrService.ts
 *
 * Menghasilkan barcode QR Code resolusi tinggi (High Error Correction 'H')
 * dalam bentuk Data URL Base64 yang siap ditampilkan di layar perangkat,
 * dicetak pada stiker label termal industri, atau dipindai oleh scanner kamera.
 * ============================================================================
 */

export interface QRCodePayload {
  protocol: 'assetpulse';
  version: '1.0';
  assetTag: string;
  id: string;
  name: string;
  serialNumber: string;
}

/**
 * Menghasilkan kode QR kontras tinggi yang dioptimalkan untuk pemindai kamera lapangan
 */
export async function generateAssetQRCode(
  assetTag: string,
  id: string,
  name: string,
  serialNumber: string
): Promise<string> {
  const payload: QRCodePayload = {
    protocol: 'assetpulse',
    version: '1.0',
    assetTag,
    id,
    name,
    serialNumber,
  };

  const encodedContent = JSON.stringify(payload);

  try {
    const dataUrl = await QRCode.toDataURL(encodedContent, {
      errorCorrectionLevel: 'H', // Tingkat koreksi kesalahan tinggi (High) untuk label tahan banting
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a', // Warna Slate 900 gelap tajam
        light: '#ffffff', // Latar belakang putih bersih
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Gagal membuat QR Code:', error);
    // Fallback ke string tag sederhana jika terjadi kendala
    return await QRCode.toDataURL(assetTag);
  }
}
