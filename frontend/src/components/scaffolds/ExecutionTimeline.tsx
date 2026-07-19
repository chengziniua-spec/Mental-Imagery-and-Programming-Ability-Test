import { useMemo } from "react";
import * as d3 from "d3";
import { parseCodeStructure, type CodeBlock } from "./codeStructure";
import { colorForBlock, labelForBlock } from "./blockColors";
import "./scaffolds.css";

interface Props {
  code: string;
  currentLine?: number;
}

interface Node extends CodeBlock {
  x: number;
  y: number;
}

const NODE_R = 20;
const COL_W = 130;
const ROW_H = 64;

export function ExecutionTimeline({ code, currentLine }: Props) {
  const { blocks, lines } = useMemo(() => parseCodeStructure(code), [code]);

  const currentBlockId = useMemo(() => {
    const line = lines.find((l) => l.lineNumber === currentLine);
    return line && line.blockId !== 0 ? line.blockId : null;
  }, [lines, currentLine]);

  const nodes: Node[] = useMemo(() => {
    const xScale = d3.scaleLinear().domain([0, Math.max(blocks.length, 1)]).range([COL_W / 2, blocks.length * COL_W - COL_W / 2 || COL_W / 2]);
    return blocks.map((block, index) => ({
      ...block,
      x: xScale(index),
      y: block.depth * ROW_H + ROW_H / 2,
    }));
  }, [blocks]);

  const width = Math.max(blocks.length * COL_W, COL_W);
  const height = (Math.max(...nodes.map((n) => n.depth), 0) + 1) * ROW_H + 24;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  if (blocks.length === 0) {
    return (
      <div className="scaffold-panel">
        <h4 className="scaffold-title">Execution timeline</h4>
        <p className="scaffold-hint">This snippet has no loops, branches or function calls to sequence.</p>
      </div>
    );
  }

  return (
    <div className="scaffold-panel">
      <h4 className="scaffold-title">Execution timeline</h4>
      <p className="scaffold-hint">The ringed node is the block your current checkpoint is inside.</p>
      <div className="et-scroll">
        <svg width={width} height={height} role="img" aria-label="Execution structure timeline">
          {nodes.map((node) => {
            const parent = nodeById.get(node.parentId);
            if (!parent) return null;
            return (
              <line
                key={`edge-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke="var(--et-edge, #9fb2bd)"
                strokeWidth={2}
              />
            );
          })}
          {nodes.map((node) => {
            const isCurrent = node.id === currentBlockId;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {isCurrent && (
                  <circle r={NODE_R + 6} fill="none" stroke="#168d83" strokeWidth={2.5} className="et-current-ring" />
                )}
                <circle r={NODE_R} fill={colorForBlock(node.type, node.id)} stroke="#2c3e42" strokeWidth={1.5} />
                <text textAnchor="middle" dy="4" fontSize="11" fontWeight={600}>
                  L{node.headerLine}
                </text>
                <text textAnchor="middle" dy={NODE_R + 16} fontSize="11" fill="var(--et-label, #46565d)">
                  {labelForBlock(node.type)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
