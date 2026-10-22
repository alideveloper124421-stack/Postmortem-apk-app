/**
 * Main Top Navigation Bar
 */

import React from 'react';
import { ShieldAlert, Terminal, Download, Sparkles, FolderUp } from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';

interface NavbarProps {
  currentApk: ApkAnalysisResult | null;
  onUploadClick: () => void;
  onLoadDemo: () => void;
  onDownloadReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentApk,
  onUploadClick,
  onLoadDemo,
  onDownloadReport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-wide">
                APK Postmortem Studio
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Universal v2.5
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono hidden sm:block">
              Apktool Engine • Smali Disassembler • Frida Lab • OWASP MASVS Audit
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onLoadDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
            title="Load vulnerable banking APK demo for instant analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Load Sample</span>
            <span>Demo APK</span>
          </button>

          <button
            onClick={onUploadClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 transition-colors"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Upload APK</span>
          </button>

          {currentApk && (
            <button
              onClick={onDownloadReport}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
              title="Download exhaustive Deep Postmortem text report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
              <span>Report (.txt)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
