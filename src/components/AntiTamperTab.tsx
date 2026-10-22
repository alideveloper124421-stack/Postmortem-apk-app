/**
 * Security & Anti-Tamper Mechanisms Detection Component
 */

import React from 'react';
import { ShieldAlert, Shield, Bug, Lock, Smartphone, FileSearch } from 'lucide-react';
import { AntiTamperRoutine } from '../types/apk';

interface AntiTamperTabProps {
  routines: AntiTamperRoutine[];
}

export const AntiTamperTab: React.FC<AntiTamperTabProps> = ({ routines }) => {
  const getIcon = (type: AntiTamperRoutine['type']) => {
    switch (type) {
      case 'ROOT':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'EMULATOR':
        return <Smartphone className="w-5 h-5 text-purple-400" />;
      case 'SSL_PINNING':
        return <Lock className="w-5 h-5 text-cyan-400" />;
      case 'ANTI_DEBUG':
        return <Bug className="w-5 h-5 text-amber-400" />;
      default:
        return <Shield className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBadgeColor = (type: AntiTamperRoutine['type']) => {
    switch (type) {
      case 'ROOT':
        return 'bg-red-950/80 border-red-800 text-red-300';
      case 'EMULATOR':
        return 'bg-purple-950/80 border-purple-800 text-purple-300';
      case 'SSL_PINNING':
        return 'bg-cyan-950/80 border-cyan-800 text-cyan-300';
      case 'ANTI_DEBUG':
        return 'bg-amber-950/80 border-amber-800 text-amber-300';
      default:
        return 'bg-emerald-950/80 border-emerald-800 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          Security & Anti-Tamper Mechanisms Detected ({routines.length})
        </h3>
        <p className="text-xs text-zinc-400">
          Pinpoints implemented Root detection, Emulator detection, SSL Pinning, and Anti-Debugging routines in the application codebase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map((routine, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {getIcon(routine.type)}
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getBadgeColor(routine.type)}`}>
                  {routine.type}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                {routine.confidence} CONFIDENCE
              </span>
            </div>

            <h4 className="text-sm font-bold text-zinc-100">{routine.name}</h4>

            <div className="space-y-1 font-mono text-xs">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-300 break-all">
                <span className="text-zinc-500 mr-2">Exact Location:</span>
                <span className="text-cyan-400 font-bold">{routine.location}</span>
              </div>
              <p className="text-xs text-zinc-400 pt-1 leading-relaxed">
                <span className="text-zinc-500 font-semibold mr-1">Heuristic:</span>
                {routine.detectionMethod}
              </p>
            </div>

            {/* Code Snippet */}
            <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto">
              <pre>{routine.codeSnippet}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
