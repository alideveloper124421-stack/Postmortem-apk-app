/**
 * ADB Intent Launch & Shell Testing Tool
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { ManifestInfo, ApkAnalysisResult } from '../types/apk';
import { generateAdbCommands } from '../utils/adbCommandGenerator';

interface AdbIntentToolsTabProps {
  manifest?: ManifestInfo;
  apk?: ApkAnalysisResult;
}

export const AdbIntentToolsTab: React.FC<AdbIntentToolsTabProps> = ({ manifest, apk }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const targetManifest = manifest || apk?.manifest;
  if (!targetManifest) return null;

  const commands = generateAdbCommands(targetManifest);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCommands = commands.filter((cmd) => {
    const matchesFilter = filter === 'ALL' || cmd.category === filter;
    const matchesSearch =
      search === '' ||
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.command.toLowerCase().includes(search.toLowerCase()) ||
      cmd.componentName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-zinc-100 text-sm">ADB Component Intent Test Commands</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'ACTIVITY', 'SERVICE', 'RECEIVER', 'DIAGNOSTIC'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                filter === cat
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commands List */}
      <div className="space-y-3">
        {filteredCommands.map((cmd) => (
          <div
            key={cmd.id}
            className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 font-mono text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                  {cmd.category}
                </span>
                <span className="font-bold text-zinc-200">{cmd.label}</span>
              </div>
              <span className="text-[11px] text-zinc-500">{cmd.componentName}</span>
            </div>

            <p className="text-xs text-zinc-400 font-sans">{cmd.description}</p>

            {/* Command Box with 1-click Copy */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 gap-3">
              <span className="text-emerald-400 select-all truncate">{cmd.command}</span>
              <button
                onClick={() => handleCopy(cmd.id, cmd.command)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shrink-0 text-xs transition-colors"
                title="Copy ADB command to clipboard"
              >
                {copiedId === cmd.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === cmd.id ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
