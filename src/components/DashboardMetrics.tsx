import React from 'react';
import {
  Boxes,
  ArrowUpRight,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';

interface MetricsProps {
  metrics: {
    total: number;
    available: number;
    checkedOut: number;
    underMaintenance: number;
    inAudit: number;
    totalValue: number;
    utilizationRate: number;
  };
  integrity: {
    isValid: boolean;
    totalBlocks: number;
    verifiedAt: string;
  };
  onVerifyLedger: () => void;
  isVerifying: boolean;
}

export const DashboardMetrics: React.FC<MetricsProps> = ({
  metrics,
  integrity,
  onVerifyLedger,
  isVerifying,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Assets */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Total Assets</span>
          <Boxes className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">{metrics.total}</div>
        <div className="text-[11px] text-slate-500 mt-1">Monitored equipment</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition" />
      </div>

      {/* Checked Out / Field Custody */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">In Field</span>
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-amber-400 font-mono">{metrics.checkedOut}</div>
        <div className="text-[11px] text-slate-500 mt-1">{metrics.utilizationRate}% deployment rate</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition" />
      </div>

      {/* Available in Depot */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Depot Ready</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-400 font-mono">{metrics.available}</div>
        <div className="text-[11px] text-slate-500 mt-1">Ready for dispatch</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition" />
      </div>

      {/* In Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-indigo-500/40 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Active Audit</span>
          <ClipboardCheck className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-indigo-400 font-mono">{metrics.inAudit}</div>
        <div className="text-[11px] text-slate-500 mt-1">Field verification</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition" />
      </div>

      {/* Maintenance */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-rose-500/40 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Maintenance</span>
          <Wrench className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold text-rose-400 font-mono">{metrics.underMaintenance}</div>
        <div className="text-[11px] text-slate-500 mt-1">Inspection & repair</div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition" />
      </div>

      {/* Cryptographic Ledger Health */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden group hover:border-cyan-500/40 transition flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Ledger Audit</span>
            <ShieldCheck className={`w-4 h-4 ${integrity.isValid ? 'text-emerald-400' : 'text-red-500 animate-bounce'}`} />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${integrity.isValid ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-white font-mono">
              {integrity.isValid ? '100% SECURED' : 'BREACH'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {integrity.totalBlocks} SHA-256 blocks
          </div>
        </div>
        <button
          onClick={onVerifyLedger}
          disabled={isVerifying}
          className="mt-2 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 py-1 rounded border border-cyan-500/30 transition cursor-pointer"
        >
          {isVerifying ? 'Validating...' : 'Verify Chain'}
        </button>
      </div>
    </div>
  );
};
