import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  HelpCircle,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { api } from '../services/api.js';
import { IUser, ISmtpDeliveryLog } from '../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: IUser, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [view, setView] = useState<'login' | '2fa' | 'forgot' | 'reset' | 'smtp'>('login');
  const [email, setEmail] = useState('alex.rivera@fieldops.com');
  const [password, setPassword] = useState('AssetPulse2026!');
  const [userId, setUserId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [smtpLogs, setSmtpLogs] = useState<ISmtpDeliveryLog[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<any>(null);

  // Poll SMTP logs to show real-time 2FA OTP codes
  const fetchSmtpLogs = async () => {
    try {
      const res = await api.auth.getSmtpLogs();
      if (res.success) {
        setSmtpLogs(res.logs);
        setSmtpConfig(res.smtpConfig);
      }
    } catch (err) {
      console.warn('Failed to load SMTP logs:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSmtpLogs();
    }
  }, [isOpen, view]);

  if (!isOpen) return null;

  // Preset demo accounts
  const applyDemoAccount = (role: 'tech' | 'admin' | 'mgr') => {
    if (role === 'tech') {
      setEmail('alex.rivera@fieldops.com');
      setPassword('AssetPulse2026!');
    } else if (role === 'admin') {
      setEmail('marcus.vance@assetpulse.internal');
      setPassword('AssetPulse2026!');
    } else {
      setEmail('elena.rostova@operations.com');
      setPassword('AssetPulse2026!');
    }
    setError(null);
  };

  // 1. Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await api.auth.login(email, password);

      if (!res.success) {
        setError(res.error || 'Invalid credentials.');
        return;
      }

      if (res.requires2FA) {
        setUserId(res.userId);
        setMaskedEmail(res.maskedEmail || email);
        setView('2fa');
        setSuccessMessage('6-digit security code generated and dispatched via Nodemailer.');
        await fetchSmtpLogs();
      } else {
        localStorage.setItem('assetpulse_token', res.token);
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 2FA OTP Verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.verify2FA(userId, otpCode.trim());

      if (res.success) {
        localStorage.setItem('assetpulse_token', res.token);
        onAuthSuccess(res.user, res.token);
        onClose();
      } else {
        setError(res.error || 'Invalid 6-digit OTP code.');
      }
    } catch (err: any) {
      setError(err.message || '2FA verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend 2FA OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.resendOtp(userId);
      if (res.success) {
        setSuccessMessage('A new 6-digit OTP code was generated and sent.');
        await fetchSmtpLogs();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.forgotPassword(email);
      if (res.success) {
        setUserId(res.userId || '');
        setView('reset');
        setSuccessMessage('A 6-digit password recovery code was sent via Nodemailer.');
        await fetchSmtpLogs();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.auth.resetPassword(userId, otpCode.trim(), newPassword);
      if (res.success) {
        setView('login');
        setPassword(newPassword);
        setSuccessMessage('Password reset successfully! Please log in.');
      } else {
        setError(res.error || 'Password reset failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Latest OTP helper for quick fill
  const latestOtpForUser = smtpLogs.find(
    (l) => l.to.toLowerCase() === email.toLowerCase() || l.to.toLowerCase().includes('field')
  )?.otpCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {view === 'login' && 'Field Technician Authentication'}
                {view === '2fa' && 'Two-Factor Authentication (2FA)'}
                {view === 'forgot' && 'Password Recovery Request'}
                {view === 'reset' && 'Set New Password'}
                {view === 'smtp' && 'Nodemailer Google SMTP Center'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Stateless JWT &bull; Bcrypt &bull; 6-Digit Google SMTP OTP
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Login View */}
        {view === 'login' && (
          <div className="p-6 space-y-4">
            {/* Demo Quick Fills */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                Quick Sign-In Presets (Pre-configured Enterprise Accounts):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyDemoAccount('tech')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-left transition cursor-pointer"
                >
                  <div className="font-bold text-sky-400">Field Tech</div>
                  <div className="text-[10px] text-slate-500 truncate">Alex Rivera</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyDemoAccount('admin')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-left transition cursor-pointer"
                >
                  <div className="font-bold text-purple-400">Admin</div>
                  <div className="text-[10px] text-slate-500 truncate">Marcus Vance</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyDemoAccount('mgr')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-left transition cursor-pointer"
                >
                  <div className="font-bold text-emerald-400">Logistics Mgr</div>
                  <div className="text-[10px] text-slate-500 truncate">Elena Rostova</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setView('forgot');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In with 2FA Challenge'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Google SMTP 16-Digit App Password</span>
              <button
                onClick={() => setView('smtp')}
                className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Inbox className="w-3.5 h-3.5" />
                View SMTP Queue
              </button>
            </div>
          </div>
        )}

        {/* 2. 2FA Verification View */}
        {view === '2fa' && (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-sky-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Enter 6-Digit One-Time Security Code</h4>
              <p className="text-xs text-slate-400">
                Dispatched to <strong className="text-slate-200">{maskedEmail}</strong> via Google SMTP.
              </p>
            </div>

            {/* In-Modal Real-Time Technician OTP Preview for Instant Testing */}
            {latestOtpForUser && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-400 font-bold uppercase block">
                    ⚡ Live Technician Inbox Preview:
                  </span>
                  <span className="text-slate-300">
                    Latest Dispatched OTP: <strong className="font-mono text-sky-300 text-sm">{latestOtpForUser}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(latestOtpForUser)}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold cursor-pointer transition"
                >
                  Auto-Fill OTP
                </button>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-3 bg-slate-950 border border-slate-700 rounded-xl text-xl tracking-[10px] font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Resend 6-Digit OTP
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  Switch Account
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-sky-600/20 transition cursor-pointer"
              >
                {isLoading ? 'Verifying 2FA Token...' : 'Authenticate Technician Session'}
              </button>
            </form>
          </div>
        )}

        {/* 3. Forgot Password View */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white">Reset Account Password</h4>
              <p className="text-xs text-slate-400">
                Enter your registered email address. We will dispatch a 6-digit recovery OTP.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-md transition cursor-pointer"
            >
              {isLoading ? 'Dispatching OTP...' : 'Send Recovery OTP'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. Reset Password View */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white">Enter Recovery Code & New Password</h4>
              <p className="text-xs text-slate-400">
                Enter the 6-digit OTP code sent to your email and your new password.
              </p>
            </div>

            {latestOtpForUser && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 text-xs flex items-center justify-between">
                <span className="text-slate-300">
                  Recovery OTP: <strong className="font-mono text-sky-300">{latestOtpForUser}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(latestOtpForUser)}
                  className="text-[11px] font-semibold text-sky-400 hover:underline cursor-pointer"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                6-Digit Recovery OTP
              </label>
              <input
                type="text"
                required
                placeholder="6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-center text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password (minimum 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md transition cursor-pointer"
            >
              {isLoading ? 'Hashing & Updating...' : 'Update Password & Return to Login'}
            </button>
          </form>
        )}

        {/* 5. Nodemailer Google SMTP Center */}
        {view === 'smtp' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400" />
                  Nodemailer Google SMTP Specs
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">PORT 465 SSL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Technical Specification: 6-digit OTP verification delivered to field technicians via
                Nodemailer using Google SMTP configured with 16-digit Google App Passwords.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-900 p-2 rounded border border-slate-800">
                <div>Host: smtp.gmail.com | Port: 465 (Secure: true)</div>
                <div>Auth: GOOGLE_SMTP_USER &amp; GOOGLE_SMTP_APP_PASSWORD (16-char)</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Live Dispatched OTP Queue ({smtpLogs.length})
                </span>
                <button
                  onClick={fetchSmtpLogs}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {smtpLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No OTP emails dispatched yet. Trigger a login to inspect live delivery.
                  </div>
                ) : (
                  smtpLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate">{log.to}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(log.sentAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{log.type}</span>
                        <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                          OTP: {log.otpCode}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
