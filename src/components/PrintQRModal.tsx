import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { IAsset } from '../types/index.js';
import { generateAssetLabelPdf } from '../utils/pdfExport.js';

interface PrintQRModalProps {
  asset: IAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({ asset, isOpen, onClose }) => {
  if (!isOpen || !asset) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateAssetLabelPdf(asset);
  };

  const handleDownloadPng = () => {
    if (!asset.qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = asset.qrCodeDataUrl;
    a.download = `QR_${asset.assetTag}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
              INDUSTRIAL LABEL
            </span>
            <h3 className="text-base font-bold text-white mt-1">Print Asset Tag</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Preview */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950">
          <div
            id="printable-asset-label"
            className="w-full max-w-[340px] bg-white text-slate-950 p-4 rounded-lg border-2 border-slate-800 shadow-xl select-none"
          >
            {/* Label Header */}
            <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
              <div className="text-[10px] tracking-widest font-black uppercase text-slate-700">
                ASSETPULSE ENTERPRISE
              </div>
              <div className="text-base font-black tracking-tight font-mono text-slate-900">
                {asset.assetTag}
              </div>
            </div>

            {/* QR & Core Specs */}
            <div className="flex items-center gap-3">
              <img
                src={asset.qrCodeDataUrl}
                alt="QR Code"
                className="w-28 h-28 shrink-0 border border-slate-300 p-1"
              />
              <div className="text-left text-[11px] leading-tight space-y-1 min-w-0">
                <div>
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Equipment</span>
                  <span className="font-bold text-slate-900 line-clamp-2">{asset.name}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Serial No.</span>
                  <span className="font-mono text-slate-800 font-semibold">{asset.serialNumber}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Dept</span>
                  <span className="text-slate-800 truncate block">{asset.department}</span>
                </div>
              </div>
            </div>

            {/* Warning & Instructions */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">
                DO NOT REMOVE &bull; TAMPER EVIDENT TRACKED ASSET
              </div>
              <div className="text-[8px] text-slate-500">
                Scan via AssetPulse terminal to borrow, return, or audit
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center">
            Standard thermal label format (100mm &times; 75mm) with High Error-Correction QR code.
          </p>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            PDF Label
          </button>
          <button
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            QR PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Tag
          </button>
        </div>
      </div>
    </div>
  );
};
