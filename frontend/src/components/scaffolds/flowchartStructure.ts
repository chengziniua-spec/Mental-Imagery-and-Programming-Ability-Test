export type FlowNodeType = "start" | "end" | "process" | "decision";

export interface FlowNode {
  id: number;
  type: FlowNodeType;
  line?: number;
  text?: string;
  isLoop?: boolean;
  next?: FlowNode; // start/process -> single successor
  yes?: FlowNode; // decision -> taken branch
  no?: FlowNode; // decision -> not-taken branch (next elif/else, loop exit, or fallthrough)
}

interface RawLine {
  lineNumber: number;
  indent: number;
  trimmed: string;
}

const LOOP_RE = /^(for|while)\b.*:$/;
const IF_RE = /^if\b.*:$/;
const ELIF_RE = /^elif\b.*:$/;
const ELSE_RE = /^else\s*:$/;
const DEF_RE = /^def\b.*:$/;

function preprocess(code: string): RawLine[] {
  return code
    .replace(/\n$/, "")
    .split("\n")
    .map((raw, index) => ({
      lineNumber: index + 1,
      indent: raw.length - raw.trimStart().length,
      trimmed: raw.trim(),
    }))
    .filter((line) => line.trimmed !== "");
}

function stripColon(text: string): string {
  return text.endsWith(":") ? text.slice(0, -1) : text;
}

/**
 * Structural-only parser that turns Python-like code into a flowchart graph (decisions,
 * process steps, a single shared end) so a scaffold can show what the code *means* -- never
 * what it computes. Every label is copied verbatim from the source; nothing here ever
 * evaluates a condition or predicts a variable's value, which would hand the tracing task's
 * answer straight to the participant.
 */
export function buildFlowchart(code: string): { start: FlowNode; end: FlowNode } {
  let nextId = 1;
  const makeId = () => nextId++;
  const end: FlowNode = { id: makeId(), type: "end" };

  function parseSequence(rawLines: RawLine[], index: number, indent: number, continuation: FlowNode): { entry: FlowNode; index: number } {
    if (index >= rawLines.length || rawLines[index].indent < indent) {
      return { entry: continuation, index };
    }
    const line = rawLines[index];
    const bodyIndent = rawLines[index + 1] ? rawLines[index + 1].indent : indent + 1;

    if (LOOP_RE.test(line.trimmed)) {
      const decision: FlowNode = { id: makeId(), type: "decision", line: line.lineNumber, text: stripColon(line.trimmed), isLoop: true };
      const { entry: bodyEntry, index: afterBody } = parseSequence(rawLines, index + 1, bodyIndent, decision);
      decision.yes = bodyEntry;
      const { entry: restEntry, index: afterRest } = parseSequence(rawLines, afterBody, indent, continuation);
      decision.no = restEntry;
      return { entry: decision, index: afterRest };
    }

    if (IF_RE.test(line.trimmed) || ELIF_RE.test(line.trimmed)) {
      const decision: FlowNode = { id: makeId(), type: "decision", line: line.lineNumber, text: stripColon(line.trimmed) };
      const { entry: bodyEntry, index: afterBody } = parseSequence(rawLines, index + 1, bodyIndent, continuation);
      decision.yes = bodyEntry;
      // Whatever comes next at this indent -- an elif/else (chains into a new decision/body), a
      // plain following statement (falls through to it), or nothing (falls through to the outer
      // continuation) -- parseSequence already dispatches all three correctly on its own.
      const { entry: noEntry, index: afterNo } = parseSequence(rawLines, afterBody, indent, continuation);
      decision.no = noEntry;
      return { entry: decision, index: afterNo };
    }

    if (ELSE_RE.test(line.trimmed)) {
      // No condition to show -- else's body just continues straight from its parent decision's "no".
      return parseSequence(rawLines, index + 1, bodyIndent, continuation);
    }

    const node: FlowNode = { id: makeId(), type: "process", line: line.lineNumber, text: line.trimmed };
    const { entry: restEntry, index: afterRest } = parseSequence(rawLines, index + 1, indent, continuation);
    node.next = restEntry;
    return { entry: node, index: afterRest };
  }

  const rawLines = preprocess(code);

  // A function's body doesn't execute linearly at its definition site -- it only runs when
  // called (recursively, in our seed tasks). Flowcharting the def + call site as one straight
  // line would misrepresent the control flow, so show the function's own internal logic only.
  if (rawLines[0] && DEF_RE.test(rawLines[0].trimmed)) {
    const bodyIndent = rawLines[1] ? rawLines[1].indent : rawLines[0].indent + 1;
    const { entry } = parseSequence(rawLines, 1, bodyIndent, end);
    return { start: { id: makeId(), type: "start", next: entry }, end };
  }

  const { entry } = parseSequence(rawLines, 0, 0, end);
  return { start: { id: makeId(), type: "start", next: entry }, end };
}
