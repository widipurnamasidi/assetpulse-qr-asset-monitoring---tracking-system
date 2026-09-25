import React, { useState } from 'react';
import {
  ClipboardList,
  Compass,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  Search,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { IAsset } from '../types/index.js';

interface FieldAuditStationProps {
  assets: IAsset[];
  onOpenScanner: () => void;
  onSelectForAudit: (asset: IAsset) => void;
}

export const FieldAuditStation: React.FC<FieldAuditStationProps> = ({
  assets,
  onOpenScanner,
  onSelectForAudit,
}) => {
  const [search, setSearch] = useState('');

  const auditedAssets = assets.filter((a) => a.lastAuditedAt);
  const pendingAuditAssets = assets.filter((a) => !a.lastAuditedAt || a.status === 'in_audit');

  const filteredAssets = assets.filter(
    (a) =>
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                FIELD VERIFICATION COCKPIT
              </span>
              <span className="text-xs font-mono text-slate-400">&bull; GPS Tagged Audits</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Field Asset Audit &amp; Physical Verification
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Conduct rapid in-situ equipment audits. Scan equipment QR codes via web/mobile camera
              to capture real-time geolocation coordinates, evaluate physical integrity, and certify custody compliance.
            </p>
          </div>

          <button
            onClick={onOpenScanner}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-xl text-xs shadow-lg shadow-sky-500/25 transition cursor-pointer self-start md:self-center shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Live QR Scanner</span>
          </button>
        </div>

        {/* Decorative backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Field Inspection Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Asset Audit Roster */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Equipment Audit Registry</h3>
              <p className="text-xs text-slate-400">Select any equipment to initiate an on-site audit certification</p>
            </div>
            <div className="w-48 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-0.5">
                    {asset.qrCodeDataUrl ? (
                      <img src={asset.qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">{asset.assetTag}</span>
                      <span className="text-xs font-semibold text-white">{asset.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                      <span>Loc: <strong className="text-slate-300">{asset.location}</strong></span>
                      <span>&bull;</span>
                      <span>Condition: <strong className="text-slate-300 uppercase">{asset.condition}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectForAudit(asset)}
                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Audit Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Field Audit Protocols & Stats */}
        <div className="space-y-4">
          {/* Protocol Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-sky-400" />
              Standard Audit Protocol
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Verify match between laser-engraved QR tag and serial plate</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Check tamper-evident seals and calibration stickers</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Record high-precision field GPS coordinates (WGS84)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Commit immutable transaction into cryptographic ledger</span>
              </div>
            </div>
          </div>

          {/* Audit Coverage KPI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Audit Coverage
            </h4>
            <div className="text-2xl font-bold font-mono text-white">
              {auditedAssets.length} / {assets.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Equipment physically certified within compliance cycle
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${assets.length > 0 ? (auditedAssets.length / assets.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
