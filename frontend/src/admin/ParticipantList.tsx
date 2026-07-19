import { useEffect, useState } from "react";
import { deleteParticipant, downloadExport, fetchParticipants, setTestFlag, type ParticipantSummary } from "./adminApi";

interface Props {
  includeTest: boolean;
  onIncludeTestChange: (value: boolean) => void;
  onSelect: (id: string) => void;
}

function formatMs(ms: number | null): string {
  if (ms === null) return "–";
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPct(value: number | null): string {
  if (value === null) return "–";
  return `${Math.round(value * 100)}%`;
}

export function ParticipantList({ includeTest, onIncludeTestChange, onSelect }: Props) {
  const [participants, setParticipants] = useState<ParticipantSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    fetchParticipants(includeTest)
      .then(setParticipants)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load participants."));
  };

  useEffect(reload, [includeTest]);

  const handleToggleTest = async (p: ParticipantSummary) => {
    await setTestFlag(p.id, !p.is_test);
    reload();
  };

  const handleDelete = async (p: ParticipantSummary) => {
    if (!window.confirm(`Permanently delete participant ${p.id.slice(0, 8)}... and all their data?`)) return;
    await deleteParticipant(p.id);
    reload();
  };

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <label>
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => onIncludeTestChange(e.target.checked)}
          />{" "}
          Include test-marked participants
        </label>
        <button type="button" onClick={() => downloadExport("dataset.csv", includeTest, "code_tracing_dataset.csv")}>
          Export tracing CSV
        </button>
        <button type="button" onClick={() => downloadExport("dataset.json", includeTest, "code_tracing_dataset.json")}>
          Export tracing JSON
        </button>
        <button type="button" onClick={() => downloadExport("imagery-profiles.json", includeTest, "imagery_profiles.json")}>
          Export imagery JSON
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!participants ? (
        <p className="admin-empty">Loading...</p>
      ) : participants.length === 0 ? (
        <p className="admin-empty">No participants yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Experience</th>
              <th>Tasks</th>
              <th>Checkpoints</th>
              <th>Accuracy</th>
              <th>Avg confidence</th>
              <th>Avg time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>
                  {p.programming_experience ?? "–"}
                  {p.is_test && <span className="admin-badge admin-badge-test" style={{ marginLeft: 6 }}>test</span>}
                </td>
                <td>{p.trial_count}</td>
                <td>{p.correct_step_count}/{p.step_count}</td>
                <td>{formatPct(p.accuracy)}</td>
                <td>{p.avg_confidence ? p.avg_confidence.toFixed(1) : "–"}</td>
                <td>{formatMs(p.avg_completion_time_ms)}</td>
                <td>
                  <button type="button" onClick={() => onSelect(p.id)}>View</button>
                  <button type="button" onClick={() => handleToggleTest(p)}>
                    {p.is_test ? "Unmark test" : "Mark test"}
                  </button>
                  <button type="button" onClick={() => handleDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
