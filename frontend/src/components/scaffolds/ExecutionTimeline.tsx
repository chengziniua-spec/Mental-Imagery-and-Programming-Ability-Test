import { useMemo } from "react";
import { buildFlowchart, type FlowNode } from "./flowchartStructure";
import "./scaffolds.css";

interface Props {
  code: string;
  currentLine?: number;
  currentStepIndex?: number;
  iterationLabel?: string | null;
  visitedLines?: number[];
}

interface Pos {
  x: number;
  y: number;
}

interface RenderEdge {
  fromId: number;
  toId: number;
  label?: "YES" | "NO";
  loopback?: boolean;
}

const ROW_H = 110;
const COL_W = 180;
const PROC_W = 170;
const PROC_H = 46;
const DEC_W = 170;
const DEC_H = 78;
const TERM_W = 100;
const TERM_H = 34;

function wrapLabel(text: string, maxChars = 24): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function layoutFlowchart(start: FlowNode, end: FlowNode) {
  const positions = new Map<number, Pos>();
  const nodesById = new Map<number, FlowNode>();
  const edges: RenderEdge[] = [];
  const endConnections: { fromId: number; pos: Pos }[] = [];
  let maxX = 0;

  function visit(node: FlowNode, x: number, y: number) {
    positions.set(node.id, { x, y });
    nodesById.set(node.id, node);
    maxX = Math.max(maxX, x);

    const goTo = (child: FlowNode | undefined, cx: number, cy: number, label?: "YES" | "NO") => {
      if (!child) return;
      if (child.type === "end") {
        endConnections.push({ fromId: node.id, pos: { x, y } });
        edges.push({ fromId: node.id, toId: end.id, label });
        return;
      }
      if (positions.has(child.id)) {
        edges.push({ fromId: node.id, toId: child.id, label, loopback: true });
        return;
      }
      edges.push({ fromId: node.id, toId: child.id, label });
      visit(child, cx, cy);
    };

    if (node.type === "start" || node.type === "process") {
      goTo(node.next, x, y + ROW_H);
    } else if (node.type === "decision") {
      if (node.isLoop) {
        goTo(node.yes, x + COL_W, y, "YES");
        goTo(node.no, x, y + ROW_H, "NO");
      } else {
        goTo(node.yes, x, y + ROW_H, "YES");
        goTo(node.no, x + COL_W, y, "NO");
      }
    }
  }

  visit(start, 0, 0);

  const allY = [...positions.values()].map((p) => p.y);
  const maxY = allY.length ? Math.max(...allY) : 0;
  const endY = maxY + ROW_H;
  const endX = maxX / 2;
  positions.set(end.id, { x: endX, y: endY });
  nodesById.set(end.id, end);

  return { positions, nodesById, edges, endConnections, maxX, endY };
}

// Backward-propagate "on the path so far" from directly-visited nodes to every ancestor
// decision that leads to them (e.g. a loop's own header line is never itself a checkpoint,
// but it should still read as "visited" for as long as its body has been).
function computeVisitedIds(edges: RenderEdge[], directlyVisited: Set<number>): Set<number> {
  const predecessors = new Map<number, number[]>();
  for (const edge of edges) {
    if (!predecessors.has(edge.toId)) predecessors.set(edge.toId, []);
    predecessors.get(edge.toId)!.push(edge.fromId);
  }
  const visited = new Set(directlyVisited);
  const queue = [...directlyVisited];
  while (queue.length) {
    const id = queue.pop()!;
    for (const pred of predecessors.get(id) ?? []) {
      if (!visited.has(pred)) {
        visited.add(pred);
        queue.push(pred);
      }
    }
  }
  return visited;
}

