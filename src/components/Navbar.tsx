import React from 'react';
import {
  QrCode,
  ShieldCheck,
  ClipboardList,
  Layers,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { IUser } from '../types/index.js';

interface NavbarProps {
  activeTab: 'inventory' | 'scanner' | 'audit' | 'ledger' | 'security';
  setActiveTab: (tab: 'inventory' | 'scanner' | 'audit' | 'ledger' | 'security') => void;
  currentUser: IUser | null;
  onOpenScanner: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  chainValid: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenScanner,
  onOpenAuth,
  onLogout,
  chainValid,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  Asset<span className="text-sky-400">Pulse</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                QR Monitoring &bull; Append-Only Audit Ledger
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Assets
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Live Scanner
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Field Audit
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Audit Ledger
              {chainValid && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              2FA & SMTP
            </button>
          </nav>

          {/* Action Buttons & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Scan Action */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-sky-500/25 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Scan</span>
            </button>

            {/* Authenticated User or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/70 rounded-lg p-1 pr-2.5">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-md object-cover border border-slate-600"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-sky-400 uppercase font-mono">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="ml-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                <span>2FA Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950/80 overflow-x-auto px-2 py-1.5 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <Layers className="w-3 h-3" />
          Assets
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === 'scanner' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <QrCode className="w-3 h-3" />
          Scanner
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-3 h-3" />
          Field Audit
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === 'ledger' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-3 h-3" />
          Ledger
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === 'security' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Security
        </button>
      </div>
    </header>
  );
};
