import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  QrCode,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  MoreHorizontal,
  Printer,
  ChevronRight,
  Tag,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { IAsset, AssetStatus, AssetCondition } from '../types/index.js';
import { api } from '../services/api.js';

interface AssetTableProps {
  assets: IAsset[];
  categories: string[];
  onSelectAsset: (asset: IAsset) => void;
  onCheckout: (asset: IAsset) => void;
  onCheckin: (asset: IAsset) => void;
  onAudit: (asset: IAsset) => void;
  onPrintQR: (asset: IAsset) => void;
  onNewAsset: () => void;
  onRefresh: () => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  categories,
  onSelectAsset,
  onCheckout,
  onCheckin,
  onAudit,
  onPrintQR,
  onNewAsset,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      search === '' ||
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      (a.currentCustody?.name && a.currentCustody.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Available
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Checked Out
          </span>
        );
      case 'in_audit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            In Audit
          </span>
        );
      case 'under_maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getConditionColor = (cond: AssetCondition) => {
    switch (cond) {
      case 'excellent':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'good':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'fair':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90">
        {/* Left: Search input */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tag (AST-), name, serial number, technician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Depot)</option>
            <option value="checked_out">Checked Out (Field)</option>
            <option value="in_audit">In Audit</option>
            <option value="under_maintenance">Maintenance</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* ExcelJS Inventory Export */}
          <a
            href={api.export.getAssetsExcelUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Download formatted Excel workbook via ExcelJS"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </a>

          {/* Enroll New Asset */}
          <button
            onClick={onNewAsset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll Asset</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">QR</th>
              <th className="py-3 px-4">Asset Tag</th>
              <th className="py-3 px-4">Equipment Details</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-4">Location / Custody</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No assets matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-slate-800/40 transition group"
                >
                  {/* QR Thumbnail */}
                  <td className="py-3 px-4 text-center">
                    {asset.qrCodeDataUrl ? (
                      <button
                        onClick={() => onPrintQR(asset)}
                        title="Click to view/print QR Label"
                        className="inline-block p-1 bg-white rounded border border-slate-600 hover:border-sky-400 transition cursor-pointer"
                      >
                        <img
                          src={asset.qrCodeDataUrl}
                          alt="QR"
                          className="w-7 h-7 object-contain"
                        />
                      </button>
                    ) : (
                      <QrCode className="w-6 h-6 text-slate-600 mx-auto" />
                    )}
                  </td>

                  {/* Asset Tag */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => onSelectAsset(asset)}
                      className="font-mono font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      {asset.assetTag}
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      SN: {asset.serialNumber}
                    </div>
                  </td>

                  {/* Equipment Name & Model */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white group-hover:text-sky-300 transition">
                      {asset.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-400">{asset.category}</span>
                      <span>&bull;</span>
                      <span className="text-slate-500">{asset.manufacturer}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(asset.status)}
                  </td>

                  {/* Condition */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getConditionColor(
                        asset.condition
                      )}`}
                    >
                      {asset.condition.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Location & Custody */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{asset.location}</span>
                    </div>
                    {asset.currentCustody ? (
                      <div className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                        Held by: {asset.currentCustody.name}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {asset.department}
                      </div>
                    )}
                  </td>

                  {/* Contextual Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {asset.status === 'available' ? (
                        <button
                          onClick={() => onCheckout(asset)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          Checkout
                        </button>
                      ) : (
                        <button
                          onClick={() => onCheckin(asset)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Return
                        </button>
                      )}

                      <button
                        onClick={() => onAudit(asset)}
                        title="Conduct Field Audit"
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectAsset(asset)}
                        title="View Asset Dossier"
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
        <span>Showing {filteredAssets.length} of {assets.length} assets registered</span>
        <span className="font-mono text-slate-500 text-[11px]">Eager Route Model Binding Active</span>
      </div>
    </div>
  );
};
