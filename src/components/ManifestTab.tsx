/**
 * AndroidManifest & Components Postmortem Tab
 */

import React, { useState } from 'react';
import {
  FileCode,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Search,
  Activity as ActivityIcon,
  Server,
  Radio,
  Database,
  ExternalLink,
} from 'lucide-react';
import { ApkAnalysisResult, ManifestComponent } from '../types/apk';

interface ManifestTabProps {
  apk: ApkAnalysisResult;
}

export const ManifestTab: React.FC<ManifestTabProps> = ({ apk }) => {
  const [viewMode, setViewMode] = useState<'components' | 'permissions' | 'xml'>('components');
  const [componentFilter, setComponentFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [copiedXml, setCopiedXml] = useState(false);

  const manifest = apk.manifest;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(manifest.rawXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const filteredComponents = manifest.components.filter((c) => {
    const matchesType = componentFilter === 'ALL' || c.type.toLowerCase() === componentFilter.toLowerCase();
    const matchesSearch =
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.intentFilters.some((f) => f.actions.some((a) => a.toLowerCase().includes(search.toLowerCase())));
    return matchesType && matchesSearch;
  });

  const getComponentIcon = (type: ManifestComponent['type']) => {
    switch (type) {
      case 'activity':
        return <ActivityIcon className="w-4 h-4 text-emerald-400" />;
      case 'service':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'receiver':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'provider':
        return <Database className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('components')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'components'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Components ({manifest.components.length})
          </button>
          <button
            onClick={() => setViewMode('permissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'permissions'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Permissions ({manifest.permissions.length})
          </button>
          <button
            onClick={() => setViewMode('xml')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'xml'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Decoded Raw XML
          </button>
        </div>

        {viewMode === 'xml' ? (
          <button
            onClick={handleCopyXml}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedXml ? 'Copied XML!' : 'Copy Raw XML'}</span>
          </button>
        ) : (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search components or actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        )}
      </div>

      {/* Mode 1: Components List */}
      {viewMode === 'components' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'activity', 'service', 'receiver', 'provider'].map((type) => (
              <button
                key={type}
                onClick={() => setComponentFilter(type)}
                className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-semibold transition-all ${
                  componentFilter === type
                    ? 'bg-zinc-200 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredComponents.map((comp, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {getComponentIcon(comp.type)}
                    <span className="text-xs font-mono uppercase font-bold text-zinc-400">
                      {comp.type}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        comp.exported
                          ? 'bg-red-950/80 border border-red-800 text-red-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {comp.exported ? 'Exported (Public)' : 'Internal Only'}
                    </span>
                  </div>

                  {comp.permission && (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                      Permission: {comp.permission}
                    </span>
                  )}
                </div>

                <div className="text-sm font-mono font-bold text-zinc-100 break-all">
                  {comp.name}
                </div>

                {comp.riskReason && (
                  <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-900/40">
                    ⚠ {comp.riskReason}
                  </p>
                )}

                {comp.intentFilters && comp.intentFilters.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5 font-mono text-xs">
                    {comp.intentFilters.map((filter, fIdx) => (
                      <div key={fIdx} className="bg-zinc-950/70 p-2.5 rounded border border-zinc-800/60 space-y-1">
                        {filter.actions.length > 0 && (
                          <div className="text-zinc-300">
                            <span className="text-zinc-500 mr-2">Action:</span>
                            {filter.actions.join(', ')}
                          </div>
                        )}
                        {filter.categories.length > 0 && (
                          <div className="text-zinc-400">
                            <span className="text-zinc-500 mr-2">Category:</span>
                            {filter.categories.join(', ')}
                          </div>
                        )}
                        {filter.dataSchemes && filter.dataSchemes.length > 0 && (
                          <div className="text-cyan-400">
                            <span className="text-zinc-500 mr-2">Scheme:</span>
                            {filter.dataSchemes.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Permissions List */}
      {viewMode === 'permissions' && (
        <div className="space-y-3">
          {manifest.permissions.map((perm, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                perm.isDangerous
                  ? 'bg-red-950/20 border-red-800/50'
                  : 'bg-zinc-900/40 border-zinc-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      perm.isDangerous
                        ? 'bg-red-900 text-red-200'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {perm.isDangerous ? 'DANGEROUS' : 'NORMAL'}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {perm.shortName}
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 break-all">{perm.name}</p>
                <p className="text-xs text-zinc-300">{perm.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 3: Raw XML */}
      {viewMode === 'xml' && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[600px] leading-relaxed select-text">
          <pre>{manifest.rawXml}</pre>
        </div>
      )}
    </div>
  );
};
