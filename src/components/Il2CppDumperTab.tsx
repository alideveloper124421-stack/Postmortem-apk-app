/**
 * Unity IL2CPP Dumper & Native Game Modding Tab
 * Built with a Modder's Vision: Method Offsets (RVA), ARM64 Hex Patches,
 * dump.cs viewer, IDA/Ghidra script export, and C++ Mod Menu snippets.
 */

import React, { useState } from 'react';
import {
  Gamepad2,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { ApkAnalysisResult, Il2CppClass, Il2CppMethod } from '../types/apk';

interface Il2CppDumperTabProps {
  apk: ApkAnalysisResult;
}

export const Il2CppDumperTab: React.FC<Il2CppDumperTabProps> = ({ apk }) => {
  const [activeView, setActiveView] = useState<'methods' | 'dumpcs' | 'modmenu' | 'strings'>('methods');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassIdx, setSelectedClassIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dump = apk.il2cppDump;

  if (!dump || !dump.detected) {
    return (
      <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 max-w-2xl mx-auto my-8">
        <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto" />
        <h3 className="text-base font-bold text-zinc-200">No Unity IL2CPP Binary Detected</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          This APK does not appear to contain a compiled Unity IL2CPP game (missing <code>libil2cpp.so</code> or <code>global-metadata.dat</code>). Pure Java/Kotlin and native JNI analysis are available in the other tabs.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredClasses = dump.classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.methods.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.offsetHex.includes(searchQuery))
  );

  const currentClass = filteredClasses[selectedClassIdx] || dump.classes[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/60 via-zinc-900 to-emerald-950/40 border border-purple-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/40 font-mono text-[11px] font-bold uppercase tracking-wider">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Unity IL2CPP Dumper Engine</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                MODDER EDITION
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Native Method Offsets (RVA) & ARM64 Hex Patcher
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Recovers C# class structures, method virtual offsets (RVA), and ARM64 hex opcodes from <code>global-metadata.dat</code> and <code>libil2cpp.so</code>. Export ready-to-run Frida native interceptors, C++ floating mod menu code, and IDA Pro scripts.
            </p>
          </div>

          {/* Quick Export Downloads */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadFile(dump.dumpCsHeader, 'dump.cs', 'text/plain')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
              title="Download full C# reconstructed headers (dump.cs)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>dump.cs</span>
            </button>

            <button
              onClick={() => handleDownloadFile(dump.scriptJson, 'script.json', 'application/json')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
              title="Download IDA Pro / Ghidra auto-symbol renamer script"
            >
              <Download className="w-3.5 h-3.5" />
              <span>script.json</span>
            </button>

            <button
              onClick={() => handleDownloadFile(dump.unityModMenuBoilerplate, 'ModMenu.cpp', 'text/plain')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
              title="Download C++ Native Floating Mod Menu boilerplate"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ModMenu.cpp</span>
            </button>
          </div>
        </div>

        {/* Binary Spec Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-purple-400">{dump.arch}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Binary Arch</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-emerald-400">v{dump.metadataVersion || 24}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Metadata Version</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-cyan-400">{dump.classesCount}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">C# Classes Dumped</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-amber-400">{dump.methodsCount}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Recovered Methods (RVA)</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('methods')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeView === 'methods'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Method Offsets & ARM64 Patches</span>
          </button>

          <button
            onClick={() => setActiveView('dumpcs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeView === 'dumpcs'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Interactive dump.cs Viewer</span>
          </button>

          <button
            onClick={() => setActiveView('modmenu')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeView === 'modmenu'
                ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Native Mod Menu C++ Code</span>
          </button>

          <button
            onClick={() => setActiveView('strings')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeView === 'strings'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Metadata String Literals</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search classes, methods, or offsets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>
      </div>

      {/* VIEW 1: METHOD OFFSETS & ARM64 PATCHES */}
      {activeView === 'methods' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Classes Tree Sidebar */}
          <div className="lg:col-span-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col max-h-[650px]">
            <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-semibold flex justify-between">
              <span>UNITY C# CLASSES</span>
              <span>{filteredClasses.length}</span>
            </div>

            <div className="divide-y divide-zinc-800/60 overflow-y-auto flex-1 font-mono text-xs">
              {filteredClasses.map((cls, idx) => {
                const isSelected = cls === currentClass;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedClassIdx(idx)}
                    className={`w-full text-left p-3 transition-colors flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-400'
                        : 'text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`} />
                    <div className="truncate flex-1">
                      <div className="font-bold truncate text-zinc-200">{cls.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{cls.namespace}</div>
                      <div className="text-[10px] text-purple-400/80 mt-0.5 font-mono">
                        {cls.methods.length} methods • Token: {cls.typeToken}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Methods & ARM64 Hex Patch Detail */}
          <div className="lg:col-span-8 space-y-4">
            {currentClass ? (
              <div className="space-y-4">
                {/* Class Header */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                      Namespace: {currentClass.namespace}
                    </span>
                    <h3 className="text-base font-bold text-zinc-100 font-mono">
                      class {currentClass.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                      Token: {currentClass.typeToken}
                    </span>
                  </div>
                </div>

                {/* Methods List */}
                <div className="space-y-4">
                  {currentClass.methods.map((method, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 space-y-3 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                              RVA: {method.offsetHex}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800">
                              Return: {method.returnType}
                            </span>
                          </div>
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {method.signature}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(method.arm64HexPatch.patchHex, `hex-${mIdx}`)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold transition-colors"
                            title="Copy ARM64 hex bytes for MT Manager / HxD"
                          >
                            {copiedId === `hex-${mIdx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `hex-${mIdx}` ? 'Copied Hex!' : 'Copy ARM64 Hex'}</span>
                          </button>

                          <button
                            onClick={() => handleCopy(method.fridaInterceptorHook, `frida-${mIdx}`)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold transition-colors"
                          >
                            {copiedId === `frida-${mIdx}` ? <Check className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                            <span>{copiedId === `frida-${mIdx}` ? 'Copied!' : 'Copy Frida'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Purpose / Strategy */}
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                        <span>Purpose: {method.arm64HexPatch.description}</span>
                        <span className="text-purple-400 font-bold">Strategy: {method.arm64HexPatch.strategy}</span>
                      </div>

                      {/* Hex Comparison & C++ Mod Menu Snippet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 mb-1">ARM64 TARGET HEX PATCH:</div>
                          <div className="text-emerald-300 font-bold tracking-wider selection:bg-emerald-500 selection:text-black">
                            {method.arm64HexPatch.patchHex}
                          </div>
                          <div className="text-[10px] text-zinc-600 mt-1">
                            Original: {method.arm64HexPatch.originalHex}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <div className="text-[10px] text-zinc-500 mb-1">C++ MOD MENU SNIPPET:</div>
                          <div className="text-cyan-300 text-[11px] truncate">
                            MemoryPatch::createWithHex("libil2cpp.so", {method.offsetHex}, ...);
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">Select a class to view its methods.</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE DUMP.CS VIEWER */}
      {activeView === 'dumpcs' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-300 font-bold flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>dump.cs (Decompiled Unity C# Headers)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(dump.dumpCsHeader, 'dump-cs-all')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
              >
                {copiedId === 'dump-cs-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'dump-cs-all' ? 'Copied' : 'Copy All'}</span>
              </button>
              <button
                onClick={() => handleDownloadFile(dump.dumpCsHeader, 'dump.cs', 'text/plain')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download dump.cs</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[600px] leading-relaxed select-text shadow-inner">
            <pre className="text-emerald-400/90 whitespace-pre">
              {dump.dumpCsHeader}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW 3: NATIVE MOD MENU C++ CODE */}
      {activeView === 'modmenu' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Ready-to-compile C++ source code for Android Floating Mod Menus (compatible with LGL, Octowolve, KittyMemory, and MemoryPatch).
              </span>
            </div>
            <button
              onClick={() => handleCopy(dump.unityModMenuBoilerplate, 'modmenu-cpp')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors shrink-0"
            >
              {copiedId === 'modmenu-cpp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'modmenu-cpp' ? 'Copied!' : 'Copy C++ Code'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-black border border-zinc-800 p-4 font-mono text-xs overflow-x-auto max-h-[600px]">
            <pre className="text-cyan-300 whitespace-pre">
              {dump.unityModMenuBoilerplate}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW 4: METADATA STRING LITERALS */}
      {activeView === 'strings' && (
        <div className="space-y-3">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 font-bold">
              Metadata String Literals Pool ({dump.stringLiterals.length})
            </span>
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs max-h-[500px] overflow-y-auto divide-y divide-zinc-900">
            {dump.stringLiterals.map((str, sIdx) => (
              <div key={sIdx} className="py-2 flex items-center justify-between text-zinc-300 hover:bg-zinc-900/40 px-2 rounded">
                <span className="truncate text-emerald-400">{str}</span>
                <span className="text-[10px] text-zinc-600 font-mono">#{sIdx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
