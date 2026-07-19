import { useState } from "react";
import "./scaffolds.css";

interface Props {
  variableNames: string[];
  stepLabels: string[];
  currentStepIndex: number;
}

export function VariableStateTable({ variableNames, stepLabels, currentStepIndex }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>(
    () => stepLabels.map(() => Object.fromEntries(variableNames.map((name) => [name, ""]))),
  );

  const updateCell = (rowIndex: number, name: string, value: string) => {
    setRows((prev) => prev.map((row, index) => (index === rowIndex ? { ...row, [name]: value } : row)));
  };

  return (
    <div className="scaffold-panel">
      <h4 className="scaffold-title">Variable-state table</h4>
      <p className="scaffold-hint">
        Scratch space only -- jot down how each variable changes as you trace. One row per checkpoint;
        the highlighted row matches where you are now. Not submitted.
      </p>
      <table className="vst-table">
        <thead>
          <tr>
            <th>Step</th>
            {variableNames.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex === currentStepIndex ? "vst-row-current" : undefined}>
              <td className="vst-step">{stepLabels[rowIndex]}</td>
              {variableNames.map((name) => (
                <td key={name}>
                  <input
                    type="text"
                    value={row[name]}
                    onChange={(event) => updateCell(rowIndex, name, event.target.value)}
                    aria-label={`${name} at step ${stepLabels[rowIndex]}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
