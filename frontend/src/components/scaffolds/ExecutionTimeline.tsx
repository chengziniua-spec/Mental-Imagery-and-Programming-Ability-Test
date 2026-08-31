import { useMemo } from "react";
import * as d3 from "d3";
import { parseCodeStructure, type CodeBlock } from "./codeStructure";
import { colorForBlock, labelForBlock } from "./blockColors";
import "./scaffolds.css";

interface Props {
  code: string;
  currentLine?: number;
  currentStepIndex?: number;
  iterationLabel?: string | null;
  visitedLines?: number[];
}

interface Node extends CodeBlock {
  x: number;
  y: number;
}

const NODE_R = 20;
const COL_W = 130;
const ROW_H = 64;
const ROOT_ID = 0;

export function ExecutionTimeline({ code, currentLine, currentStepIndex = 0, iterationLabel, visitedLines = [] }: Props) {
  const { blocks, lines } = useMemo(() => parseCodeStructure(code), [code]);

  const currentBlockId = useMemo(() => {
    const line = lines.find((l) => l.lineNumber === currentLine);
    return line && line.blockId !== 0 ? line.blockId : null;
  }, [lines, currentLine]);

  // Every checkpoint line answered so far this task, mapped to its block -- lets the diagram show
  // the whole path taken through the structure so far, not just where the current checkpoint sits.
  const visitedBlockIds = useMemo(() => {
    const ids = new Set<number>();
    for (const lineNumber of visitedLines) {
      const line = lines.find((l) => l.lineNumber === lineNumber);
      if (line && line.blockId !== 0) ids.add(line.blockId);
    }
    return ids;
  }, [lines, visitedLines]);

  const nodes: Node[] = useMemo(() => {
    const xScale = d3.scaleLinear().domain([0, Math.max(blocks.length, 1)]).range([COL_W / 2, blocks.length * COL_W - COL_W / 2 || COL_W / 2]);
    return blocks.map((block, index) => ({
      ...block,
      x: xScale(index),
      y: (block.depth + 1) * ROW_H + ROW_H / 2,
    }));
  }, [blocks]);

  const width = Math.max(blocks.length * COL_W, COL_W);
  const maxDepth = Math.max(...nodes.map((n) => n.depth), 0);
  const height = (maxDepth + 2) * ROW_H + 24;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const rootX = nodes.length ? nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length : width / 2;
  const rootY = ROW_H / 2;

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
      <p className="scaffold-hint">
        The lit path traces how execution reached this point; the ringed node is where your current checkpoint is.
      </p>
      <div className="et-scroll">
        <svg width={width} height={height} role="img" aria-label="Execution structure timeline">
          <circle cx={rootX} cy={rootY} r={5} fill="var(--et-edge, #9fb2bd)" />

          {nodes.map((node) => {
            const parent = node.parentId === ROOT_ID ? { x: rootX, y: rootY } : nodeById.get(node.parentId);
            if (!parent) return null;
            const isVisited = visitedBlockIds.has(node.id);
            const isLive = node.id === currentBlockId;
            return (
              <line
                key={`edge-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                stroke={isVisited ? "#168d83" : "var(--et-edge, #9fb2bd)"}
                strokeWidth={isVisited ? 3 : 2}
                strokeDasharray={isLive ? "6 5" : undefined}
                className={isLive ? "et-edge-flowing" : undefined}
              />
            );
          })}

          {nodes.map((node) => {
            const isCurrent = node.id === currentBlockId;
            const isVisited = visitedBlockIds.has(node.id) && !isCurrent;
            return (
              <g
                key={isCurrent ? `${node.id}-step-${currentStepIndex}` : node.id}
                transform={`translate(${node.x}, ${node.y})`}
              >
                {isVisited && <circle r={NODE_R + 3} fill="none" stroke="#168d83" strokeWidth={1.5} opacity={0.4} />}
                {isCurrent && (
                  <circle r={NODE_R + 6} fill="none" stroke="#168d83" strokeWidth={2.5} className="et-current-ring" />
                )}
                <circle
                  r={NODE_R}
                  fill={colorForBlock(node.type, node.id)}
                  stroke="#2c3e42"
                  strokeWidth={1.5}
                  className={isCurrent ? "et-node-land" : undefined}
                />
                <text textAnchor="middle" dy="4" fontSize="11" fontWeight={600}>
                  L{node.headerLine}
                </text>
                <text textAnchor="middle" dy={NODE_R + 16} fontSize="11" fill="var(--et-label, #46565d)">
                  {labelForBlock(node.type)}
                </text>
                {isCurrent && node.type === "loop" && iterationLabel && (
                  <g className="et-lap-badge" transform={`translate(${NODE_R - 6}, ${-NODE_R - 2})`}>
                    <rect x={-30} y={-9} width={60} height={18} rx={9} fill="#168d83" />
                    <text textAnchor="middle" dy="3.5" fontSize="9" fontWeight={700} fill="#fff">
                      {iterationLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
