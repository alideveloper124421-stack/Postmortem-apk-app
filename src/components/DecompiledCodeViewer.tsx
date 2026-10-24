/**
 * Decompiled Code & Smali Viewer Component
 * Allows toggling between Decompiled Java, Kotlin, and Smali Assembly,
 * with Global Smali/Opcode search across all classes.
 */

import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  Search,
  Sparkles,
  BookOpen,
  Filter,
  ArrowRight,
  Terminal,
  X,
} from 'lucide-react';
import { SmaliClass } from '../types/apk';
import { SmaliOpcodeHelper } from './SmaliOpcodeHelper';

interface DecompiledCodeViewerProps {
  classes: SmaliClass[];
  initialSelectedClass?: string;
}

export const DecompiledCodeViewer: React.FC<DecompiledCodeViewerProps> = ({
  classes,
  initialSelectedClass,
}) => {
  const [selectedClassName, setSelectedClassName] = useState<string>(
    initialSelectedClass || (classes[0]?.className ?? '')
  );
  const [format, setFormat] = useState<'java' | 'kotlin' | 'smali'>('smali');
  const [classFilter, setClassFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOpcodeHelper, setShowOpcodeHelper] = useState(false);

  // Global search state
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [highlightLineIdx, setHighlightLineIdx] = useState<number | null>(null);

  const filteredClasses = classes.filter(
    (c) =>
      c.simpleName.toLowerCase().includes(classFilter.toLowerCase()) ||
      c.packageName.toLowerCase().includes(classFilter.toLowerCase())
  );

  const current = classes.find((c) => c.className === selectedClassName) || filteredClasses[0] || classes[0];

  const getActiveCode = () => {
    if (!current) return '// No class loaded';
    if (format === 'java') return current.decompiledJava || '// Decompiled Java code unavailable';
    if (format === 'kotlin') return current.decompiledKotlin || '// Decompiled Kotlin code unavailable';
    return current.rawSmali;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!current) return;
    const ext = format === 'java' ? 'java' : format === 'kotlin' ? 'kt' : 'smali';
    const blob = new Blob([getActiveCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.simpleName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute global search results across all classes
  const globalResults = useMemo(() => {
    if (!globalSearchQuery.trim() || globalSearchQuery.length < 2) return [];
    const query = globalSearchQuery.toLowerCase();
    const results: {
      className: string;
      simpleName: string;
      lineNum: number;
      lineText: string;
    }[] = [];

    for (const cls of classes) {
      const lines = cls.rawSmali.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query)) {
          results.push({
            className: cls.className,
            simpleName: cls.simpleName,
            lineNum: i + 1,
            lineText: lines[i].trim(),
          });
          if (results.length >= 100) break;
        }
      }
      if (results.length >= 100) break;
    }
    return results;
  }, [classes, globalSearchQuery]);

  const handleSelectSearchResult = (className: string, lineNum: number) => {
    setSelectedClassName(className);
    setFormat('smali');
    setHighlightLineIdx(lineNum - 1);
    setIsGlobalSearchOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        {/* Format Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setFormat('smali')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              format === 'smali'
                ? 'bg-cyan-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Smali Assembly
          </button>
          <button
            onClick={() => setFormat('java')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              format === 'java'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Java Source
          </button>
          <button
            onClick={() => setFormat('kotlin')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              format === 'kotlin'
                ? 'bg-purple-500 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Kotlin Source
          </button>
        </div>

        {/* Global Search & Class Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Global Smali Search</span>
          </button>

          <div className="relative w-full sm:w-52">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter class tree..."
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            onClick={() => setShowOpcodeHelper(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/80 hover:bg-cyan-900/60 text-xs font-mono text-cyan-300 transition-colors"
            title="Open Dalvik Smali Opcode Cheatsheet"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Opcode Cheatsheet</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Global Search Modal */}
      {isGlobalSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-900 border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-zinc-100 font-mono">
                  Global Smali & Bytecode Search
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {classes.length} Classes Indexed
                </span>
              </div>
              <button
                onClick={() => setIsGlobalSearchOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-zinc-900/90 border-b border-zinc-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search opcodes (const/4, sget-boolean), registers (v0, p0), methods (isPremium), or strings..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-zinc-500">
                <span>Quick tests:</span>
                {['const/4', 'sget-boolean', 'isPremium', 'invoke-virtual', 'License', 'http'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setGlobalSearchQuery(sample)}
                    className="hover:text-emerald-400 underline"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-3 divide-y divide-zinc-800/60 font-mono text-xs">
              {globalSearchQuery.length < 2 ? (
                <div className="p-8 text-center text-zinc-500">
                  Type at least 2 characters to search across all decompiled Smali files.
                </div>
              ) : globalResults.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  No matching Smali bytecode found for "{globalSearchQuery}".
                </div>
              ) : (
                globalResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(res.className, res.lineNum)}
                    className="w-full text-left p-3 hover:bg-zinc-800/50 rounded-lg flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="truncate flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400 text-xs">{res.simpleName}</span>
                        <span className="text-[10px] text-zinc-500">Line {res.lineNum}</span>
                      </div>
                      <div className="text-zinc-300 text-[11px] truncate bg-black/50 px-2 py-1 rounded border border-zinc-800">
                        {res.lineText}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Opcode Helper Modal */}
      <SmaliOpcodeHelper isOpen={showOpcodeHelper} onClose={() => setShowOpcodeHelper(false)} />

      {/* Dual Pane: Class tree + Code view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[550px]">
        {/* Classes List */}
        <div className="lg:col-span-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-semibold flex justify-between">
            <span>DISASSEMBLED CLASSES</span>
            <span>{filteredClasses.length}</span>
          </div>

          <div className="divide-y divide-zinc-800/60 overflow-y-auto flex-1 font-mono text-xs">
            {filteredClasses.map((cls, idx) => {
              const isSelected = cls.className === current?.className;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedClassName(cls.className);
                    setHighlightLineIdx(null);
                  }}
                  className={`w-full text-left p-3 transition-colors flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-400'
                      : 'text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div className="truncate flex-1">
                    <div className="font-bold truncate text-zinc-200">{cls.simpleName}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{cls.packageName}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code View */}
        <div className="lg:col-span-8 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col max-h-[600px] overflow-hidden">
          <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="font-bold text-zinc-200">
              {current?.simpleName}.{format === 'java' ? 'java' : format === 'kotlin' ? 'kt' : 'smali'}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">{format.toUpperCase()} VIEW</span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text bg-zinc-950">
            <pre className="text-zinc-300 whitespace-pre">
              {getActiveCode()
                .split('\n')
                .map((line, idx) => {
                  const isHighlighted = highlightLineIdx === idx;
                  return (
                    <div
                      key={idx}
                      className={`table-row ${
                        isHighlighted ? 'bg-emerald-500/20 text-emerald-300 font-bold' : ''
                      }`}
                    >
                      <span className="table-cell pr-4 text-zinc-600 select-none text-right w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell">{line}</span>
                    </div>
                  );
                })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