export function ExecutionTimeline({ code, currentLine, currentStepIndex = 0, iterationLabel, visitedLines = [] }: Props) {
  const { start, end } = useMemo(() => buildFlowchart(code), [code]);
  const layout = useMemo(() => layoutFlowchart(start, end), [start, end]);
  const { positions, nodesById, edges, endConnections, maxX, endY } = layout;

  const currentNodeId = useMemo(() => {
    for (const node of nodesById.values()) {
      if (node.line === currentLine) return node.id;
    }
    return null;
  }, [nodesById, currentLine]);

  const visitedIds = useMemo(() => {
    const direct = new Set<number>();
    for (const node of nodesById.values()) {
      if (node.line !== undefined && visitedLines.includes(node.line)) direct.add(node.id);
    }
    return computeVisitedIds(edges, direct);
  }, [nodesById, edges, visitedLines]);

  const width = maxX + PROC_W + 40;
  const height = endY + TERM_H + 24;

  const renderShape = (node: FlowNode, isCurrent: boolean, isVisited: boolean) => {
    const fillLit = isVisited || isCurrent ? "#eaf5f3" : "#f8fafb";
    const strokeLit = isVisited || isCurrent ? "#168d83" : "#9fb2bd";

    if (node.type === "start" || node.type === "end") {
      return (
        <g>
          <rect
            x={-TERM_W / 2}
            y={-TERM_H / 2}
            width={TERM_W}
            height={TERM_H}
            rx={TERM_H / 2}
            fill={node.type === "start" ? "#16242d" : "#46565d"}
          />
          <text textAnchor="middle" dy="4" fontSize="11" fontWeight={600} fill="#fff">
            {node.type === "start" ? "Start" : "End"}
          </text>
        </g>
      );
    }

    if (node.type === "decision") {
      const lines = wrapLabel(node.text ?? "");
      const pts = `0,${-DEC_H / 2} ${DEC_W / 2},0 0,${DEC_H / 2} ${-DEC_W / 2},0`;
      const ringPts = `0,${-DEC_H / 2 - 10} ${DEC_W / 2 + 10},0 0,${DEC_H / 2 + 10} ${-DEC_W / 2 - 10},0`;
      return (
        <g className={isCurrent ? "et-node-land" : undefined}>
          {isCurrent && <polygon points={ringPts} fill="none" stroke="#168d83" strokeWidth={2.5} className="et-current-ring" />}
          <polygon points={pts} fill={fillLit} stroke={strokeLit} strokeWidth={isCurrent ? 2.5 : 1.5} />
          {lines.map((line, i) => (
            <text key={i} textAnchor="middle" dy={4 + (i - (lines.length - 1) / 2) * 13} fontSize="10.5" fontFamily="Fira Code, Consolas, monospace">
              {line}
            </text>
          ))}
          {isCurrent && iterationLabel && (
            <g className="et-lap-badge" transform={`translate(${DEC_W / 2 - 10}, ${-DEC_H / 2 - 4})`}>
              <rect x={-32} y={-9} width={64} height={18} rx={9} fill="#168d83" />
              <text textAnchor="middle" dy="3.5" fontSize="9" fontWeight={700} fill="#fff">
                {iterationLabel}
              </text>
            </g>
          )}
        </g>
      );
    }

    const lines = wrapLabel(node.text ?? "");
    return (
      <g className={isCurrent ? "et-node-land" : undefined}>
        {isCurrent && (
          <rect
            x={-PROC_W / 2 - 6}
            y={-PROC_H / 2 - 6}
            width={PROC_W + 12}
            height={PROC_H + 12}
            rx={9}
            fill="none"
            stroke="#168d83"
            strokeWidth={2.5}
            className="et-current-ring"
          />
        )}
        <rect x={-PROC_W / 2} y={-PROC_H / 2} width={PROC_W} height={PROC_H} rx={5} fill={fillLit} stroke={strokeLit} strokeWidth={isCurrent ? 2.5 : 1.5} />
        {lines.map((line, i) => (
          <text key={i} textAnchor="middle" dy={4 + (i - (lines.length - 1) / 2) * 13} fontSize="10.5" fontFamily="Fira Code, Consolas, monospace">
            {line}
          </text>
        ))}
        {isCurrent && iterationLabel && (
          <g className="et-lap-badge" transform={`translate(${PROC_W / 2 - 10}, ${-PROC_H / 2 - 4})`}>
            <rect x={-32} y={-9} width={64} height={18} rx={9} fill="#168d83" />
            <text textAnchor="middle" dy="3.5" fontSize="9" fontWeight={700} fill="#fff">
              {iterationLabel}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="scaffold-panel">
      <h4 className="scaffold-title">Execution flowchart</h4>
      <p className="scaffold-hint">
        A plain-language flowchart of what the code does. The lit path traces how execution reached this
        point; the ringed shape is where your current checkpoint is. It never shows computed values --
        you still have to work those out yourself.
      </p>
      <div className="et-scroll">
        <svg width={width} height={height} role="img" aria-label="Execution flowchart">
          <g transform={`translate(${width / 2 - maxX / 2}, 20)`}>
            {edges.map((edge, i) => {
              const from = positions.get(edge.fromId);
              const to = positions.get(edge.toId);
              if (!from || !to) return null;
              const isLive = edge.toId === currentNodeId;
              if (edge.loopback) {
                const bulge = 46;
                const path = `M ${from.x + 60} ${from.y} C ${from.x + 60 + bulge} ${from.y}, ${to.x + 60 + bulge} ${to.y}, ${to.x + 60} ${to.y}`;
                const isVisitedEdge = visitedIds.has(edge.fromId) && visitedIds.has(edge.toId);
                return (
                  <path
                    key={`edge-${i}`}
                    d={path}
                    fill="none"
                    stroke={isVisitedEdge ? "#168d83" : "#9fb2bd"}
                    strokeWidth={isVisitedEdge ? 2.5 : 1.5}
                    markerEnd="url(#et-arrow)"
                  />
                );
              }
              const isVisitedEdge = visitedIds.has(edge.fromId) && visitedIds.has(edge.toId);
              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isVisitedEdge ? "#168d83" : "#9fb2bd"}
                    strokeWidth={isVisitedEdge ? 2.5 : 1.5}
                    strokeDasharray={isLive ? "6 5" : undefined}
                    className={isLive ? "et-edge-flowing" : undefined}
                    markerEnd="url(#et-arrow)"
                  />
                  {edge.label && (
                    <text
                      x={from.x === to.x ? from.x + 10 : (from.x + to.x) / 2}
                      y={from.x === to.x ? (from.y + to.y) / 2 : from.y - 8}
                      fontSize="10"
                      fontWeight={700}
                      fill={isVisitedEdge ? "#168d83" : "#63727c"}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {endConnections.map(({ fromId, pos }, i) => {
              const mergeY = endY - ROW_H / 2;
              const path = `M ${pos.x} ${pos.y + PROC_H / 2} L ${pos.x} ${mergeY} L ${maxX / 2} ${mergeY} L ${maxX / 2} ${endY - TERM_H / 2}`;
              const isVisitedEdge = visitedIds.has(fromId);
              return (
                <path
                  key={`endconn-${i}`}
                  d={path}
                  fill="none"
                  stroke={isVisitedEdge ? "#168d83" : "#9fb2bd"}
                  strokeWidth={isVisitedEdge ? 2.5 : 1.5}
                  markerEnd="url(#et-arrow)"
                />
              );
            })}

            <defs>
              <marker id="et-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#9fb2bd" />
              </marker>
            </defs>

            {[...positions.entries()].map(([id, pos]) => {
              const node = nodesById.get(id);
              if (!node) return null;
              const isCurrent = id === currentNodeId;
              const isVisited = visitedIds.has(id);
              return (
                <g
                  key={isCurrent ? `${id}-step-${currentStepIndex}` : id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                >
                  {renderShape(node, isCurrent, isVisited)}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
