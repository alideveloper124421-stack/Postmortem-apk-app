/**
 * APK Archive File System & Native Libraries Tab
 */

import React, { useState } from 'react';
import { FolderArchive, Cpu, FileCheck, Search, HardDrive } from 'lucide-react';
import { ApkAnalysisResult } from '../types/apk';
import { formatBytes } from '../utils/apkAnalyzer';

interface FilesystemTabProps {
  apk: ApkAnalysisResult;
}

export const FilesystemTab: React.FC<FilesystemTabProps> = ({ apk }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const files = apk.files;
  const certs = apk.certificates;
  const nativeLibs = files.filter((f) => f.isNativeLib);

  const filteredFiles = files.filter((f) => {
    const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesSearch = search === '' || f.path.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Native Libraries & Certificates Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Native Libraries */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-300">
              Native C/C++ Binaries (.so)
            </h4>
          </div>
          {nativeLibs.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No native compiled .so libraries found. Pure Java/Kotlin Dalvik bytecode application.
            </p>
          ) : (
            <div className="space-y-1.5 font-mono text-xs">
              {nativeLibs.map((lib, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-800/80">
                  <span className="text-cyan-300 truncate">{lib.path}</span>
                  <span className="text-zinc-500 shrink-0 ml-2">{formatBytes(lib.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate & Signing */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-300">
              Cryptographic Signing & META-INF
            </h4>
          </div>
          <div className="font-mono text-xs space-y-1 text-zinc-300">
            <div>
              <span className="text-zinc-500 mr-2">V1 Jar Signature:</span>
              <span className={certs.v1Signed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {certs.v1Signed ? 'VERIFIED' : 'NOT PRESENT'}
              </span>
            </div>
            {certs.signatureAlgorithm && (
              <div>
                <span className="text-zinc-500 mr-2">Algorithm:</span>
                <span>{certs.signatureAlgorithm}</span>
              </div>
            )}
            {certs.issuer && (
              <div className="truncate">
                <span className="text-zinc-500 mr-2">Issuer:</span>
                <span className="truncate">{certs.issuer}</span>
              </div>
            )}
            {certs.sha1Fingerprint && (
              <div className="truncate">
                <span className="text-zinc-500 mr-2">SHA1:</span>
                <span className="text-[11px] text-zinc-400">{certs.sha1Fingerprint}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File System Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'DEX', 'NATIVE_LIB', 'RESOURCE', 'CERT', 'ASSET'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-zinc-200 text-zinc-950'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat} ({cat === 'ALL' ? files.length : files.filter((f) => f.category === cat).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search archive file path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* File List Table */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto font-mono text-xs">
        {filteredFiles.map((file, idx) => (
          <div key={idx} className="p-2.5 hover:bg-zinc-900/50 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 truncate">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-bold shrink-0">
                {file.category}
              </span>
              <span className="text-zinc-200 truncate select-all">{file.path}</span>
            </div>
            <div className="text-right text-zinc-500 shrink-0 text-[11px]">
              {formatBytes(file.size)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
