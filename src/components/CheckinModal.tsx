import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Wrench, ShieldCheck, MapPin } from 'lucide-react';
import { IAsset, AssetCondition } from '../types/index.js';
import { api } from '../services/api.js';

interface CheckinModalProps {
  asset: IAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAsset: IAsset) => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !asset) return null;

  const [condition, setCondition] = useState<AssetCondition>(asset.condition);
  const [returnLocation, setReturnLocation] = useState('Central Warehouse - Depot Bay 02');
  const [inspectionNotes, setInspectionNotes] = useState('All lenses and accessories returned in clean working order.');
  const [requiresMaintenance, setRequiresMaintenance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.assets.checkin(asset.id, {
        returnLocation,
        condition,
        inspectionNotes,
        requiresMaintenance,
      });

      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setError(response.error || 'Failed to check in asset.');
      }
    } catch (err: any) {
      setError(err.message || 'Transaction error during check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                CHECK-IN / RETURN
              </span>
              <span className="text-xs text-slate-400 font-mono">{asset.assetTag}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Receive Equipment & Audit</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Custody Info */}
        {asset.currentCustody && (
          <div className="bg-slate-950/60 p-4 mx-6 mt-4 rounded-xl border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Active Custody Holder
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{asset.currentCustody.name}</div>
                <div className="text-xs text-slate-400">{asset.currentCustody.department}</div>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono">
                <div>Out: {new Date(asset.currentCustody.checkoutDate).toLocaleDateString()}</div>
                <div className="text-amber-400">Due: {new Date(asset.currentCustody.expectedReturnDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Post-Deployment Physical Condition Rating
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['excellent', 'good', 'fair', 'needs_repair', 'damaged'] as AssetCondition[]).map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => {
                    setCondition(cond);
                    if (cond === 'needs_repair' || cond === 'damaged') {
                      setRequiresMaintenance(true);
                    }
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold uppercase transition border cursor-pointer ${
                    condition === cond
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cond.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Return Depot Shelf / Bay Location
            </label>
            <input
              type="text"
              required
              value={returnLocation}
              onChange={(e) => setReturnLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Physical Inspection & Triage Notes
            </label>
            <textarea
              rows={3}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Record any cosmetic scratches, missing cables, or recalibration needs..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Maintenance Toggle */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wrench className={`w-4 h-4 ${requiresMaintenance ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Flag for Maintenance / Calibration
                </div>
                <div className="text-[10px] text-slate-500">
                  Transfers asset status to 'under_maintenance' instead of available
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={requiresMaintenance}
              onChange={(e) => setRequiresMaintenance(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting ? 'Recording Receipt...' : 'Confirm Return & Re-Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
