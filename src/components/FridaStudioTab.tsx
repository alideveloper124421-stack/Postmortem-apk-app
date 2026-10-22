/**
 * Frida Dynamic Instrumentation Studio Tab
 */

import React, { useState } from 'react';
import {
  Terminal,
  Zap,
  Copy,
  Check,
  Download,
  Play,
  ShieldAlert,
  Code2,
  Info,
} from 'lucide-react';
import { ApkAnalysisResult, FridaScriptDef } from '../types/apk';
import { generateCustomMethodHook } from '../utils/fridaGenerator';

interface FridaStudioTabProps {
  apk: ApkAnalysisResult;
  initialCustomHook?: string | null;
}

export const FridaStudioTab: React.FC<FridaStudioTabProps> = ({ apk, initialCustomHook }) => {
  const scripts = apk.fridaScripts;
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scripts[0]?.id || 'frida-ssl-pinning');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Custom hook builder state
  const [customClass, setCustomClass] = useState<string>(apk.dex.classes[0]?.className || 'Lcom/example/app/MainActivity;');
  const [customMethod, setCustomMethod] = useState<string>('onCreate');
  const [customHookCode, setCustomHookCode] = useState<string>(
    initialCustomHook || generateCustomMethodHook(customClass, customMethod, ['Landroid/os/Bundle;'], 'V')
  );

  const isCustomMode = selectedScriptId === 'custom-hook-builder';
  const currentScript = scripts.find((s) => s.id === selectedScriptId);

  const activeCode = isCustomMode ? customHookCode : currentScript?.code || '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const fridaCliCommand = `frida -U -f ${apk.manifest.packageName} -l script.js --no-pause`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(fridaCliCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([activeCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScriptId}_${apk.manifest.packageName}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateCustom = () => {
    const code = generateCustomMethodHook(customClass, customMethod, ['Ljava/lang/String;'], 'Z');
    setCustomHookCode(code);
  };

  return (
    <div className="space-y-6">
      {/* Header and CLI instructions */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-zinc-100">
              Frida Dynamic Instrumentation Lab
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Target: {apk.manifest.packageName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCommand}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-700"
            >
              {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Frida CLI Command</span>
            </button>
          </div>
        </div>

        <div className="p-2.5 rounded bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800/80 flex items-center justify-between">
          <span className="text-purple-400 select-all">{fridaCliCommand}</span>
          <span className="text-[10px] text-zinc-500 uppercase">Android USB Mode</span>
        </div>
      </div>

      {/* Script Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {scripts.map((script) => (
          <button
            key={script.id}
            onClick={() => setSelectedScriptId(script.id)}
            className={`p-3 rounded-lg text-left transition-all border ${
              selectedScriptId === script.id
                ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="text-xs font-bold truncate">{script.name}</div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
              {script.category}
            </div>
          </button>
        ))}

        <button
          onClick={() => setSelectedScriptId('custom-hook-builder')}
          className={`p-3 rounded-lg text-left transition-all border ${
            selectedScriptId === 'custom-hook-builder'
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="text-xs font-bold truncate flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Custom Hook Studio</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
            ANY CLASS / METHOD
          </div>
        </button>
      </div>

      {/* Custom Hook Builder Controls if active */}
      {isCustomMode && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
            Target Method Hook Generator:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Select Disassembled Class</label>
              <select
                value={customClass}
                onChange={(e) => setCustomClass(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-xs font-mono text-zinc-200"
              >
                {apk.dex.classes.map((cls, idx) => (
                  <option key={idx} value={cls.className}>
                    {cls.simpleName} ({cls.packageName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 block mb-1">Method Name</label>
              <input
                type="text"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                placeholder="e.g. verifyPassword or decrypt"
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-1.5 text-xs font-mono text-zinc-200"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateCustom}
                className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded transition-colors"
              >
                Generate Hook Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Viewer */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
        <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-xs font-mono font-semibold text-zinc-300">
            {isCustomMode ? 'Custom Method Hook Script (JavaScript)' : currentScript?.name}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy JavaScript'}</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.js)</span>
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-xs text-zinc-300 overflow-auto max-h-[500px] leading-relaxed select-text">
          <pre>{activeCode}</pre>
        </div>
      </div>
    </div>
  );
};
