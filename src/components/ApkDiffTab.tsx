/**
 * Differential APK Analysis (Diff Checker)
 * Compares two APKs side-by-side to track bytecode, permission, and component changes.
 */

import React, { useState } from 'react';
import { GitCompare, Plus, Minus, ArrowRight, ShieldCheck, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';
import { compareApks, DiffResult } from '../utils/apkDiffEngine';
import { getSecureVaultDemoApk, getNeoGameDemoApk } from '../utils/demoPresets';
import { analyzeApkFile } from '../utils/apkAnalyzer';

interface ApkDiffTabProps {
  currentApk: ApkAnalysisResult;
}

export const ApkDiffTab: React.FC<ApkDiffTabProps> = ({ currentApk }) => {
  const [compareTargetApk, setCompareTargetApk] = useState<ApkAnalysisResult>(getSecureVaultDemoApk());
  const [isUploadingSecond, setIsUploadingSecond] = useState(false);

  const diff: DiffResult = compareApks(currentApk, compareTargetApk);

  const handleSecondFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingSecond(true);
      try {
        const result = await analyzeApkFile(e.target.files[0]);
        setCompareTargetApk(result);
      } catch (err) {
        console.error('Error analyzing second APK for diff:', err);
      } finally {
        setIsUploadingSecond(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Comparison Selector */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <GitCompare className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-zinc-100 text-sm">Differential APK Comparison</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500">Compare Against:</span>
          <button
            onClick={() => setCompareTargetApk(getSecureVaultDemoApk())}
            className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
          >
            🛡️ SecureVault (Hardened)
          </button>
          <button
            onClick={() => setCompareTargetApk(getNeoGameDemoApk())}
            className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
          >
            🎮 NeoGame (Native .so)
          </button>

          <label className="flex items-center space-x-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploadingSecond ? 'Analyzing...' : 'Upload 2nd APK'}</span>
            <input type="file" accept=".apk,.zip" onChange={handleSecondFileSelected} className="hidden" />
          </label>
        </div>
      </div>

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* APK A */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase font-bold block">BASE APK (ORIGINAL)</span>
          <div className="font-bold text-zinc-200 text-sm truncate">{diff.apkA.name}</div>
          <div className="text-zinc-400">Version: {diff.apkA.version}</div>
          <div className="text-zinc-500 text-[11px] truncate">MD5: {diff.apkA.md5}</div>
        </div>

        {/* APK B */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">TARGET APK (MODIFIED / COMPARED)</span>
            <span className="text-[11px] text-emerald-400 font-bold">Size Delta: {diff.sizeDeltaFormatted}</span>
          </div>
          <div className="font-bold text-zinc-200 text-sm truncate">{diff.apkB.name}</div>
          <div className="text-zinc-400">Version: {diff.apkB.version}</div>
          <div className="text-zinc-500 text-[11px] truncate">MD5: {diff.apkB.md5}</div>
        </div>
      </div>

      {/* Security Flags Delta */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3 font-mono text-xs">
        <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
          Manifest & Build Flags Comparison
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {diff.securityFlagsDiff.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                item.changed ? 'bg-amber-950/20 border-amber-800/60' : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div className="text-zinc-400 text-[10px] uppercase">{item.flag}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-zinc-400 line-through">{String(item.valueA)}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
                <span className={item.changed ? 'text-amber-300 font-bold' : 'text-zinc-200'}>
                  {String(item.valueB)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Diff */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3 font-mono text-xs">
        <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
          Permissions Delta ({diff.permissionsDiff.added.length} Added, {diff.permissionsDiff.removed.length} Removed)
        </h4>

        {diff.permissionsDiff.added.length > 0 && (
          <div className="space-y-1">
            <span className="text-emerald-400 font-bold text-[10px] uppercase">New Permissions Added (+):</span>
            <div className="space-y-1">
              {diff.permissionsDiff.added.map((p, idx) => (
                <div key={idx} className="p-2 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 flex items-center space-x-2">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {diff.permissionsDiff.removed.length > 0 && (
          <div className="space-y-1">
            <span className="text-red-400 font-bold text-[10px] uppercase">Permissions Removed (-):</span>
            <div className="space-y-1">
              {diff.permissionsDiff.removed.map((p, idx) => (
                <div key={idx} className="p-2 rounded bg-red-950/30 border border-red-900/50 text-red-300 flex items-center space-x-2">
                  <Minus className="w-3.5 h-3.5 text-red-400" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Components & Classes Delta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Components Delta */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
          <span className="font-bold text-zinc-300 uppercase text-[11px] block">Components Delta</span>
          <div className="text-zinc-400">
            {diff.componentsDiff.added.length} components added • {diff.componentsDiff.removed.length} components removed
          </div>
          {diff.componentsDiff.added.slice(0, 3).map((c, i) => (
            <div key={i} className="text-emerald-400 text-[11px] truncate">+ {c}</div>
          ))}
          {diff.componentsDiff.removed.slice(0, 3).map((c, i) => (
            <div key={i} className="text-red-400 text-[11px] truncate">- {c}</div>
          ))}
        </div>

        {/* Classes Delta */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
          <span className="font-bold text-zinc-300 uppercase text-[11px] block">DEX Classes Delta</span>
          <div className="text-zinc-400">
            {diff.classesDiff.addedCount} classes added • {diff.classesDiff.removedCount} classes removed
          </div>
          {diff.classesDiff.addedSamples.slice(0, 3).map((c, i) => (
            <div key={i} className="text-emerald-400 text-[11px] truncate">+ {c}</div>
          ))}
          {diff.classesDiff.removedSamples.slice(0, 3).map((c, i) => (
            <div key={i} className="text-red-400 text-[11px] truncate">- {c}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
