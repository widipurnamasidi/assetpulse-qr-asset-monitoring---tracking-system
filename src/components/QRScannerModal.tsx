import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  CameraOff,
  Upload,
  Zap,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { IAsset } from '../types/index.js';
import { api } from '../services/api.js';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: IAsset) => void;
  onActionCheckout: (asset: IAsset) => void;
  onActionCheckin: (asset: IAsset) => void;
  onActionAudit: (asset: IAsset) => void;
  allAssets: IAsset[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  onActionCheckout,
  onActionCheckin,
  onActionAudit,
  allAssets,
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [resolvedAsset, setResolvedAsset] = useState<IAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'file' | 'presets'>('camera');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse QR text to extract assetTag (either JSON payload or plain tag)
  const extractAssetTag = (rawText: string): string => {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.assetTag) return parsed.assetTag;
    } catch {
      // Not JSON, check if contains AST- or URL
      const match = rawText.match(/AST-\d+/i);
      if (match) return match[0].toUpperCase();
    }
    return rawText.trim().toUpperCase();
  };

  const handleBarcodeDecoded = async (decodedText: string) => {
    setScannedResult(decodedText);
    const tag = extractAssetTag(decodedText);

    // Stop scanner camera
    stopCamera();

    setIsLoading(true);
    setCameraError(null);
    try {
      const response = await api.assets.scanTag(tag);
      if (response.success && response.data) {
        setResolvedAsset(response.data);
      } else {
        setCameraError(`Asset with tag '${tag}' was not found in registry.`);
      }
    } catch (err: any) {
      setCameraError(err.message || `Failed to resolve asset tag '${tag}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setResolvedAsset(null);
    setScannedResult(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleBarcodeDecoded(decodedText);
        },
        () => {
          // Ignore individual frame miss
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Unable to access camera feed. Please ensure camera permissions are allowed, or use File Scan or 1-Click Test Tags below.'
      );
      setScannerActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setScannerActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-file-processor');
      const result = await html5QrCode.scanFile(file, true);
      handleBarcodeDecoded(result);
    } catch (err: any) {
      setCameraError('No QR code detected in the selected image. Try another file or use 1-Click Test Tags.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick preset tester
  const handleQuickPreset = (asset: IAsset) => {
    setScannedResult(asset.assetTag);
    setResolvedAsset(asset);
    setCameraError(null);
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, scanMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Real-Time QR Scanner</h3>
              <p className="text-[11px] text-slate-400">
                Scan asset tags for Checkout, Check-In, or Field Audit
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Mode Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              scanMode === 'camera'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('file');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              scanMode === 'file'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Image File
          </button>

          <button
            onClick={() => {
              stopCamera();
              setScanMode('presets');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
              scanMode === 'presets'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick Test Tags ({allAssets.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Scanner Viewport */}
          {scanMode === 'camera' && (
            <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 min-h-[280px] flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />

              {/* Scanning visual overlay & guidelines */}
              {scannerActive && !resolvedAsset && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-sky-400/80 rounded-2xl relative shadow-lg">
                    {/* Laser scanning line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 animate-bounce" />
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded">
                      SEEKING QR TAG
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                    Align Asset QR Code inside frame
                  </div>
                </div>
              )}

              {/* Camera Error or Denied view */}
              {cameraError && (
                <div className="p-6 text-center max-w-sm">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-xs text-amber-300 font-medium mb-3">{cameraError}</p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                    <button
                      onClick={() => setScanMode('presets')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Use Demo Tags
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Mode */}
          {scanMode === 'file' && (
            <div>
              <div id="qr-file-processor" className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-8 text-center cursor-pointer bg-slate-950/40 transition group"
              >
                <Upload className="w-10 h-10 text-slate-500 group-hover:text-sky-400 mx-auto mb-3 transition" />
                <div className="text-sm font-semibold text-slate-200">
                  Upload an image containing an Asset QR Code
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPEG, WEBP snapshots from field phone
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* 1-Click Demo Test Barcodes Mode */}
          {scanMode === 'presets' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Select any enrolled asset to simulate instant QR scan:</span>
                <span className="text-amber-400 font-mono text-[11px]">Instant Simulation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {allAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleQuickPreset(asset)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-sky-400 font-mono">
                          {asset.assetTag}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            asset.status === 'available'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : asset.status === 'checked_out'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {asset.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 truncate font-medium mt-0.5">
                        {asset.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Asset Card with Action Triggers */}
          {resolvedAsset && (
            <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-4 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold text-sky-400 font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      {resolvedAsset.assetTag}
                    </span>
                    <span className="text-xs text-slate-400">{resolvedAsset.category}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        resolvedAsset.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : resolvedAsset.status === 'checked_out'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {resolvedAsset.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-tight">
                    {resolvedAsset.name}
                  </h4>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>SN: <strong className="text-slate-300 font-mono">{resolvedAsset.serialNumber}</strong></span>
                    <span>Loc: <strong className="text-slate-300">{resolvedAsset.location}</strong></span>
                    <span>Condition: <strong className="text-slate-300 uppercase">{resolvedAsset.condition}</strong></span>
                  </div>

                  {resolvedAsset.currentCustody && (
                    <div className="mt-2 text-xs bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-amber-300">
                      <strong>Current Custody:</strong> {resolvedAsset.currentCustody.name} ({resolvedAsset.currentCustody.department}) &bull; Due: {new Date(resolvedAsset.currentCustody.expectedReturnDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {resolvedAsset.qrCodeDataUrl && (
                  <img
                    src={resolvedAsset.qrCodeDataUrl}
                    alt="QR Tag"
                    className="w-16 h-16 rounded border border-slate-700 bg-white p-1 ml-3 shrink-0"
                  />
                )}
              </div>

              {/* Action Buttons for Scanned Asset */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800">
                {resolvedAsset.status === 'available' ? (
                  <button
                    onClick={() => {
                      onActionCheckout(resolvedAsset);
                      onClose();
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Check Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onActionCheckin(resolvedAsset);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Check In (Return)
                  </button>
                )}

                <button
                  onClick={() => {
                    onActionAudit(resolvedAsset);
                    onClose();
                  }}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Field Audit
                </button>

                <button
                  onClick={() => {
                    onSelectAsset(resolvedAsset);
                    onClose();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>html5-qrcode engine &bull; Route Model Binding pre-bound</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
