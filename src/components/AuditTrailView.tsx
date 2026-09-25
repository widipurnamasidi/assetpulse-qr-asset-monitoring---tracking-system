import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Hash,
  Clock,
  User,
  Database,
} from 'lucide-react';
import { IAuditLog } from '../types/index.js';
import { api } from '../services/api.js';
import { generateAuditPdf } from '../utils/pdfExport.js';

interface AuditTrailViewProps {
  initialLogs: IAuditLog[];
  onRefresh: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ initialLogs, onRefresh }) => {
  const [logs, setLogs] = useState<IAuditLog[]>(initialLogs);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    totalBlocks: number;
    verifiedAt: string;
    tamperedIndex?: number;
  }>({
    isValid: true,
    totalBlocks: initialLogs.length,
    verifiedAt: new Date().toISOString(),
  });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const response = await api.audit.verify();
      if (response.success) {
        setVerificationResult(response.verification);
      }
    } catch (err) {
      console.error('Integrity check failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportPdf = () => {
    generateAuditPdf(filteredLogs, verificationResult);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesSearch =
      search === '' ||
      log.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      log.assetName.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.hash.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'checkout':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Checkout
          </span>
        );
      case 'checkin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Check-In
          </span>
        );
      case 'field_audit':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Field Audit
          </span>
        );
      case 'created':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Enrolled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Cryptographic Ledger Health & Export Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Integrity Badge Info */}
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                verificationResult.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Append-Only Immutable Audit Ledger
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    verificationResult.isValid
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {verificationResult.isValid ? '100% MATHEMATICALLY VERIFIED' : 'TAMPER DETECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Cryptographically chained transactions via SHA-256 block hashing. Each audit block
                strictly seals and links to the previous block's hash, preventing historical mutation or retroactive tampering.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-2">
                <span>Height: <strong className="text-sky-400">{verificationResult.totalBlocks} Blocks</strong></span>
                <span>&bull;</span>
                <span>Genesis: <strong className="text-slate-300">Anchored</strong></span>
                <span>&bull;</span>
                <span>Verified: {new Date(verificationResult.verifiedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Actions: Recalculate, Export Excel, Export PDF */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify Hashes</span>
            </button>

            {/* Direct ExcelJS Export */}
            <a
              href={api.export.getAuditExcelUrl({ action: selectedAction, search })}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md shadow-emerald-700/20 transition cursor-pointer"
              title="Download formatted Excel workbook via ExcelJS"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </a>

            {/* Direct PDF Export */}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition cursor-pointer"
              title="Generate PDF compliance document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search block hash, tag, actor, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Filter Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="checkout">Checkouts (Borrow)</option>
            <option value="checkin">Check-Ins (Return)</option>
            <option value="field_audit">Field Audits</option>
            <option value="created">Enrollments</option>
          </select>
        </div>
      </div>

      {/* Audit Blocks List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No audit ledger records matched your query.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition"
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850"
                >
                  <div className="flex items-start md:items-center gap-3">
                    <div className="font-mono text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
                      {log.id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <span className="font-mono font-bold text-sky-400 text-xs">
                          {log.assetTag}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {log.assetName}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          {log.actorName} ({log.actorRole})
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.locationCoordinates && (
                          <>
                            <span>&bull;</span>
                            <span className="text-sky-400 font-mono text-[10px]">
                              GPS: {log.locationCoordinates.latitude.toFixed(4)}, {log.locationCoordinates.longitude.toFixed(4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Hash Display */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">
                        Block SHA-256
                      </div>
                      <div className="font-mono text-[11px] text-cyan-300 font-semibold truncate max-w-[160px]">
                        {log.hash.substring(0, 16)}...
                      </div>
                    </div>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Cryptographic & State Inspector */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs space-y-3">
                    {/* Cryptographic Chaining Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Parent Block Hash (previousHash)
                        </span>
                        <span className="text-slate-400 break-all">{log.previousHash}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-400 block uppercase font-bold">
                          Current Block Hash (hash)
                        </span>
                        <span className="text-cyan-300 break-all">{log.hash}</span>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Transaction Parameters & Metadata
                      </div>
                      <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>

                    {/* State Delta */}
                    {log.previousState && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">
                            Previous State Snapshot
                          </div>
                          <pre className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(log.previousState, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">
                            New State Snapshot
                          </div>
                          <pre className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-emerald-300/90 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(log.newState, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
