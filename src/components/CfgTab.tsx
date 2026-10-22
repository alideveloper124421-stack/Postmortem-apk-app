/**
 * Control Flow Graph (CFG) Interactive Visualizer
 * Renders execution flowchart of basic blocks and branching logic for complex methods.
 */

import React, { useState } from 'react';
import { GitFork, ArrowDown, CornerDownRight, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { SmaliClass, CfgGraph } from '../types/apk';

interface CfgTabProps {
  classes: SmaliClass[];
}

export const CfgTab: React.FC<CfgTabProps> = ({ classes }) => {
  const [selectedClassIdx, setSelectedClassIdx] = useState(0);
  const currentClass = classes[selectedClassIdx] || classes[0];

  const methodsWithCfg = currentClass?.methods.filter((m) => m.cfg && m.cfg.nodes.length > 0) || [];
  const [selectedMethodIdx, setSelectedMethodIdx] = useState(0);

  const currentMethod = methodsWithCfg[selectedMethodIdx] || methodsWithCfg[0];
  const cfg = currentMethod?.cfg;

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-zinc-100 text-sm">Control Flow Graph (CFG)</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <label className="text-[10px] text-zinc-500 block">Class:</label>
            <select
              value={selectedClassIdx}
              onChange={(e) => {
                setSelectedClassIdx(Number(e.target.value));
                setSelectedMethodIdx(0);
              }}
              className="bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-200"
            >
              {classes.map((c, i) => (
                <option key={i} value={i}>
                  {c.simpleName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 block">Method:</label>
            <select
              value={selectedMethodIdx}
              onChange={(e) => setSelectedMethodIdx(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-700/80 rounded px-2.5 py-1.5 text-zinc-200"
            >
              {methodsWithCfg.map((m, i) => (
                <option key={i} value={i}>
                  {m.name}()
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Flowchart Canvas */}
      {cfg ? (
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-6 min-h-[500px] overflow-x-auto">
          <div className="text-center pb-2 border-b border-zinc-800/80 font-mono text-xs">
            <span className="text-zinc-500 mr-2">METHOD ENTRY:</span>
            <span className="text-emerald-400 font-bold">{cfg.className} -&gt; {cfg.methodName}</span>
          </div>

          <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
            {cfg.nodes.map((node, idx) => {
              const isCondition = node.type === 'condition';
              const isReturn = node.type === 'return';
              const isEntry = node.type === 'entry';

              return (
                <React.Fragment key={node.id}>
                  {/* Node Box */}
                  <div
                    className={`w-full p-4 rounded-xl border font-mono text-xs transition-all shadow-md ${
                      isCondition
                        ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                        : isReturn
                        ? 'bg-pink-950/30 border-pink-500/60 text-pink-200'
                        : isEntry
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200'
                        : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                      <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {node.label}
                      </span>
                      <span className="text-[10px] opacity-75">{node.id}</span>
                    </div>

                    {/* Instruction Statements */}
                    <div className="space-y-1 text-[11px] bg-black/40 p-2 rounded">
                      {node.instructions.map((ins, insIdx) => (
                        <div key={insIdx} className="font-mono truncate">
                          {ins}
                        </div>
                      ))}
                    </div>

                    {/* Branch indicators */}
                    {node.branches && node.branches.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
                        {node.branches.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              b.label?.includes('True')
                                ? 'bg-emerald-900 text-emerald-200'
                                : b.label?.includes('False')
                                ? 'bg-red-900 text-red-200'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {b.label}: -&gt; {b.targetId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flow Arrow */}
                  {idx < cfg.nodes.length - 1 && (
                    <div className="flex flex-col items-center text-zinc-500">
                      <div className="w-0.5 h-4 bg-zinc-700" />
                      <ArrowDown className="w-4 h-4 text-zinc-500 -mt-1" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs">
          No control flow graph available for this method.
        </div>
      )}
    </div>
  );
};
