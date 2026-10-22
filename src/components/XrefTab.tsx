/**
 * Cross-Referencing (XREFs) Component
 * Maps callers and execution references to sensitive APIs across classes and methods.
 */

import React, { useState } from 'react';
import { Network, ArrowRight, ShieldAlert, Search, Code2, Link2 } from 'lucide-react';
import { XrefItem } from '../types/apk';

interface XrefTabProps {
  xrefs: XrefItem[];
}

export const XrefTab: React.FC<XrefTabProps> = ({ xrefs }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredXrefs = xrefs.filter((x) => {
    const matchesCat = selectedCategory === 'ALL' || x.category === selectedCategory;
    const matchesSearch =
      search === '' ||
      x.targetApi.toLowerCase().includes(search.toLowerCase()) ||
      x.description.toLowerCase().includes(search.toLowerCase()) ||
      x.callers.some((c) => c.className.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-zinc-100 text-sm">Sensitive APIs Cross-References (XREFs)</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'CRYPTO', 'NETWORK', 'DEVICE_ID', 'IPC', 'EXEC'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* XREF Cards */}
      <div className="space-y-4">
        {filteredXrefs.map((xref, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4"
          >
            {/* Target API Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    xref.risk === 'CRITICAL'
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {xref.risk} RISK
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {xref.category}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {xref.callers.length} Call Sites Found
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="text-sm font-bold text-emerald-300 break-all">
                {xref.targetApi}
              </div>
              <p className="text-xs text-zinc-400 font-sans">{xref.description}</p>
            </div>

            {/* Callers List */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Referencing Classes & Method Call Sites:
              </span>

              <div className="space-y-2">
                {xref.callers.map((caller, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-zinc-200 font-bold">{caller.className}</span>
                        <span className="text-zinc-400"> -&gt; {caller.methodName}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                      {caller.lineHint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
