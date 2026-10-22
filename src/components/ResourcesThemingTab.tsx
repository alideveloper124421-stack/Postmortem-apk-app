/**
 * Resource & Asset Theming Tab (for Translators, UI Modders & Recompilation)
 */

import React, { useState } from 'react';
import { Palette, Globe, Image, FileCode, Copy, Check, Download, Search } from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';
import { extractResourceData } from '../utils/resourceExtractor';
import { generateApktoolYml } from '../utils/apktoolYmlGenerator';
import { formatBytes } from '../utils/apkAnalyzer';

interface ResourcesThemingTabProps {
  apk: ApkAnalysisResult;
}

export const ResourcesThemingTab: React.FC<ResourcesThemingTabProps> = ({ apk }) => {
  const [subTab, setSubTab] = useState<'strings' | 'drawables' | 'apktool' | 'colors'>('strings');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const resData = extractResourceData(apk.manifest, apk.files);
  const apktoolYml = generateApktoolYml(apk.manifest, apk.fileName, apk.files);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadStringsXml = () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${resData.strings
      .map((s) => `    <string name="${s.name}">${s.value}</string>`)
      .join('\n')}\n</resources>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strings_${apk.manifest.packageName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStrings = resData.strings.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.value.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDrawables = resData.drawables.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSubTab('strings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'strings'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            strings.xml ({resData.strings.length})
          </button>
          <button
            onClick={() => setSubTab('drawables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'drawables'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Drawables & Assets ({resData.drawables.length})
          </button>
          <button
            onClick={() => setSubTab('colors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'colors'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Color Palette ({resData.colors.length})
          </button>
          <button
            onClick={() => setSubTab('apktool')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'apktool'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            apktool.yml Config
          </button>
        </div>

        {subTab === 'strings' && (
          <button
            onClick={handleDownloadStringsXml}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export strings.xml</span>
          </button>
        )}
      </div>

      {/* Mode 1: strings.xml Table */}
      {subTab === 'strings' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search resource string key or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/70 font-mono text-xs">
            {filteredStrings.map((item, idx) => (
              <div key={idx} className="p-3 hover:bg-zinc-900/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5 truncate">
                  <span className="text-emerald-400 font-bold block">{item.name}</span>
                  <span className="text-zinc-300 truncate block">{item.value}</span>
                </div>
                <button
                  onClick={() => handleCopy(`str-${idx}`, `<string name="${item.name}">${item.value}</string>`)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 shrink-0"
                  title="Copy XML Tag"
                >
                  {copied === `str-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Drawables & Graphics */}
      {subTab === 'drawables' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/70 font-mono text-xs">
            {filteredDrawables.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No drawable files found in res/</div>
            ) : (
              filteredDrawables.map((item, idx) => (
                <div key={idx} className="p-3 hover:bg-zinc-900/40 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold uppercase">
                      {item.format}
                    </span>
                    <span className="text-zinc-200 truncate">{item.path}</span>
                  </div>
                  <span className="text-zinc-500 text-[11px] shrink-0">{formatBytes(item.size)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Color Palette */}
      {subTab === 'colors' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {resData.colors.map((c, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2">
              <div className="w-full h-10 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: c.hex }} />
              <div>
                <span className="text-zinc-300 font-bold block truncate">{c.name}</span>
                <span className="text-zinc-500 text-[11px]">{c.hex}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 4: apktool.yml */}
      {subTab === 'apktool' && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">apktool.yml (Recompilation Blueprint)</span>
            <button
              onClick={() => handleCopy('apktool-yml', apktoolYml)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
            >
              {copied === 'apktool-yml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'apktool-yml' ? 'Copied' : 'Copy apktool.yml'}</span>
            </button>
          </div>
          <div className="p-4 font-mono text-xs text-zinc-300 overflow-auto max-h-[500px]">
            <pre>{apktoolYml}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
