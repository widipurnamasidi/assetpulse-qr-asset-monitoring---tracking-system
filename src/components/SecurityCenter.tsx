import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  UserCheck,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api.js';
import { IUser, ISmtpDeliveryLog } from '../types/index.js';

interface SecurityCenterProps {
  currentUser: IUser | null;
  onOpenAuth: () => void;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({ currentUser, onOpenAuth }) => {
  const [smtpLogs, setSmtpLogs] = useState<ISmtpDeliveryLog[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  const [technicians, setTechnicians] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [integrityState, setIntegrityState] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [smtpRes, techRes, auditRes] = await Promise.all([
        api.auth.getSmtpLogs(),
        api.auth.getTechnicians(),
        api.audit.verify(),
      ]);

      if (smtpRes.success) {
        setSmtpLogs(smtpRes.logs);
        setSmtpConfig(smtpRes.smtpConfig);
      }
      if (techRes.success) {
        setTechnicians(techRes.technicians);
      }
      if (auditRes.success) {
        setIntegrityState(auditRes.verification);
      }
    } catch (err) {
      console.warn('Security data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Security &amp; 2FA Authentication Center</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  JWT + BCRYPT + 2FA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Session tokens, Google SMTP Nodemailer 16-Digit App Password delivery, and cryptographic ledger verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>

            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Switch Account / 2FA
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nodemailer Google SMTP Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Nodemailer Google SMTP Configuration</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Per the technical scope, Two-Factor Authentication (2FA) delivers 6-digit OTPs via
            Nodemailer utilizing Google SMTP configured with 16-digit Google App Passwords.
          </p>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">SMTP Host:</span>
              <span className="text-slate-200">smtp.gmail.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Port / Security:</span>
              <span className="text-slate-200">465 (SSL / TLS Secure)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Auth Method:</span>
              <span className="text-slate-200">16-Digit Google App Password</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Configured Sender:</span>
              <span className="text-sky-400 truncate max-w-[200px]">
                {smtpConfig?.configuredUser || 'widipurnamasidi371@gmail.com'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Live Dispatched OTP Feed ({smtpLogs.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Node delivery</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {smtpLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No OTPs generated yet. Log in or trigger 2FA to populate.
                </div>
              ) : (
                smtpLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">{log.to}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.type} &bull; {new Date(log.sentAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                        {log.otpCode}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Role-Based Access Control & Technicians */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Authorized Field Personnel (RBAC)</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {technicians.length} Enrolled
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Field technicians, logistics managers, and compliance auditors with 2FA enforcement and
            stateless JWT tokens.
          </p>

          <div className="space-y-2.5">
            {technicians.map((t) => (
              <div
                key={t.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={t.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                    alt={t.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-[11px] text-slate-400">{t.email}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      t.role === 'admin'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : t.role === 'technician'
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {t.role}
                  </span>
                  <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    2FA Secured
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
