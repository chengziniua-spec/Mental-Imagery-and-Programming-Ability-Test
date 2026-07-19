export type BlockType = "root" | "loop" | "conditional" | "function";

export interface CodeLine {
  lineNumber: number;
  text: string;
  indent: number;
  blockType: BlockType;
  blockId: number;
}

export interface CodeBlock {
  id: number;
  type: BlockType;
  indent: number;
  depth: number;
  headerLine: number;
  headerText: string;
  parentId: number;
}

interface StackFrame {
  indent: number;
  type: BlockType;
  id: number;
}

const LOOP_RE = /^(for|while)\b.*:$/;
const COND_RE = /^(if|elif|else)\b.*:?$/;
const FUNC_RE = /^def\b.*:$/;

/**
 * Structural-only parser: infers loop/conditional/function nesting from
 * indentation so scaffolds can visualize control flow without ever
 * executing the code or revealing runtime values (which would give the
 * tracing answer away).
 */
export function parseCodeStructure(code: string): { lines: CodeLine[]; blocks: CodeBlock[] } {
  const rawLines = code.replace(/\n$/, "").split("\n");
  const stack: StackFrame[] = [];
  const blocks: CodeBlock[] = [];
  let nextId = 1;

  const lines: CodeLine[] = rawLines.map((rawLine, index) => {
    const indent = rawLine.length - rawLine.trimStart().length;
    const trimmed = rawLine.trim();

    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    const line: CodeLine = {
      lineNumber: index + 1,
      text: rawLine,
      indent,
      blockType: parent?.type ?? "root",
      blockId: parent?.id ?? 0,
    };

    let type: BlockType | null = null;
    if (LOOP_RE.test(trimmed)) type = "loop";
    else if (FUNC_RE.test(trimmed)) type = "function";
    else if (COND_RE.test(trimmed)) type = "conditional";

    if (type) {
      const id = nextId++;
      blocks.push({
        id,
        type,
        indent,
        depth: stack.length,
        headerLine: line.lineNumber,
        headerText: trimmed,
        parentId: parent?.id ?? 0,
      });
      stack.push({ indent, type, id });
    }

    return line;
  });

  return { lines, blocks };
}
