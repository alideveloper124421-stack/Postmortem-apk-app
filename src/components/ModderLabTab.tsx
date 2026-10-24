/**
 * Modder & Reverse Engineering Reconnaissance Lab Tab
 * Dedicated command-center for Android Modders and Reverse Engineers:
 * Kill-Switch Hunting, Smali Patch generation, Ad Nuking, and Dynamic Frida Scripting.
 */

import React, { useState } from 'react';
import {
  Crosshair,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Search,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Flame,
  ArrowRight,
  ChevronRight,
  Eye,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { ApkAnalysisResult, KillSwitchTarget, AdTrackerNetwork } from '../types/apk';

interface ModderLabTabProps {
  apk: ApkAnalysisResult;
  onNavigateToSmali?: (className: string) => void;
}

export const ModderLabTab: React.FC<ModderLabTabProps> = ({ apk, onNavigateToSmali }) => {
  const [activeSubTab, setActiveSubTab] = useState<'targets' | 'ads' | 'sandbox' | 'frida'>('targets');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sandbox state
  const [sandboxClass, setSandboxClass] = useState('com.example.app.BillingService');
  const [sandboxMethod, setSandboxMethod] = useState('isUserSubscribed');
  const [sandboxPattern, setSandboxPattern] = useState<'FORCE_TRUE' | 'FORCE_FALSE' | 'RETURN_VOID' | 'MAX_INT' | 'CUSTOM_INT'>('FORCE_TRUE');
  const [customIntValue, setCustomIntValue] = useState('999999');

  const recon = apk.modderRecon;
  const killSwitches = recon?.killSwitches || [];
  const adTrackers = recon?.adTrackers || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFridaScript = () => {
    const script = recon?.masterFridaScript || '// No script generated';
    const blob = new Blob([script], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frida_master_hook_${apk.manifest.packageName}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTargets = killSwitches.filter((target) => {
    const matchesCategory = filterCategory === 'ALL' || target.category === filterCategory;
    const matchesQuery =
      target.cleanClassName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Calculate Sandbox Output
  const generateSandboxSmali = () => {
    const cleanCls = sandboxClass.replace(/^L/, '').replace(/;$/, '').replace(/\//g, '.');
    let smaliBody = '';

    if (sandboxPattern === 'FORCE_TRUE') {
      smaliBody = [
        `# Forced Boolean TRUE (Unlock Feature / Bypass Check)`,
        `.method public ${sandboxMethod}()Z`,
        `    .registers 2`,
        `    const/4 v0, 0x1    # Set register v0 to 1 (true)`,
        `    return v0`,
        `.end method`,
      ].join('\n');
    } else if (sandboxPattern === 'FORCE_FALSE') {
      smaliBody = [
        `# Forced Boolean FALSE (Anti-Tamper / Root / License Fail Bypass)`,
        `.method public ${sandboxMethod}()Z`,
        `    .registers 2`,
        `    const/4 v0, 0x0    # Set register v0 to 0 (false)`,
        `    return v0`,
        `.end method`,
      ].join('\n');
    } else if (sandboxPattern === 'RETURN_VOID') {
      smaliBody = [
        `# Neutralized Method (Silence Ad / Telemetry / Crash / Ban Hook)`,
        `.method public ${sandboxMethod}()V`,
        `    .registers 1`,
        `    return-void`,
        `.end method`,
      ].join('\n');
    } else if (sandboxPattern === 'MAX_INT') {
      smaliBody = [
        `# Forced 32-bit Integer (Max Coins / Unlimited Gems: 2,147,483,647)`,
        `.method public ${sandboxMethod}()I`,
        `    .registers 2`,
        `    const v0, 0x7fffffff    # Integer.MAX_VALUE`,
        `    return v0`,
        `.end method`,
      ].join('\n');
    } else {
      const val = parseInt(customIntValue, 10) || 0;
      smaliBody = [
        `# Custom Integer Value: ${val}`,
        `.method public ${sandboxMethod}()I`,
        `    .registers 2`,
        `    const v0, 0x${val.toString(16)}`,
        `    return v0`,
        `.end method`,
      ].join('\n');
    }

    const fridaCode = [
      `Java.perform(function() {`,
      `    try {`,
      `        var targetClass = Java.use("${cleanCls}");`,
      sandboxPattern === 'FORCE_TRUE'
        ? `        targetClass.${sandboxMethod}.implementation = function() {\n            console.log("[HOOK] ${sandboxMethod}() forced to true");\n            return true;\n        };`
        : sandboxPattern === 'FORCE_FALSE'
        ? `        targetClass.${sandboxMethod}.implementation = function() {\n            console.log("[HOOK] ${sandboxMethod}() forced to false");\n            return false;\n        };`
        : sandboxPattern === 'RETURN_VOID'
        ? `        targetClass.${sandboxMethod}.implementation = function() {\n            console.log("[HOOK] ${sandboxMethod}() silenced (return-void)");\n        };`
        : `        targetClass.${sandboxMethod}.implementation = function() {\n            return ${sandboxPattern === 'MAX_INT' ? '2147483647' : parseInt(customIntValue, 10) || 0};\n        };`,
      `    } catch (e) { console.error("Hook error: " + e); }`,
      `});`,
    ].join('\n');

    return { smaliBody, fridaCode };
  };

  const sandboxResult = generateSandboxSmali();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-cyan-950/40 border border-emerald-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[11px] font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>Modder & Reverse Engineer Recon Lab</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                PRO WORKBENCH
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Automated Kill-Switch Hunter & Smali Patch Generator
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dissects Dalvik bytecodes to detect VIP/License boolean gates, commercial ad SDKs, and integrity checks. Generates drop-in Smali replacements and ready-to-inject dynamic Frida hooks with one-click copying.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadFridaScript}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Master hook.js</span>
            </button>
            <button
              onClick={() => handleCopy(recon?.masterFridaScript || '', 'top-frida')}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-colors"
            >
              {copiedId === 'top-frida' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'top-frida' ? 'Copied All!' : 'Copy Frida Script'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-emerald-400">{killSwitches.length}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Kill-Switches / Gates</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-cyan-400">{adTrackers.length}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Ad & Tracker SDKs</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-amber-400">{apk.antiTamperRoutines.length}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Anti-Tamper Routines</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="text-2xl font-black font-mono text-purple-400">{apk.dex.classesCount}</div>
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Total Classes Parsed</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('targets')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'targets'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Target Kill-Switches ({killSwitches.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ads')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'ads'
                ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Ad SDKs Nuker ({adTrackers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sandbox')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'sandbox'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Smali Patch Sandbox</span>
          </button>

          <button
            onClick={() => setActiveSubTab('frida')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeSubTab === 'frida'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Master Frida Suite</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: TARGET KILL-SWITCHES */}
      {activeSubTab === 'targets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'VIP_PREMIUM', 'SUBSCRIPTION', 'LICENSE', 'AD_REMOVAL', 'SECURITY_BYPASS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                    filterCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search class or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Targets Grid */}
          {filteredTargets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <Crosshair className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-300">No matching kill-switches found</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Try switching the category filter or use the Smali Patch Sandbox to generate custom bytecode patches for obfuscated methods.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTargets.map((target, idx) => (
                <div
                  key={target.id}
                  className="rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-5 space-y-4 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          TARGET #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          {target.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800">
                          Confidence: {target.confidence}
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-zinc-100 flex items-center space-x-1.5">
                        <span className="text-zinc-400">{target.cleanClassName}</span>
                        <span className="text-emerald-400">{'->'}{target.methodName}()</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {onNavigateToSmali && (
                        <button
                          onClick={() => onNavigateToSmali(target.className)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>View in Smali</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(target.patchedSmali, `smali-${target.id}`)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold transition-colors"
                      >
                        {copiedId === `smali-${target.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === `smali-${target.id}` ? 'Copied Smali!' : 'Copy Smali Patch'}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(target.fridaHook, `frida-${target.id}`)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-mono font-bold transition-colors"
                      >
                        {copiedId === `frida-${target.id}` ? <Check className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                        <span>{copiedId === `frida-${target.id}` ? 'Copied Frida!' : 'Copy Frida Hook'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Description / Action Advice */}
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs flex items-center justify-between">
                    <span className="text-zinc-400">{target.reason}</span>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      {target.suggestedAction}
                    </span>
                  </div>

                  {/* Smali Patch & Frida Code Side-by-Side or Stacked */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Smali Patch View */}
                    <div className="p-3 rounded-lg bg-black border border-zinc-800/90 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400">
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <Code2 className="w-3 h-3" />
                          <span>Drop-in Smali Patch</span>
                        </span>
                        <span className="text-zinc-500 text-[10px]">APKTool / Smali</span>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                        {target.patchedSmali}
                      </pre>
                    </div>

                    {/* Frida Hook View */}
                    <div className="p-3 rounded-lg bg-black border border-zinc-800/90 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400">
                        <span className="text-cyan-400 flex items-center space-x-1">
                          <Terminal className="w-3 h-3" />
                          <span>Frida Dynamic Hook</span>
                        </span>
                        <span className="text-zinc-500 text-[10px]">Live Memory</span>
                      </div>
                      <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                        {target.fridaHook}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AD SDKS NUKER */}
      {activeSubTab === 'ads' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
            Detected {adTrackers.length} commercial advertising or telemetry networks inside this APK. Silencing these packages prevents ads, reduces battery/network consumption, and clears anti-mod telemetry reports.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adTrackers.map((ad, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {ad.category}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100">{ad.name}</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(ad.nukeRecipe.smaliPatch, `ad-smali-${idx}`)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors"
                  >
                    {copiedId === `ad-smali-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Patch</span>
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-zinc-400 font-mono text-[11px]">Identified Classes:</div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {ad.detectedClasses.map((cls, cIdx) => (
                      <span key={cIdx} className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 font-mono text-[10px] border border-zinc-800">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">SMALI RETURN-VOID NUKE RECIPE:</div>
                  <pre className="text-xs font-mono text-amber-300 overflow-x-auto">
                    {ad.nukeRecipe.smaliPatch}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: SMALI PATCH SANDBOX */}
      {activeSubTab === 'sandbox' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Interactive Smali Bytecode Generator</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Configure a target class, method name, and desired behavior. The generator instantly crafts exact Smali instructions and the matching Frida hook.
            </p>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Class Name</label>
                <input
                  type="text"
                  value={sandboxClass}
                  onChange={(e) => setSandboxClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Method Name</label>
                <input
                  type="text"
                  value={sandboxMethod}
                  onChange={(e) => setSandboxMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Strategy Options */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-2">Patch Behavior</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'FORCE_TRUE', label: 'Force True (0x1)', desc: 'VIP / License' },
                  { id: 'FORCE_FALSE', label: 'Force False (0x0)', desc: 'Anti-Root / Ban' },
                  { id: 'RETURN_VOID', label: 'Return Void (Nuke)', desc: 'Ads / Telemetry' },
                  { id: 'MAX_INT', label: 'Max Int (2.1B)', desc: 'Coins / Gems' },
                  { id: 'CUSTOM_INT', label: 'Custom Number', desc: 'Custom Status' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSandboxPattern(item.id as any)}
                    className={`p-2.5 rounded-lg text-left border transition-all ${
                      sandboxPattern === item.id
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {sandboxPattern === 'CUSTOM_INT' && (
              <div className="w-48">
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Custom Integer Value</label>
                <input
                  type="number"
                  value={customIntValue}
                  onChange={(e) => setCustomIntValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {/* Generated Result */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Smali Drop-in Patch</span>
                </span>
                <button
                  onClick={() => handleCopy(sandboxResult.smaliBody, 'sandbox-smali')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  {copiedId === 'sandbox-smali' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'sandbox-smali' ? 'Copied!' : 'Copy Smali'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {sandboxResult.smaliBody}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Frida Hook Script</span>
                </span>
                <button
                  onClick={() => handleCopy(sandboxResult.fridaCode, 'sandbox-frida')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
                >
                  {copiedId === 'sandbox-frida' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'sandbox-frida' ? 'Copied!' : 'Copy Frida'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {sandboxResult.fridaCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: MASTER FRIDA SUITE */}
      {activeSubTab === 'frida' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                All-in-One Master Frida Script automatically bundles Universal SSL Pinning bypass, Root evasion, detected Kill-Switches, and Ad muting.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadFridaScript}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save hook.js</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black border border-zinc-800">
            <pre className="text-xs font-mono text-emerald-300 max-h-[600px] overflow-y-auto leading-relaxed">
              {recon?.masterFridaScript || '// No script generated'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
