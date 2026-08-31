import { useRef, useState } from "react";
import "./scaffolds.css";

interface Props {
  variableNames: string[];
  stepLabels: string[];
  currentStepIndex: number;
}

interface ExtraRow {
  id: number;
  label: string;
  values: Record<string, string>;
}

function blankValues(variableNames: string[]): Record<string, string> {
  return Object.fromEntries(variableNames.map((name) => [name, ""]));
}

export function VariableStateTable({ variableNames, stepLabels, currentStepIndex }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>(() => stepLabels.map(() => blankValues(variableNames)));
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([]);
  const nextExtraId = useRef(1);

  const updateCell = (rowIndex: number, name: string, value: string) => {
    setRows((prev) => prev.map((row, index) => (index === rowIndex ? { ...row, [name]: value } : row)));
  };

  const addExtraRow = () => {
    const id = nextExtraId.current++;
    setExtraRows((prev) => [...prev, { id, label: "", values: blankValues(variableNames) }]);
  };

  const removeExtraRow = (id: number) => {
    setExtraRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateExtraLabel = (id: number, label: string) => {
    setExtraRows((prev) => prev.map((row) => (row.id === id ? { ...row, label } : row)));
  };

  const updateExtraCell = (id: number, name: string, value: string) => {
    setExtraRows((prev) => prev.map((row) => (row.id === id ? { ...row, values: { ...row.values, [name]: value } } : row)));
  };

  return (
    <div className="scaffold-panel">
      <h4 className="scaffold-title">Variable-state table</h4>
      <p className="scaffold-hint">
        Scratch space only -- jot down how each variable changes as you trace. One row per checkpoint;
        the highlighted row matches where you are now. Add extra rows for your own working (e.g. tracking
        recursive calls). Not submitted.
      </p>
      <table className="vst-table">
        <thead>
          <tr>
            <th>Step</th>
            {variableNames.map((name) => (
              <th key={name}>{name}</th>
            ))}
            <th aria-hidden="true" />
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
              <td />
            </tr>
          ))}
          {extraRows.map((row) => (
            <tr key={`extra-${row.id}`} className="vst-row-extra">
              <td className="vst-step">
                <input
                  type="text"
                  className="vst-step-input"
                  placeholder="label"
                  value={row.label}
                  onChange={(event) => updateExtraLabel(row.id, event.target.value)}
                  aria-label="Row label"
                />
              </td>
              {variableNames.map((name) => (
                <td key={name}>
                  <input
                    type="text"
                    value={row.values[name]}
                    onChange={(event) => updateExtraCell(row.id, name, event.target.value)}
                    aria-label={`${name} at ${row.label || "extra row"}`}
                  />
                </td>
              ))}
              <td>
                <button
                  type="button"
                  className="vst-remove-row-btn"
                  onClick={() => removeExtraRow(row.id)}
                  aria-label="Remove row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="vst-add-row-btn" onClick={addExtraRow}>
        + Add row
      </button>
    </div>
  );
}
