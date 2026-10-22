/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode2,
  Code2,
  Cpu,
  GitFork,
  Key,
  ShieldAlert,
  Activity,
  Network,
  FileText,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Terminal,
  Palette,
  GitCompare,
  TerminalSquare,
} from 'lucide-react';

import { ApkAnalysisResult } from './types/apk';
import { getVulnBankDemoApk } from './utils/demoApkData';
import { analyzeApkFile } from './utils/apkAnalyzer';

import { DecompiledCodeViewer } from './components/DecompiledCodeViewer';
import { NativeAnalysisTab } from './components/NativeAnalysisTab';
import { CfgTab } from './components/CfgTab';
import { StringsTab } from './components/StringsTab';
import { AntiTamperTab } from './components/AntiTamperTab';
import { DynamicTracingTab } from './components/DynamicTracingTab';
import { XrefTab } from './components/XrefTab';
import { PostmortemReportTab } from './components/PostmortemReportTab';
import { ResourcesThemingTab } from './components/ResourcesThemingTab';
import { ApkDiffTab } from './components/ApkDiffTab';
import { AdbIntentToolsTab } from './components/AdbIntentToolsTab';

export default function App() {
  const [currentApk, setCurrentApk] = useState<ApkAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('decompiled');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setCurrentStage('Unpacking APK ZIP archive & reading headers...');
    setErrorMessage(null);

    try {
      const result = await analyzeApkFile(file, (stage, percent) => {
        setCurrentStage(stage);
        setProgressPercent(percent);
      });
      setCurrentApk(result);
      setActiveTab('decompiled');
    } catch (err: unknown) {
      console.error('APK Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to analyze uploaded APK file.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setCurrentStage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadReport = () => {
    if (!currentApk) return;
    const blob = new Blob([currentApk.postmortemTextReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POSTMORTEM_${currentApk.manifest.packageName}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'decompiled', label: 'Decompiled Code & Smali', icon: Code2 },
    { id: 'resources', label: 'Resources & Theming', icon: Palette, badge: 'Mod' },
    { id: 'diff', label: 'APK Version Diff', icon: GitCompare, badge: 'Mod' },
    { id: 'adb', label: 'ADB Intent Testing', icon: TerminalSquare, badge: 'Mod' },
    { id: 'native', label: 'Native .so Analysis', icon: Cpu },
    { id: 'cfg', label: 'Control Flow Graph (CFG)', icon: GitFork },
    { id: 'secrets', label: 'Secrets & Strings', icon: Key },
    { id: 'anti-tamper', label: 'Anti-Tamper & Security', icon: ShieldAlert },
    { id: 'dynamic', label: 'Dynamic Tracing', icon: Activity },
    { id: 'xrefs', label: 'Cross-References (XREFs)', icon: Network },
    { id: 'report', label: 'Final Postmortem (.txt)', icon: FileText, highlight: true },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Minimal Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-wide">
                Universal APK Reverse Engineering & Postmortem
              </h1>
              <p className="text-[11px] font-mono text-zinc-400">
                Smali • Decompiler • Native JNI • CFG • Anti-Tamper • XREFs
              </p>
            </div>
          </div>

          {currentApk && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentApk(null);
                  setErrorMessage(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload Another APK</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report (.txt)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-start">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Ultra-clean Simple Drag & Drop Screen (When no APK is active and not loading) */}
        {!currentApk && !isProcessing && (
          <div className="my-auto py-12 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept=".apk,.xapk,.zip"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-12 sm:p-16 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
                  : 'border-zinc-700/80 hover:border-emerald-500/60 bg-zinc-900/40 hover:bg-zinc-900/70 shadow-2xl'
              }`}
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
                <UploadCloud className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                  Drag and Drop APK File Here
                </h2>
                <p className="text-sm text-zinc-400">
                  Koe bhi APK file yahan drop karein — deep reverse engineering aur postmortem shuru ho jae ga.
                </p>
                <p className="text-xs font-mono text-zinc-500 pt-1">
                  Supports <span className="text-zinc-300">.apk, .xapk, .zip</span>
                </p>
              </div>

              <button
                type="button"
                className="mt-3 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide transition-all shadow-md"
              >
                Browse APK File
              </button>
            </div>

            {/* Subtle Demo Sample Trigger */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsProcessing(true);
                  setProgressPercent(30);
                  setCurrentStage('Loading demo banking APK profile...');
                  setTimeout(() => {
                    setCurrentApk(getVulnBankDemoApk());
                    setIsProcessing(false);
                    setProgressPercent(0);
                  }, 800);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Agar APK file nahi hai to instant demo sample load karein</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Loading Screen */}
        {isProcessing && (
          <div className="my-auto py-16 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6 text-center">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-800 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-emerald-400">
                {progressPercent}%
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-100">
                Decompiling & Analyzing Target APK...
              </h3>
              <p className="text-xs font-mono text-emerald-400 animate-pulse">
                {currentStage || 'Processing bytecode & binary structures...'}
              </p>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Deep Analysis Results Workspace */}
        {currentApk && !isProcessing && (
          <div className="space-y-6">
            {/* Target Header Summary */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 mr-2">TARGET APK:</span>
                <span className="text-zinc-200 font-bold text-sm">{currentApk.fileName}</span>
                <span className="text-emerald-400 ml-2">({currentApk.manifest.packageName})</span>
              </div>
              <div className="text-zinc-400 flex items-center gap-3">
                <span>{currentApk.fileSizeBytesFormatted}</span>
                <span>•</span>
                <span>API {currentApk.manifest.minSdkVersion} → {currentApk.manifest.targetSdkVersion}</span>
                <span>•</span>
                <span className="text-zinc-300 font-bold">{currentApk.dex.classesCount} Classes</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-zinc-800">
              <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-3 px-3.5 sm:px-4 rounded-t-lg font-mono text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                        isActive
                          ? 'border-emerald-400 text-emerald-400 bg-zinc-900/70 shadow-sm'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                      } ${tab.highlight ? 'text-emerald-300' : ''}`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold transition-colors ${
                          isActive
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Active Analysis View */}
            <div className="pt-2">
              {activeTab === 'decompiled' && (
                <DecompiledCodeViewer classes={currentApk.dex.classes} />
              )}

              {activeTab === 'resources' && (
                <ResourcesThemingTab apk={currentApk} />
              )}

              {activeTab === 'diff' && (
                <ApkDiffTab currentApk={currentApk} />
              )}

              {activeTab === 'adb' && (
                <AdbIntentToolsTab apk={currentApk} />
              )}

              {activeTab === 'native' && (
                <NativeAnalysisTab nativeLibraries={currentApk.nativeAnalysis} />
              )}

              {activeTab === 'cfg' && (
                <CfgTab classes={currentApk.dex.classes} />
              )}

              {activeTab === 'secrets' && (
                <StringsTab apk={currentApk} />
              )}

              {activeTab === 'anti-tamper' && (
                <AntiTamperTab routines={currentApk.antiTamperRoutines} />
              )}

              {activeTab === 'dynamic' && (
                <DynamicTracingTab logs={currentApk.dynamicTraceLogs} />
              )}

              {activeTab === 'xrefs' && (
                <XrefTab xrefs={currentApk.xrefs} />
              )}

              {activeTab === 'report' && (
                <PostmortemReportTab
                  apk={currentApk}
                  onDownloadReport={handleDownloadReport}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
