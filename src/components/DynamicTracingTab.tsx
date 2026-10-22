/**
 * Dynamic Behavioral Tracing Component
 * Displays execution-time network traffic, file access, crypto operations, and IPC invocations.
 */

import React, { useState } from 'react';
import { Activity, Globe, FileText, Key, Radio, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import { DynamicTraceEvent } from '../types/apk';

interface DynamicTracingTabProps {
  logs: DynamicTraceEvent[];
}

export const DynamicTracingTab: React.FC<DynamicTracingTabProps> = ({ logs }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'ALL' || log.category === filter;
    const matchesSearch =
      search === '' ||
      log.apiCall.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCategoryBadge = (cat: DynamicTraceEvent['category']) => {
    switch (cat) {
      case 'NETWORK':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'CRYPTO':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'FILE_IO':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'IPC':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-bold text-zinc-100 text-sm">Dynamic Behavioral Execution Stream</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
            LIVE SANDBOX
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'NETWORK', 'CRYPTO', 'FILE_IO', 'IPC'].map((cat) => (
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

      {/* Log Feed */}
      <div className="space-y-2.5">
        {filteredLogs.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition-all space-y-2 ${
              item.severity === 'ALERT'
                ? 'bg-amber-950/20 border-amber-800/50'
                : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-zinc-500 text-[11px]">{item.timestamp}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getCategoryBadge(item.category)}`}>
                  {item.category}
                </span>
                {item.severity === 'ALERT' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                    SECURITY ALERT
                  </span>
                )}
              </div>
            </div>

            <div className="font-mono text-xs font-bold text-zinc-200 break-all">
              {item.apiCall}
            </div>

            <p className="text-xs text-zinc-300 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
              {item.details}
            </p>

            {item.stackTrace && (
              <div className="text-[10px] font-mono text-zinc-500 pl-2 border-l border-zinc-700 whitespace-pre-line">
                {item.stackTrace}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
