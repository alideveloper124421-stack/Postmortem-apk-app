/**
 * Decompiled Code & Smali Viewer Component
 * Allows toggling between Decompiled Java, Kotlin, and Smali Assembly.
 */

import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileCode, Search, Sparkles, BookOpen } from 'lucide-react';
import { SmaliClass } from '../types/apk';
import { SmaliOpcodeHelper } from './SmaliOpcodeHelper';

interface DecompiledCodeViewerProps {
  classes: SmaliClass[];
}

export const DecompiledCodeViewer: React.FC<DecompiledCodeViewerProps> = ({ classes }) => {
  const [selectedClassIdx, setSelectedClassIdx] = useState(0);
  const [format, setFormat] = useState<'java' | 'kotlin' | 'smali'>('java');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOpcodeHelper, setShowOpcodeHelper] = useState(false);

  const filtered = classes.filter(
    (c) =>
      c.simpleName.toLowerCase().includes(search.toLowerCase()) ||
      c.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const current = filtered[selectedClassIdx] || classes[0];

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

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        {/* Format Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter classes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedClassIdx(0);
              }}
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

      {/* Opcode Helper Modal */}
      <SmaliOpcodeHelper isOpen={showOpcodeHelper} onClose={() => setShowOpcodeHelper(false)} />

      {/* Dual Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[550px]">
        {/* Classes List */}
        <div className="lg:col-span-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 font-mono text-xs text-zinc-400 font-semibold flex justify-between">
            <span>DISASSEMBLED CLASSES</span>
            <span>{filtered.length}</span>
          </div>

          <div className="divide-y divide-zinc-800/60 overflow-y-auto flex-1 font-mono text-xs">
            {filtered.map((cls, idx) => {
              const isSelected = cls === current;
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
                .map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell pr-4 text-zinc-600 select-none text-right w-10">
                      {idx + 1}
                    </span>
                    <span className="table-cell">{line}</span>
                  </div>
                ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
