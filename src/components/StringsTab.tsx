/**
 * Strings & Leaked Secrets Scanner Tab
 */

import React, { useState } from 'react';
import { Key, Globe, Search, Copy, Check, ShieldAlert, FileText } from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';

interface StringsTabProps {
  apk: ApkAnalysisResult;
}

export const StringsTab: React.FC<StringsTabProps> = ({ apk }) => {
  const [filter, setFilter] = useState<string>('SECRETS');
  const [search, setSearch] = useState('');
  const [copiedVal, setCopiedVal] = useState<string | null>(null);

  const interesting = apk.dex.interestingStrings;
  const allStrings = apk.dex.strings;

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 2000);
  };

  const getFilteredItems = () => {
    if (filter === 'ALL_STRINGS') {
      return allStrings
        .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 300)
        .map((s) => ({ category: 'STRING' as const, value: s }));
    }

    return interesting.filter((item) => {
      const matchesFilter = filter === 'SECRETS' || item.category === filter;
      const matchesSearch = search === '' || item.value.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const items = getFilteredItems();

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'API_KEY':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'CREDENTIAL':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'URL':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'IP':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'SUSPICIOUS':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'SECRETS', label: `High Risk & Sensitive (${interesting.length})` },
            { id: 'API_KEY', label: 'API Keys' },
            { id: 'URL', label: 'URLs' },
            { id: 'IP', label: 'IPs' },
            { id: 'SUSPICIOUS', label: 'Crypto/Auth' },
            { id: 'ALL_STRINGS', label: `All Strings (${allStrings.length})` },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === btn.id
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search string value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Strings List */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
        {items.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No strings match this search query or filter.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              className="p-3 hover:bg-zinc-900/50 flex items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-center space-x-3 truncate">
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase shrink-0 ${getCategoryBadge(item.category)}`}>
                  {item.category}
                </span>
                <span className="text-zinc-200 truncate select-all">{item.value}</span>
              </div>

              <button
                onClick={() => handleCopy(item.value)}
                className="text-zinc-400 hover:text-zinc-200 p-1 shrink-0"
                title="Copy string"
              >
                {copiedVal === item.value ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
