/**
 * Dalvik Smali Opcode Reference Cheatsheet for Modders & Analysts
 */

import React, { useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';

interface OpcodeDef {
  opcode: string;
  category: 'CONSTANTS' | 'BRANCH' | 'INVOKE' | 'FIELDS' | 'OBJECTS' | 'RETURN';
  syntax: string;
  description: string;
  example: string;
}

const DALVIK_OPCODES: OpcodeDef[] = [
  {
    opcode: 'const/4',
    category: 'CONSTANTS',
    syntax: 'const/4 vx, lit4',
    description: 'Loads 4-bit literal integer into register vx (0x0 to 0xf). Commonly used for boolean true (0x1) or false (0x0).',
    example: 'const/4 v0, 0x1',
  },
  {
    opcode: 'const-string',
    category: 'CONSTANTS',
    syntax: 'const-string vx, "string"',
    description: 'Loads string constant reference into register vx.',
    example: 'const-string v0, "https://api.example.com"',
  },
  {
    opcode: 'move-result',
    category: 'CONSTANTS',
    syntax: 'move-result vx',
    description: 'Moves return value of previous method call into register vx.',
    example: 'invoke-virtual {p0}, LApp;->isReady()Z\nmove-result v0',
  },
  {
    opcode: 'if-eqz',
    category: 'BRANCH',
    syntax: 'if-eqz vx, :target_label',
    description: 'Branches to target_label if register vx equals 0 (false / null).',
    example: 'if-eqz v0, :cond_failure',
  },
  {
    opcode: 'if-nez',
    category: 'BRANCH',
    syntax: 'if-nez vx, :target_label',
    description: 'Branches to target_label if register vx is NOT equal to 0 (true / non-null).',
    example: 'if-nez v0, :cond_success',
  },
  {
    opcode: 'goto',
    category: 'BRANCH',
    syntax: 'goto :target_label',
    description: 'Unconditional jump to target_label.',
    example: 'goto :goto_0',
  },
  {
    opcode: 'invoke-virtual',
    category: 'INVOKE',
    syntax: 'invoke-virtual {vA, vB...}, LClass;->method()Type',
    description: 'Invokes standard non-private, non-static virtual method.',
    example: 'invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z',
  },
  {
    opcode: 'invoke-static',
    category: 'INVOKE',
    syntax: 'invoke-static {vA, vB...}, LClass;->method()Type',
    description: 'Invokes a static method without requiring an object instance.',
    example: 'invoke-static {v0}, Landroid/util/Log;->d(Ljava/lang/String;)I',
  },
  {
    opcode: 'invoke-direct',
    category: 'INVOKE',
    syntax: 'invoke-direct {p0...}, LClass;-><init>()V',
    description: 'Invokes private method or constructor (<init>).',
    example: 'invoke-direct {p0}, Landroid/app/Activity;-><init>()V',
  },
  {
    opcode: 'sget-object',
    category: 'FIELDS',
    syntax: 'sget-object vx, LClass;->fieldName:LType;',
    description: 'Reads static object field into register vx.',
    example: 'sget-object v0, Landroid/os/Build;->TAGS:Ljava/lang/String;',
  },
  {
    opcode: 'sput-object',
    category: 'FIELDS',
    syntax: 'sput-object vx, LClass;->fieldName:LType;',
    description: 'Stores register vx value into static object field.',
    example: 'sput-object v0, LConfig;->DEBUG_MODE:Z',
  },
  {
    opcode: 'iget-object',
    category: 'FIELDS',
    syntax: 'iget-object vx, vy, LClass;->fieldName:LType;',
    description: 'Reads instance object field from object vy into register vx.',
    example: 'iget-object v0, p0, LMainActivity;->client:LApiClient;',
  },
  {
    opcode: 'return',
    category: 'RETURN',
    syntax: 'return vx',
    description: 'Returns single-word value (int, float, boolean) in register vx.',
    example: 'const/4 v0, 0x1\nreturn v0',
  },
  {
    opcode: 'return-void',
    category: 'RETURN',
    syntax: 'return-void',
    description: 'Returns from void method.',
    example: 'return-void',
  },
  {
    opcode: 'return-object',
    category: 'RETURN',
    syntax: 'return-object vx',
    description: 'Returns object reference in register vx.',
    example: 'return-object v0',
  },
];

interface SmaliOpcodeHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmaliOpcodeHelper: React.FC<SmaliOpcodeHelperProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = DALVIK_OPCODES.filter(
    (o) =>
      o.opcode.toLowerCase().includes(search.toLowerCase()) ||
      o.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono text-sm">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-zinc-100">Dalvik Smali Opcode Cheatsheet</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search opcode (e.g. const/4, if-eqz, invoke-virtual)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs divide-y divide-zinc-800/60">
          {filtered.map((op, idx) => (
            <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-sm">{op.opcode}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                  {op.category}
                </span>
              </div>
              <div className="text-zinc-300 font-semibold">{op.syntax}</div>
              <p className="text-zinc-400 text-xs font-sans">{op.description}</p>
              <div className="p-2 rounded bg-zinc-900 text-cyan-300 text-[11px] whitespace-pre">
                {op.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
