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
  Crosshair,
  Gamepad2,
  CheckCircle2,
  Copy,
  Zap,
  Check,
} from 'lucide-react';

import { ApkAnalysisResult } from './types/apk';
import { getVulnBankDemoApk } from './utils/demoApkData';
import { getNeoGameDemoApk } from './utils/demoPresets';
import { analyzeApkFile } from './utils/apkAnalyzer';

import { ModderLabTab } from './components/ModderLabTab';
import { Il2CppDumperTab } from './components/Il2CppDumperTab';
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
  const [activeTab, setActiveTab] = useState<string>('modder-lab');
  const [targetClassToView, setTargetClassToView] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoDownloadReport, setAutoDownloadReport] = useState<boolean>(true);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerReportDownload = (apkData: ApkAnalysisResult) => {
    const blob = new Blob([apkData.postmortemTextReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MASTER_MODDER_DOSSIER_${apkData.manifest.packageName}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccessNotice(`Master report (.txt) automatically downloaded! Saved as MASTER_MODDER_DOSSIER_${apkData.manifest.packageName}.txt`);
    setTimeout(() => setDownloadSuccessNotice(null), 6000);
  };

  const copyMasterReport = () => {
    if (!currentApk) return;
    navigator.clipboard.writeText(currentApk.postmortemTextReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleLoadDemo = (type: 'game' | 'banking') => {
    setIsProcessing(true);
    setProgressPercent(25);
    setCurrentStage(
      type === 'game'
        ? 'Loading Unity IL2CPP game (libil2cpp.so + global-metadata.dat)...'
        : 'Loading banking app sample (DEX bytecode + kill-switches)...'
    );
    setErrorMessage(null);

    setTimeout(() => {
      setProgressPercent(80);
      setCurrentStage('Extracting C# classes, method RVAs, and smali bytecode...');
      setTimeout(() => {
        const demo = type === 'game' ? getNeoGameDemoApk() : getVulnBankDemoApk();
        setCurrentApk(demo);
        setActiveTab(type === 'game' ? 'il2cpp' : 'modder-lab');
        setIsProcessing(false);
        setProgressPercent(0);
        setCurrentStage('');
        if (autoDownloadReport) {
          triggerReportDownload(demo);
        }
      }, 400);
    }, 600);
  };

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
      // If Unity game detected, focus on il2cpp tab, otherwise modder-lab
      if (result.il2cppDump && result.il2cppDump.detected) {
        setActiveTab('il2cpp');
      } else {
        setActiveTab('modder-lab');
      }
      if (autoDownloadReport) {
        triggerReportDownload(result);
      }
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
    triggerReportDownload(currentApk);
  };

  const tabs = [
    { id: 'modder-lab', label: 'Modder & RE Lab', icon: Crosshair, badge: 'PRO', highlight: true },
    { id: 'il2cpp', label: 'Unity IL2CPP Dumper', icon: Gamepad2, badge: 'Unity', highlight: true },
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
    { id: 'report', label: 'Final Postmortem (.txt / .html)', icon: FileText, highlight: true },
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
        {/* Auto-download Success Toast Alert */}
        {downloadSuccessNotice && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-emerald-300 font-mono text-sm">
                  ⚡ BOOM! MASTER DOSSIER (.TXT) DOWNLOADED!
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                  {downloadSuccessNotice}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDownloadSuccessNotice(null)}
              className="text-xs font-mono text-emerald-400 hover:text-white px-2 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

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
          <div className="my-auto py-8 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
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

            {/* Auto-Download Feature Switch */}
            <div className="w-full mb-4 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    ⚡ Auto-Download All-In-One Master Report (.txt) On Upload
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    APK drop karte hi pura master dossier (IL2CPP + Smali + Offsets + Kill-switches) khud ba khud download ho jae ga.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDownloadReport}
                  onChange={(e) => setAutoDownloadReport(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-10 sm:p-14 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
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
                  Apni APK drop karein — deep reverse engineering aur instant 1-file master dossier generation shuru ho jae ga.
                </p>
                <p className="text-xs font-mono text-zinc-500 pt-1">
                  Supports <span className="text-zinc-300 font-semibold">.apk, .xapk, .zip</span> • Unity IL2CPP & Dalvik DEX
                </p>
              </div>

              <button
                type="button"
                className="mt-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide transition-all shadow-md flex items-center space-x-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Browse APK File</span>
              </button>
            </div>

            {/* Quick Demo Launchers */}
            <div className="mt-6 w-full space-y-2">
              <div className="text-center text-xs font-mono text-zinc-500">
                — ya phir in samples par test karein —
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleLoadDemo('game')}
                  className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 shrink-0">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 truncate">
                      🎮 NeoGame 3D (Unity IL2CPP)
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      libil2cpp.so • dump.cs • ARM64 Hex Patches
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleLoadDemo('banking')}
                  className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 shrink-0">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 truncate">
                      🏦 VulnBank v2.4 (DEX Smali)
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">
                      Dalvik Smali • VIP Kill-Switches • Secrets
                    </div>
                  </div>
                </button>
              </div>
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
                {currentApk.il2cppDump?.detected && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                    UNITY IL2CPP DETECTED
                  </span>
                )}
              </div>
            </div>

            {/* 🔥 MASTER DOSSIER ALL-IN-ONE DOWNLOAD BANNER */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900/90 to-purple-950/40 border-2 border-emerald-500/50 p-5 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>ALL-IN-ONE MASTER DOSSIER</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      ~{Math.round(currentApk.postmortemTextReport.length / 1024)} KB Consolidated
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>🔥 Complete Master Report (.txt) Taiyar Hai!</span>
                  </h2>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Alag alag files download karne ki zaroorat nahi — is ak text file me pura{' '}
                    <strong className="text-emerald-400">Unity IL2CPP dump.cs</strong>,{' '}
                    <strong className="text-emerald-400">ARM64 Hex Patches</strong>, Method RVAs,{' '}
                    <strong className="text-emerald-400">Dalvik Smali Bytecode</strong> (har class ka),{' '}
                    <strong className="text-emerald-400">Kill-Switches</strong>, Ad Nukers, Master Frida Script, Secrets aur ADB Commands shamil hain!
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                      ✓ Unity IL2CPP Dump & RVAs
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                      ✓ Complete Smali Code (All Classes)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                      ✓ VIP & License Kill-Switches
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                      ✓ Master Frida Dynamic Script
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                      ✓ ADB Shell One-Liners
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD MASTER REPORT (.TXT)</span>
                  </button>

                  <button
                    onClick={copyMasterReport}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Report Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Dossier Text</span>
                      </>
                    )}
                  </button>
                </div>
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
              {activeTab === 'modder-lab' && (
                <ModderLabTab
                  apk={currentApk}
                  onNavigateToSmali={(clsName) => {
                    setTargetClassToView(clsName);
                    setActiveTab('decompiled');
                  }}
                />
              )}

              {activeTab === 'il2cpp' && (
                <Il2CppDumperTab apk={currentApk} />
              )}

              {activeTab === 'decompiled' && (
                <DecompiledCodeViewer
                  classes={currentApk.dex.classes}
                  initialSelectedClass={targetClassToView}
                />
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
