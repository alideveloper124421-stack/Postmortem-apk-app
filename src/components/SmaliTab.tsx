/**
 * Smali Disassembler & Bytecode Tree Inspector Tab (Apktool Engine)
 */

import React, { useState } from 'react';
import {
  Code2,
  FolderTree,
  Search,
  Copy,
  Check,
  Terminal,
  Download,
  ShieldAlert,
  Radio,
  FileCode,
  Zap,
} from 'lucide-react';
import { ApkAnalysisResult, SmaliClass } from '../types/apk';
import { generateCustomMethodHook } from '../utils/fridaGenerator';

interface SmaliTabProps {
  apk: ApkAnalysisResult;
  onOpenFridaWithHook?: (code: string) => void;
}

export const SmaliTab: React.FC<SmaliTabProps> = ({ apk, onOpenFridaWithHook }) => {
  const classes = apk.dex.classes;
  const [selectedClassIdx, setSelectedClassIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatedHook, setGeneratedHook] = useState<string | null>(null);

  const filteredClasses = classes.filter((c) => {
    return (
      searchQuery === '' ||
      c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.simpleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rawSmali.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const currentClass: SmaliClass | undefined = filteredClasses[selectedClassIdx] || classes[0];

  const handleCopySmali = () => {
    if (currentClass) {
      navigator.clipboard.writeText(currentClass.rawSmali);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadSmali = () => {
    if (!currentClass) return;
    const blob = new Blob([currentClass.rawSmali], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentClass.simpleName}.smali`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateHook = (methodName: string, params: string[], returnType: string) => {
    if (!currentClass) return;
    const hookCode = generateCustomMethodHook(currentClass.className, methodName, params, returnType);
    setGeneratedHook(hookCode);
    if (onOpenFridaWithHook) {
      onOpenFridaWithHook(hookCode);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-zinc-200">
            Apktool Smali Disassembler Tree
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {classes.length} Classes Disassembled
          </span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search class, package, or opcode..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedClassIdx(0);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Main Dual-Pane Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
        {/* Left Pane: Class List */}
        <div className="lg:col-span-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col max-h-[650px]">
          <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-semibold flex justify-between">
            <span>SMALI CLASSES</span>
            <span>{filteredClasses.length} found</span>
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
                      ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-400'
                      : 'text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div className="truncate flex-1">
                    <div className="font-bold truncate text-zinc-200">
                      {cls.simpleName}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {cls.packageName || 'root'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {cls.hasCryptoUsage && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          CRYPTO
                        </span>
                      )}
                      {cls.hasNetworkUsage && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          NET
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">
                        {cls.methods.length} methods
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Smali Viewer & Methods */}
        <div className="lg:col-span-8 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col max-h-[650px] overflow-hidden">
          {currentClass ? (
            <>
              {/* Header */}
              <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {currentClass.simpleName}.smali
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {currentClass.accessFlags.join(' ')}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 truncate">
                    {currentClass.className}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySmali}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadSmali}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
                    title="Download .smali file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Methods Quick-Action Bar */}
              {currentClass.methods.length > 0 && (
                <div className="p-2.5 bg-zinc-900/40 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold shrink-0">
                    Hook Methods:
                  </span>
                  {currentClass.methods.map((m, mIdx) => (
                    <button
                      key={mIdx}
                      onClick={() => handleCreateHook(m.name, m.parameters, m.returnType)}
                      className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/80 text-purple-300 text-[11px] flex items-center space-x-1 shrink-0 transition-colors"
                      title={`Generate Frida hook for ${m.name}`}
                    >
                      <Zap className="w-2.5 h-2.5 text-purple-400" />
                      <span>{m.name}()</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Code Surface */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text bg-zinc-950">
                <pre className="text-zinc-300 whitespace-pre">
                  {currentClass.rawSmali.split('\n').map((line, lineIdx) => {
                    let color = 'text-zinc-300';
                    if (line.startsWith('#')) color = 'text-zinc-500 italic';
                    else if (line.startsWith('.class') || line.startsWith('.super') || line.startsWith('.source'))
                      color = 'text-cyan-400 font-bold';
                    else if (line.startsWith('.method') || line.startsWith('.end method'))
                      color = 'text-emerald-400 font-bold';
                    else if (line.includes('const-string') || line.includes('"'))
                      color = 'text-amber-300';
                    else if (line.includes('invoke-'))
                      color = 'text-purple-300';
                    else if (line.includes('return-') || line.includes('return'))
                      color = 'text-pink-400';

                    return (
                      <div key={lineIdx} className="table-row">
                        <span className="table-cell pr-4 text-zinc-600 select-none text-right w-10">
                          {lineIdx + 1}
                        </span>
                        <span className={`table-cell ${color}`}>{line}</span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs my-auto">
              Select a class from the left sidebar to view disassembled Smali bytecode
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
