/**
 * Native Library (.so files) Analysis Component
 * Displays exported JNI functions, symbol tables, and binary security flags.
 */

import React, { useState } from 'react';
import { Cpu, ShieldCheck, ShieldAlert, Search, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { NativeLibAnalysis } from '../types/apk';
import { formatBytes } from '../utils/apkAnalyzer';

interface NativeAnalysisTabProps {
  nativeLibraries: NativeLibAnalysis[];
}

export const NativeAnalysisTab: React.FC<NativeAnalysisTabProps> = ({ nativeLibraries }) => {
  const [selectedLibIdx, setSelectedLibIdx] = useState(0);
  const [search, setSearch] = useState('');

  if (!nativeLibraries || nativeLibraries.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-400">
        <Cpu className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
        <h3 className="text-base font-bold text-zinc-200">No Native C/C++ Libraries Found</h3>
        <p className="text-xs text-zinc-500 mt-1">This APK contains pure Java/Kotlin Dalvik bytecode without native .so files.</p>
      </div>
    );
  }

  const currentLib = nativeLibraries[selectedLibIdx] || nativeLibraries[0];

  const filteredJni = currentLib.jniFunctions.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      (j.targetJavaMethod && j.targetJavaMethod.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Library Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {nativeLibraries.map((lib, idx) => {
          const isSelected = idx === selectedLibIdx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedLibIdx(idx)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-zinc-100">{lib.libraryName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-semibold">
                  {lib.arch}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-2 font-mono flex items-center justify-between">
                <span>{lib.jniFunctions.length} JNI functions</span>
                <span>{formatBytes(lib.size)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Library Inspector */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <Cpu className="w-5 h-5 text-cyan-400" />
              {currentLib.libraryName}
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Path: {currentLib.path} • Architecture: {currentLib.arch}
            </p>
          </div>

          {/* Security Hardening Flags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                currentLib.securityHardening.pie
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/80 border-red-800 text-red-300'
              }`}
            >
              PIE: {currentLib.securityHardening.pie ? 'ENABLED' : 'DISABLED'}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                currentLib.securityHardening.stackCanary
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-800 text-amber-300'
              }`}
            >
              CANARY: {currentLib.securityHardening.stackCanary ? 'PRESENT' : 'MISSING'}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                currentLib.securityHardening.nx
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/80 border-red-800 text-red-300'
              }`}
            >
              NX: {currentLib.securityHardening.nx ? 'ENFORCED' : 'DISABLED'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              RELRO: {currentLib.securityHardening.relro}
            </span>
          </div>
        </div>

        {/* Exported JNI Functions Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-300">
              Exported JNI Native Functions ({currentLib.jniFunctions.length})
            </h4>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search JNI functions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/70 font-mono text-xs">
            {filteredJni.map((jni, idx) => (
              <div key={idx} className="p-3.5 hover:bg-zinc-900/40 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 break-all">{jni.name}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0 ml-2">{jni.offsetHex}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  <span className="text-zinc-600 mr-2">Signature:</span>
                  {jni.signature}
                </div>
                {jni.targetJavaMethod && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
                    <span className="text-zinc-500 mr-2">Java Binding:</span>
                    {jni.targetJavaMethod}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Symbol Table Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold uppercase text-zinc-300">
            Exported Symbol Table
          </h4>
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400 flex flex-wrap gap-2">
            {currentLib.symbols.map((sym, idx) => (
              <span key={idx} className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px]">
                {sym}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
