/**
 * Final Deep Postmortem Report Viewer & Downloader Tab
 * Exhaustive forensic & modding dossier with .txt, .md, and standalone interactive .html downloads!
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Globe,
  Crosshair,
  Terminal,
  ShieldCheck,
  Key,
  Layers,
} from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';

interface PostmortemReportTabProps {
  apk: ApkAnalysisResult;
  onDownloadReport: () => void;
}

export const PostmortemReportTab: React.FC<PostmortemReportTabProps> = ({
  apk,
  onDownloadReport,
}) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const reportText = apk.postmortemTextReport;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# APK DEEP POSTMORTEM REPORT\n\`\`\`text\n${reportText}\n\`\`\``;
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POSTMORTEM_${apk.manifest.packageName}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtmlDossier = () => {
    const htmlContent = apk.interactiveHtmlReport || '<!DOCTYPE html><html><body><h1>No HTML report generated</h1></body></html>';
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APK_DOSSIER_${apk.manifest.packageName}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLines = search
    ? reportText.split('\n').filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="space-y-6">
      {/* Top Action Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100">
              Complete Forensic & Modder Dossier Ready
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              TRIPLE EXPORT
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Includes detected Kill-Switches with Smali patches, Ad SDKs to nuke, Master Frida script, decoded AndroidManifest.xml, extracted API keys/secrets, OWASP MASVS risk rating, and JNI binary symbols.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadHtmlDossier}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
            title="Download interactive HTML dashboard that opens in any browser with search and copyable patches"
          >
            <Globe className="w-4 h-4" />
            <span>Interactive HTML Dossier (.html)</span>
          </button>

          <button
            onClick={onDownloadReport}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Plain Text (.txt)</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown (.md)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied All!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick Jump Anchors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">Quick Jumps:</span>
        {[
          { label: '🎯 Kill-Switches', query: '[ 1. MODDER RECONNAISSANCE' },
          { label: '🎮 Unity IL2CPP', query: '[ 2. UNITY IL2CPP' },
          { label: '💣 Ad SDKs Nuke', query: '[ 3. AD SDKS' },
          { label: '⚡ Master Frida', query: '[ 4. MASTER MODDER FRIDA' },
          { label: '🛡️ Vulnerabilities', query: '[ 7. DETAILED SECURITY' },
          { label: '🔑 Secrets', query: '[ 10. EXTRACTED SENSITIVE' },
          { label: '📜 AndroidManifest', query: '[ 14. DECODED ANDROIDMANIFEST' },
        ].map((jump, jIdx) => (
          <button
            key={jIdx}
            onClick={() => setSearch(jump.query)}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[11px] whitespace-nowrap transition-colors"
          >
            {jump.label}
          </button>
        ))}
        {search && (
          <button
            onClick={() => setSearch('')}
            className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-900/50 border border-red-800 text-red-300 font-mono text-[11px] whitespace-nowrap"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Terminal Preview Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>REPORT VIEWER & LINE SEARCH</span>
          <span className="text-zinc-600">|</span>
          <span>{reportText.split('\n').length} lines compiled</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search report (e.g. TARGET, smali, secret)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Monospace Dossier Terminal */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-5 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[650px] leading-relaxed select-text shadow-inner">
        {filteredLines ? (
          <div>
            <div className="text-emerald-400 mb-3 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>Showing {filteredLines.length} lines matching "{search}":</span>
              <button
                onClick={() => setSearch('')}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Reset
              </button>
            </div>
            <pre className="text-zinc-200 whitespace-pre">{filteredLines.join('\n')}</pre>
          </div>
        ) : (
          <pre className="text-zinc-200 whitespace-pre">{reportText}</pre>
        )}
      </div>
    </div>
  );
};
