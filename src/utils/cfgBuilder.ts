/**
 * Control Flow Graph (CFG) Builder
 * Analyzes Smali bytecode instructions, labels, branches (if-eqz, if-nez, goto),
 * and partitions execution paths into directed Basic Blocks.
 */

import { CfgGraph, CfgNode } from '../types/apk';

export function buildControlFlowGraph(
  className: string,
  methodName: string,
  instructions: string[]
): CfgGraph {
  if (!instructions || instructions.length === 0) {
    return {
      className,
      methodName,
      nodes: [
        {
          id: 'block_0',
          label: 'Entry / Return',
          type: 'return',
          instructions: ['return-void'],
        },
      ],
    };
  }

  const nodes: CfgNode[] = [];
  let currentBlockId = 'entry_0';
  let currentInstructions: string[] = [];
  let currentType: CfgNode['type'] = 'entry';

  // Find all branch labels
  const labelToBlockMap = new Map<string, string>();
  instructions.forEach((ins, idx) => {
    const trimmed = ins.trim();
    if (trimmed.startsWith(':')) {
      const label = trimmed.split(/\s+/)[0];
      labelToBlockMap.set(label, `block_${idx}`);
    }
  });

  for (let i = 0; i < instructions.length; i++) {
    const line = instructions[i].trim();

    // Check if line is a label starting a new block
    if (line.startsWith(':')) {
      if (currentInstructions.length > 0) {
        nodes.push({
          id: currentBlockId,
          label: currentBlockId === 'entry_0' ? 'Entry Block' : `Block (${currentBlockId})`,
          type: currentType,
          instructions: [...currentInstructions],
        });
        currentInstructions = [];
      }
      currentBlockId = labelToBlockMap.get(line.split(/\s+/)[0]) || `block_${i}`;
      currentType = 'block';
      currentInstructions.push(line);
      continue;
    }

    currentInstructions.push(line);

    // Conditional Branch: if-nez, if-eqz, if-gtz, etc.
    if (line.startsWith('if-')) {
      const parts = line.split(',');
      const targetLabel = parts[parts.length - 1].trim();
      const targetBlockId = labelToBlockMap.get(targetLabel) || `target_${targetLabel}`;
      const nextBlockId = `fallthrough_${i + 1}`;

      nodes.push({
        id: currentBlockId,
        label: `Condition (${line.split(' ')[0]})`,
        type: 'condition',
        instructions: [...currentInstructions],
        branches: [
          { targetId: targetBlockId, label: 'True (Branch)' },
          { targetId: nextBlockId, label: 'False (Fallthrough)' },
        ],
      });

      currentInstructions = [];
      currentBlockId = nextBlockId;
      currentType = 'block';
    }
    // Unconditional branch: goto
    else if (line.startsWith('goto') || line.startsWith('goto/16')) {
      const targetLabel = line.split(' ')[1]?.trim();
      const targetBlockId = labelToBlockMap.get(targetLabel) || `target_${targetLabel}`;

      nodes.push({
        id: currentBlockId,
        label: `Unconditional Jump`,
        type: 'block',
        instructions: [...currentInstructions],
        branches: [{ targetId: targetBlockId, label: 'Jump' }],
      });

      currentInstructions = [];
      currentBlockId = `block_${i + 1}`;
      currentType = 'block';
    }
    // Return statement
    else if (line.startsWith('return') || line.startsWith('throw')) {
      nodes.push({
        id: currentBlockId,
        label: line.startsWith('throw') ? 'Exception Exit' : 'Method Return',
        type: 'return',
        instructions: [...currentInstructions],
      });

      currentInstructions = [];
      currentBlockId = `block_${i + 1}`;
      currentType = 'block';
    }
  }

  // Push remainder if any
  if (currentInstructions.length > 0) {
    nodes.push({
      id: currentBlockId,
      label: 'Terminal Block',
      type: currentType === 'entry' ? 'entry' : 'return',
      instructions: [...currentInstructions],
    });
  }

  // Wire fallback sequential links for non-branching blocks
  for (let i = 0; i < nodes.length - 1; i++) {
    const node = nodes[i];
    if (!node.branches && node.type !== 'return') {
      node.branches = [{ targetId: nodes[i + 1].id, label: 'Next' }];
    }
  }

  return {
    className,
    methodName,
    nodes,
  };
}
