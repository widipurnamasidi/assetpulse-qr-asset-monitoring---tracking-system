import React from 'react';
import {
  X,
  QrCode,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  ShieldCheck,
  User,
  Clock,
  Printer,
  Wrench,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { IAsset } from '../types/index.js';

interface AssetDetailModalProps {
  asset: IAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (asset: IAsset) => void;
  onCheckin: (asset: IAsset) => void;
  onAudit: (asset: IAsset) => void;
  onPrintQR: (asset: IAsset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onCheckout,
  onCheckin,
  onAudit,
  onPrintQR,
}) => {
  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-400">{asset.assetTag}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    asset.status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : asset.status === 'checked_out'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {asset.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                  {asset.condition}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{asset.name}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* QR Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <img
                src={asset.qrCodeDataUrl}
                alt="QR"
                className="w-32 h-32 rounded-lg bg-white p-2 border border-slate-700 shadow-inner"
              />
              <span className="text-xs font-mono text-slate-400 mt-2 font-bold">{asset.assetTag}</span>
              <button
                onClick={() => onPrintQR(asset)}
                className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Asset Tag
              </button>
            </div>

            {/* Hardware Metadata */}
            <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Category</span>
                <span className="text-slate-200 font-medium">{asset.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Serial Number</span>
                <span className="text-slate-200 font-mono font-semibold">{asset.serialNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Manufacturer</span>
                <span className="text-slate-200 font-medium">{asset.manufacturer}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Model</span>
                <span className="text-slate-200 font-medium">{asset.modelNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Department</span>
                <span className="text-slate-200 font-medium">{asset.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Asset Valuation</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  ${asset.purchaseCost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Current Location</span>
                <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  {asset.location}
                </span>
              </div>
            </div>
          </div>

          {/* Current Custody Card (if checked out) */}
          {asset.currentCustody ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Active Custody / Borrower
                </span>
                <span className="text-[11px] font-mono text-amber-300">
                  Due: {new Date(asset.currentCustody.expectedReturnDate).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-amber-400/80 block">Borrower</span>
                  <span className="font-bold text-white">{asset.currentCustody.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/80 block">Department</span>
                  <span className="text-slate-200">{asset.currentCustody.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/80 block">Project Code</span>
                  <span className="text-slate-200 font-mono">{asset.currentCustody.projectCode || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/80 block">Out Since</span>
                  <span className="text-slate-200 font-mono">
                    {new Date(asset.currentCustody.checkoutDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {asset.currentCustody.purpose && (
                <div className="mt-2 text-xs text-slate-300 border-t border-amber-500/20 pt-2">
                  <span className="font-semibold text-amber-400">Purpose:</span> {asset.currentCustody.purpose}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Asset is securely staged in depot and available for deployment.
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{asset.location}</span>
            </div>
          )}

          {/* Specifications */}
          {asset.specifications && Object.keys(asset.specifications).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Technical Specifications
              </h4>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(asset.specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-slate-200 font-mono">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Operational Notes
              </h4>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line">
                {asset.notes}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Enrolled: {new Date(asset.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {asset.status === 'available' ? (
              <button
                onClick={() => {
                  onCheckout(asset);
                  onClose();
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Check Out (Borrow)
              </button>
            ) : (
              <button
                onClick={() => {
                  onCheckin(asset);
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Check In (Return)
              </button>
            )}

            <button
              onClick={() => {
                onAudit(asset);
                onClose();
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Field Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
