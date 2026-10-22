/**
 * Final Deep Postmortem Report Viewer & Downloader Tab
 * Fulfills the user request for a complete, exhaustive text file postmortem ("har ek chezz")
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Printer,
  ShieldAlert,
  Sparkles,
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

  const filteredLines = search
    ? reportText.split('\n').filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="space-y-6">
      {/* Top Action Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100">
              Complete Deep Postmortem Dossier Ready
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            This exhaustive text report includes every single component, decoded AndroidManifest.xml, complete Smali class signatures, dangerous permissions, extracted API keys/secrets, OWASP MASVS risk rating, and customized Frida scripts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onDownloadReport}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download .txt Report</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied All!' : 'Copy Text'}</span>
          </button>
        </div>
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
            placeholder="Filter lines (e.g. smali, secret, permission)..."
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
            <div className="text-emerald-400 mb-3 pb-2 border-b border-zinc-800">
              Showing {filteredLines.length} lines matching "{search}":
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
