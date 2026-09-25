/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { DashboardMetrics } from './components/DashboardMetrics.js';
import { AssetTable } from './components/AssetTable.js';
import { QRScannerModal } from './components/QRScannerModal.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { CheckinModal } from './components/CheckinModal.js';
import { FieldAuditModal } from './components/FieldAuditModal.js';
import { PrintQRModal } from './components/PrintQRModal.js';
import { AssetDetailModal } from './components/AssetDetailModal.js';
import { NewAssetModal } from './components/NewAssetModal.js';
import { AuditTrailView } from './components/AuditTrailView.js';
import { FieldAuditStation } from './components/FieldAuditStation.js';
import { SecurityCenter } from './components/SecurityCenter.js';
import { AuthModal } from './components/AuthModal.js';
import { api } from './services/api.js';
import { IAsset, IAuditLog, IUser } from './types/index.js';
import { CheckCircle2, QrCode, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'scanner' | 'audit' | 'ledger' | 'security'>('inventory');
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    checkedOut: 0,
    underMaintenance: 0,
    inAudit: 0,
    totalValue: 0,
    utilizationRate: 0,
  });
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [integrity, setIntegrity] = useState({
    isValid: true,
    totalBlocks: 0,
    verifiedAt: new Date().toISOString(),
  });
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [technicians, setTechnicians] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isFieldAuditOpen, setIsFieldAuditOpen] = useState(false);
  const [isPrintQROpen, setIsPrintQROpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<IAsset | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, auditRes, techsRes] = await Promise.all([
        api.assets.list(),
        api.audit.list(),
        api.auth.getTechnicians(),
      ]);

      if (assetsRes.success) {
        setAssets(assetsRes.data);
        setMetrics(assetsRes.metrics);
        setCategories(assetsRes.categories);
      }

      if (auditRes.success) {
        setAuditLogs(auditRes.data);
        if (auditRes.integrity) {
          setIntegrity(auditRes.integrity);
        }
      }

      if (techsRes.success) {
        setTechnicians(techsRes.technicians);
        // Default authenticate as Field Technician Alex Rivera if not logged in
        if (!currentUser && techsRes.technicians.length > 0) {
          setCurrentUser(techsRes.technicians[0]);
        }
      }
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleVerifyLedger = async () => {
    setIsVerifyingLedger(true);
    try {
      const res = await api.audit.verify();
      if (res.success) {
        setIntegrity(res.verification);
        showToast(res.message);
      }
    } catch (err) {
      console.error('Ledger verification error:', err);
    } finally {
      setIsVerifyingLedger(false);
    }
  };

  const handleAssetUpdated = (updated: IAsset, actionMessage?: string) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAsset(updated);
    // Reload audit logs to pull newly appended cryptographic transaction
    api.audit.list().then((res) => {
      if (res.success) {
        setAuditLogs(res.data);
        if (res.integrity) setIntegrity(res.integrity);
      }
    });
    // Refresh metrics
    api.assets.list().then((res) => {
      if (res.success) {
        setMetrics(res.metrics);
      }
    });

    if (actionMessage) {
      showToast(actionMessage);
    }
  };

  const handleNewAssetCreated = (newAsset: IAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    showToast(`Asset ${newAsset.assetTag} successfully catalogued into inventory!`);
    loadInitialData();
  };

  const openCheckout = (asset: IAsset) => {
    setSelectedAsset(asset);
    setIsCheckoutOpen(true);
  };

  const openCheckin = (asset: IAsset) => {
    setSelectedAsset(asset);
    setIsCheckinOpen(true);
  };

  const openAudit = (asset: IAsset) => {
    setSelectedAsset(asset);
    setIsFieldAuditOpen(true);
  };

  const openPrintQR = (asset: IAsset) => {
    setSelectedAsset(asset);
    setIsPrintQROpen(true);
  };

  const openDetail = (asset: IAsset) => {
    setSelectedAsset(asset);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-slate-900 border border-sky-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Enterprise Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('assetpulse_token');
          setCurrentUser(null);
          showToast('Signed out of field technician session.');
        }}
        chainValid={integrity.isValid}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Dashboard Metrics */}
        <DashboardMetrics
          metrics={metrics}
          integrity={integrity}
          onVerifyLedger={handleVerifyLedger}
          isVerifying={isVerifyingLedger}
        />

        {/* Tab 1: Asset Inventory Master List */}
        {activeTab === 'inventory' && (
          <AssetTable
            assets={assets}
            categories={categories}
            onSelectAsset={openDetail}
            onCheckout={openCheckout}
            onCheckin={openCheckin}
            onAudit={openAudit}
            onPrintQR={openPrintQR}
            onNewAsset={() => setIsNewAssetOpen(true)}
            onRefresh={loadInitialData}
          />
        )}

        {/* Tab 2: Live QR Scanner Hub */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Camera QR Scanner</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Utilizes html5-qrcode video feed. Point web camera or mobile device at any equipment
                  tag to immediately initiate Checkout, Check-In, or Field Audit.
                </p>
              </div>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition cursor-pointer"
              >
                Launch QR Camera &amp; Barcode Scanner
              </button>

              <p className="text-[11px] text-slate-500">
                Tip: If camera is disabled in your environment, use image upload or the 1-click Quick Test Tags.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Field Audit Station */}
        {activeTab === 'audit' && (
          <FieldAuditStation
            assets={assets}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSelectForAudit={openAudit}
          />
        )}

        {/* Tab 4: Append-Only Immutable Audit Ledger */}
        {activeTab === 'ledger' && (
          <AuditTrailView initialLogs={auditLogs} onRefresh={loadInitialData} />
        )}

        {/* Tab 5: 2FA & Google SMTP Center */}
        {activeTab === 'security' && (
          <SecurityCenter
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AssetPulse Core System &bull; Express MVC Backend &bull; Mongoose Session Transactions</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            ExcelJS (.xlsx) &bull; PDFKit/jsPDF (.pdf) &bull; SHA-256 Chaining
          </div>
        </div>
      </footer>

      {/* Interactive Dialogs & Modals */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectAsset={openDetail}
        onActionCheckout={openCheckout}
        onActionCheckin={openCheckin}
        onActionAudit={openAudit}
        allAssets={assets}
      />

      <CheckoutModal
        asset={selectedAsset}
        currentUser={currentUser}
        technicians={technicians}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(updated) =>
          handleAssetUpdated(updated, `Asset ${updated.assetTag} successfully checked out!`)
        }
      />

      <CheckinModal
        asset={selectedAsset}
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onSuccess={(updated) =>
          handleAssetUpdated(updated, `Asset ${updated.assetTag} successfully checked in!`)
        }
      />

      <FieldAuditModal
        asset={selectedAsset}
        isOpen={isFieldAuditOpen}
        onClose={() => setIsFieldAuditOpen(false)}
        onSuccess={(updated) =>
          handleAssetUpdated(updated, `Field audit for ${updated.assetTag} committed to ledger!`)
        }
      />

      <PrintQRModal
        asset={selectedAsset}
        isOpen={isPrintQROpen}
        onClose={() => setIsPrintQROpen(false)}
      />

      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onCheckout={openCheckout}
        onCheckin={openCheckin}
        onAudit={openAudit}
        onPrintQR={openPrintQR}
      />

      <NewAssetModal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        onSuccess={handleNewAssetCreated}
        categories={categories}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          showToast(`Authenticated as ${user.name} (${user.role.toUpperCase()})`);
        }}
      />
    </div>
  );
}
