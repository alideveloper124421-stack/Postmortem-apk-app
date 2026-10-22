/**
 * Overview & Executive Forensic Dashboard
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Lock,
  Layers,
  Code2,
  Bug,
  Key,
  Globe,
  Radio,
} from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';

interface OverviewDashboardProps {
  apk: ApkAnalysisResult;
  onNavigateTab: (tabId: string) => void;
  onDownloadReport: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  apk,
  onNavigateTab,
  onDownloadReport,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const scoreColor =
    apk.securityAudit.score < 50
      ? 'text-red-400 border-red-500/40 bg-red-950/20'
      : apk.securityAudit.score < 80
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/20'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';

  const ratingBadge =
    apk.securityAudit.riskRating === 'CRITICAL'
      ? 'bg-red-950 border-red-800 text-red-400'
      : apk.securityAudit.riskRating === 'HIGH'
      ? 'bg-orange-950 border-orange-800 text-orange-400'
      : apk.securityAudit.riskRating === 'MEDIUM'
      ? 'bg-amber-950 border-amber-800 text-amber-400'
      : 'bg-emerald-950 border-emerald-800 text-emerald-400';

  const exportedCount = apk.manifest.components.filter((c) => c.exported).length;
  const dangerousPermCount = apk.manifest.permissions.filter((p) => p.isDangerous).length;

  return (
    <div className="space-y-6">
      {/* Target Application Header Dossier */}
      <div className="p-5 sm:p-6 rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                APK Target
              </span>
              <span className={`text-xs uppercase font-mono px-2 py-0.5 rounded border font-bold ${ratingBadge}`}>
                {apk.securityAudit.riskRating} RISK
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Analyzed: {new Date(apk.analyzedAt).toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
              {apk.manifest.appLabel}
              <span className="text-sm font-normal text-zinc-400 font-mono">
                ({apk.fileName})
              </span>
            </h2>
            <p className="text-sm font-mono text-emerald-400">
              {apk.manifest.packageName}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onDownloadReport}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Deep Postmortem (.txt)</span>
            </button>
            <button
              onClick={() => onNavigateTab('smali')}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Inspect Smali Tree ({apk.dex.classes.length})</span>
            </button>
            <button
              onClick={() => onNavigateTab('frida')}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all"
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Frida Hook Lab ({apk.fridaScripts.length})</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Hashes Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80 font-mono text-xs">
            <div className="truncate">
              <span className="text-zinc-500 text-[10px] block">MD5 HASH</span>
              <span className="text-zinc-300 select-all truncate">{apk.hashes.md5}</span>
            </div>
            <button
              onClick={() => handleCopyHash('md5', apk.hashes.md5)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title="Copy MD5"
            >
              {copiedHash === 'md5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80 font-mono text-xs">
            <div className="truncate">
              <span className="text-zinc-500 text-[10px] block">SHA-1 HASH</span>
              <span className="text-zinc-300 select-all truncate">{apk.hashes.sha1}</span>
            </div>
            <button
              onClick={() => handleCopyHash('sha1', apk.hashes.sha1)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title="Copy SHA-1"
            >
              {copiedHash === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80 font-mono text-xs">
            <div className="truncate">
              <span className="text-zinc-500 text-[10px] block">SHA-256 HASH</span>
              <span className="text-zinc-300 select-all truncate">{apk.hashes.sha256}</span>
            </div>
            <button
              onClick={() => handleCopyHash('sha256', apk.hashes.sha256)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title="Copy SHA-256"
            >
              {copiedHash === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className={`p-5 rounded-xl border ${scoreColor} flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">
              Security Score
            </span>
            {apk.securityAudit.score < 50 ? (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="mt-3">
            <div className="text-4xl font-black font-mono">
              {apk.securityAudit.score}
              <span className="text-lg font-normal text-zinc-500">/100</span>
            </div>
            <p className="text-xs mt-1 text-zinc-400">
              {apk.securityAudit.criticalCount} Critical, {apk.securityAudit.highCount} High issues
            </p>
          </div>
        </div>

        {/* APK Architecture & SDK */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
              SDK & Build
            </span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold font-mono text-zinc-100">
              API {apk.manifest.minSdkVersion} → {apk.manifest.targetSdkVersion}
            </div>
            <p className="text-xs mt-1 text-zinc-400">
              Version {apk.manifest.versionName} (Build {apk.manifest.versionCode})
            </p>
          </div>
        </div>

        {/* Dalvik & Code Metrics */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
              Smali & Dalvik
            </span>
            <Code2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-zinc-100">
              {apk.dex.classesCount.toLocaleString()}
              <span className="text-xs font-normal text-zinc-400 ml-1">classes</span>
            </div>
            <p className="text-xs mt-1 text-zinc-400 font-mono">
              {apk.dex.methodsCount.toLocaleString()} methods • {apk.dex.stringsCount.toLocaleString()} strings
            </p>
          </div>
        </div>

        {/* Archive & Native Structure */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
              Archive Size
            </span>
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-zinc-100">
              {apk.fileSizeBytesFormatted}
            </div>
            <p className="text-xs mt-1 text-zinc-400 font-mono">
              {apk.files.length} indexed files • {apk.dex.dexCount} DEX
            </p>
          </div>
        </div>
      </div>

      {/* Critical Security Postmortem Indicators */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase font-mono mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Critical Security Flags & Attack Vectors Postmortem
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Debuggable */}
          <div className={`p-3.5 rounded-lg border ${apk.manifest.debuggable ? 'bg-red-950/40 border-red-800/70' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">android:debuggable</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${apk.manifest.debuggable ? 'bg-red-900 text-red-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                {apk.manifest.debuggable ? 'TRUE (CRITICAL)' : 'FALSE (SECURE)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {apk.manifest.debuggable
                ? 'JDWP debugger can be attached to dump memory and bypass authorization.'
                : 'Debugger attachment blocked in production.'}
            </p>
          </div>

          {/* Cleartext Traffic */}
          <div className={`p-3.5 rounded-lg border ${apk.manifest.usesCleartextTraffic ? 'bg-red-950/40 border-red-800/70' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">usesCleartextTraffic</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${apk.manifest.usesCleartextTraffic ? 'bg-red-900 text-red-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                {apk.manifest.usesCleartextTraffic ? 'ENABLED (HIGH RISK)' : 'DISABLED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {apk.manifest.usesCleartextTraffic
                ? 'Allows unencrypted plain HTTP calls susceptible to MITM packet sniffing.'
                : 'TLS encryption enforced across network calls.'}
            </p>
          </div>

          {/* Allow Backup */}
          <div className={`p-3.5 rounded-lg border ${apk.manifest.allowBackup ? 'bg-amber-950/40 border-amber-800/70' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">android:allowBackup</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${apk.manifest.allowBackup ? 'bg-amber-900 text-amber-200' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                {apk.manifest.allowBackup ? 'TRUE (WARN)' : 'FALSE'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {apk.manifest.allowBackup
                ? 'Private SQLite DB and SharedPreferences can be extracted with "adb backup".'
                : 'Backup extraction disabled.'}
            </p>
          </div>

          {/* Exported Components */}
          <div className={`p-3.5 rounded-lg border ${exportedCount > 0 ? 'bg-orange-950/30 border-orange-800/60' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">Exported Components</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold">
                {exportedCount} PUBLIC
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Components accessible by third-party apps without permissions.
            </p>
          </div>

          {/* Dangerous Permissions */}
          <div className={`p-3.5 rounded-lg border ${dangerousPermCount > 2 ? 'bg-red-950/30 border-red-800/60' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">Dangerous Permissions</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold">
                {dangerousPermCount} REQUESTED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {apk.manifest.permissions.filter((p) => p.isDangerous).map((p) => p.shortName).slice(0, 3).join(', ')}...
            </p>
          </div>

          {/* Hardcoded Secrets */}
          <div className={`p-3.5 rounded-lg border ${apk.dex.interestingStrings.length > 0 ? 'bg-red-950/30 border-red-800/60' : 'bg-zinc-950 border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-zinc-300">Leaked Bytecode Keys</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold">
                {apk.dex.interestingStrings.length} DETECTED
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Extracted API credentials, crypto keys, and endpoints in DEX pool.
            </p>
          </div>
        </div>
      </div>

      {/* OWASP MASVS Compliance Category Matrix */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase font-mono mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          OWASP Mobile Application Security Verification Standard (MASVS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apk.securityAudit.owaspMatrix.map((cat) => {
            const barColor =
              cat.status === 'FAIL'
                ? 'bg-red-500'
                : cat.status === 'WARN'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div key={cat.id} className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">{cat.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    cat.status === 'FAIL'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : cat.status === 'WARN'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {cat.status} ({cat.score}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${cat.score}%` }} />
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">
                  {cat.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
