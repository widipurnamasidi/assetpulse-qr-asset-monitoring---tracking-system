import React, { useState } from 'react';
import { X, Calendar, User, Building, MapPin, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IAsset, IUser } from '../types/index.js';
import { api } from '../services/api.js';

interface CheckoutModalProps {
  asset: IAsset | null;
  currentUser: IUser | null;
  technicians: IUser[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAsset: IAsset) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  asset,
  currentUser,
  technicians,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !asset) return null;

  // Set default return date to +7 days
  const defaultReturnDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [borrowerName, setBorrowerName] = useState(currentUser?.name || 'Alex Rivera');
  const [borrowerEmail, setBorrowerEmail] = useState(currentUser?.email || 'alex.rivera@fieldops.com');
  const [borrowerDepartment, setBorrowerDepartment] = useState(currentUser?.department || 'Field Diagnostics & Survey');
  const [expectedReturnDate, setExpectedReturnDate] = useState(defaultReturnDate);
  const [purpose, setPurpose] = useState('Critical infrastructure diagnostic survey');
  const [projectCode, setProjectCode] = useState('PRJ-METRO-4B');
  const [destinationLocation, setDestinationLocation] = useState('Metro Rail Phase IV Station');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTechnician = (techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    if (tech) {
      setBorrowerName(tech.name);
      setBorrowerEmail(tech.email);
      setBorrowerDepartment(tech.department);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.assets.checkout(asset.id, {
        borrowerName,
        borrowerEmail,
        borrowerDepartment,
        expectedReturnDate: new Date(expectedReturnDate).toISOString(),
        purpose,
        projectCode,
        destinationLocation,
      });

      if (response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setError(response.error || 'Failed to checkout asset.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during transaction.');
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
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                CHECKOUT
              </span>
              <span className="text-xs text-slate-400 font-mono">{asset.assetTag}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Asset Custody Transfer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Asset Brief Card */}
        <div className="bg-slate-950/60 p-4 mx-6 mt-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Target Equipment</div>
            <div className="text-sm font-bold text-white leading-tight">{asset.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Current Location: <span className="text-slate-300">{asset.location}</span>
            </div>
          </div>
          {asset.qrCodeDataUrl && (
            <img src={asset.qrCodeDataUrl} alt="QR" className="w-12 h-12 rounded bg-white p-0.5 border border-slate-700" />
          )}
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Technician Quick Select */}
          {technicians.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assign Authorized Field Personnel
              </label>
              <select
                onChange={(e) => handleSelectTechnician(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Technician Profile...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.role.toUpperCase()} ({t.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Borrower Full Name
              </label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                required
                value={borrowerDepartment}
                onChange={(e) => setBorrowerDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                required
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project Code / Work Order
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g. PRJ-2026-X"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Field Site / Deployment Destination
            </label>
            <input
              type="text"
              required
              value={destinationLocation}
              onChange={(e) => setDestinationLocation(e.target.value)}
              placeholder="e.g. Tunnel Shaft 3, Sector 9"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mission Purpose / Scope of Use
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Committing Transaction...' : 'Authorize Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
