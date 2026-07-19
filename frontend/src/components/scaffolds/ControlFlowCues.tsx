import { useMemo } from "react";
import { parseCodeStructure } from "./codeStructure";
import { colorForBlock, labelForBlock } from "./blockColors";
import "./scaffolds.css";

interface Props {
  code: string;
  currentLine?: number;
}

export function ControlFlowCues({ code, currentLine }: Props) {
  const { lines } = useMemo(() => parseCodeStructure(code), [code]);

  const currentBlockId = useMemo(() => {
    const line = lines.find((l) => l.lineNumber === currentLine);
    return line ? line.blockId : null;
  }, [lines, currentLine]);

  return (
    <div className="scaffold-panel">
      <h4 className="scaffold-title">Control-flow cues</h4>
      <p className="scaffold-hint">Colored bars mark loop, branch and function bodies. The block your checkpoint is in stays bright; the rest fades.</p>
      <div className="cfc-code">
        {lines.map((line) => {
          const isDimmed = currentBlockId !== null && line.blockType !== "root" && line.blockId !== currentBlockId;
          return (
            <div key={line.lineNumber} className={`cfc-line${isDimmed ? " cfc-line-dimmed" : ""}`}>
              <span
                className="cfc-bar"
                style={{ background: colorForBlock(line.blockType, line.blockId) }}
                title={line.blockType === "root" ? "Root" : `${labelForBlock(line.blockType)} #${line.blockId}`}
              />
              <span className="cfc-lineno">{line.lineNumber}</span>
              <code className="cfc-text">{line.text || " "}</code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
