import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IAuditLog, IAsset } from '../types/index.js';

export function generateAuditPdf(logs: IAuditLog[], integrityInfo: { isValid: boolean; totalBlocks: number; verifiedAt: string }) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSETPULSE ENTERPRISE — APPEND-ONLY AUDIT TRANSACTION REPORT', 14, 12);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Official Immutable Chain of Custody & Field Verification Log | Exported: ${new Date().toLocaleString()}`,
    14,
    20
  );

  // Verification Badge
  const badgeColor = integrityInfo.isValid ? [22, 163, 74] : [220, 38, 38];
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(210, 6, 75, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CRYPTOGRAPHIC INTEGRITY:', 214, 11);
  doc.text(
    integrityInfo.isValid ? 'VERIFIED (100% UNCOMPROMISED)' : 'TAMPER BREACH DETECTED',
    214,
    18
  );

  // Metadata summary
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total Transactions Analyzed: ${logs.length} | Block Height: ${integrityInfo.totalBlocks} | Genesis Anchor: SHA-256 Chained`,
    14,
    34
  );

  // Prepare table data
  const tableData = logs.map((l) => [
    l.id,
    new Date(l.timestamp).toLocaleString(),
    l.assetTag,
    l.assetName.length > 25 ? l.assetName.substring(0, 22) + '...' : l.assetName,
    l.action.toUpperCase().replace('_', ' '),
    `${l.actorName} (${l.actorRole})`,
    formatPdfDetails(l.details),
    `${l.hash.substring(0, 14)}...`,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['ID', 'Timestamp', 'Asset Tag', 'Asset Name', 'Action', 'Actor / Role', 'Details', 'SHA-256 Block Hash']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 46 },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 38 },
      6: { cellWidth: 50 },
      7: { cellWidth: 35, font: 'courier', halign: 'center' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 280, 204, { align: 'right' });
      doc.text('Confidential - Authorized AssetPulse Audit Ledger Document', 14, 204);
    },
  });

  doc.save(`AssetPulse_Audit_Report_${Date.now()}.pdf`);
}

export function generateAssetLabelPdf(asset: IAsset) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 75], // 100x75mm standard industrial label size
  });

  // Background border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(2, 2, 96, 71);

  // Top header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(2, 2, 96, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSETPULSE PROPERTY IDENTIFIER', 50, 9, { align: 'center' });

  // QR Code
  if (asset.qrCodeDataUrl) {
    doc.addImage(asset.qrCodeDataUrl, 'PNG', 5, 17, 34, 34);
  }

  // Asset Info on right side
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(asset.assetTag, 42, 23);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', 42, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(asset.name.length > 25 ? asset.name.substring(0, 22) + '...' : asset.name, 42, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('SERIAL NO:', 42, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(asset.serialNumber, 42, 43);

  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT:', 42, 49);
  doc.setFont('helvetica', 'normal');
  doc.text(asset.department, 42, 53);

  // Bottom Warning
  doc.setFillColor(241, 245, 249);
  doc.rect(2, 55, 96, 18, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(2, 55, 98, 55);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('WARNING: TAMPER-EVIDENT SECURED ASSET', 50, 61, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Scan QR code with AssetPulse mobile terminal for checkout or audit.', 50, 66, {
    align: 'center',
  });
  doc.text(`Model: ${asset.modelNumber} | Category: ${asset.category}`, 50, 70, { align: 'center' });

  doc.save(`Asset_Tag_${asset.assetTag}.pdf`);
}

function formatPdfDetails(details: Record<string, any>): string {
  if (!details) return '';
  return Object.entries(details)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}
