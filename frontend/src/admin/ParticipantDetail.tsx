import { Fragment, useEffect, useState } from "react";
import { fetchParticipantDetail, type ParticipantDetail as ParticipantDetailData } from "./adminApi";
import { CheckCircle2, XCircle } from "../components/icons";

interface Props {
  participantId: string;
  onBack: () => void;
}

function CorrectMark({ correct }: { correct: boolean | null }) {
  if (correct === null) return <span>–</span>;
  return correct ? <CheckCircle2 size={16} color="#0ca30c" /> : <XCircle size={16} color="#d03b3b" />;
}

export function ParticipantDetail({ participantId, onBack }: Props) {
  const [detail, setDetail] = useState<ParticipantDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrialId, setExpandedTrialId] = useState<number | null>(null);

  useEffect(() => {
    setDetail(null);
    fetchParticipantDetail(participantId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load participant."));
  }, [participantId]);

  return (
    <div className="admin-panel">
      <span className="admin-back-link" onClick={onBack}>&larr; Back to participants</span>

      {error && <p className="error-text">{error}</p>}
      {!detail ? (
        <p className="admin-empty">Loading...</p>
      ) : (
        <>
          <div className="admin-kv">
            <div>
              <span className="kv-label">Participant ID</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className="kv-label">Created</span>
              <span>{new Date(detail.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="kv-label">Experience</span>
              <span>
                {detail.programming_experience ?? "–"} ({detail.years_experience ?? "–"} yrs)
              </span>
            </div>
            <div>
              <span className="kv-label">Consent</span>
              <span>{detail.consent ? "Yes" : "No"}</span>
            </div>
          </div>

          <h4 className="admin-section-title">Imagery responses ({detail.imagery_responses.length})</h4>
          {detail.imagery_responses.length === 0 ? (
            <p className="admin-empty">None recorded.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Item</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {detail.imagery_responses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.dimension}</td>
                    <td>{r.item_id}</td>
                    <td>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 className="admin-section-title" style={{ marginTop: 20 }}>
            Tracing tasks ({detail.trials.length})
          </h4>
          {detail.trials.length === 0 ? (
            <p className="admin-empty">None recorded.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Condition</th>
                  <th>Checkpoints</th>
                  <th>All correct</th>
                  <th>Time</th>
                  <th>Confidence</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detail.trials.map((t) => (
                  <Fragment key={t.id}>
                    <tr>
                      <td>{t.task_title}</td>
                      <td>{t.condition === "scaffolded" ? `scaffolded (${t.scaffold_type})` : "code_only"}</td>
                      <td>{t.correct_step_count}/{t.step_count}</td>
                      <td><CorrectMark correct={t.correct} /></td>
                      <td>{t.completion_time_ms ? `${(t.completion_time_ms / 1000).toFixed(1)}s` : "–"}</td>
                      <td>{t.confidence ?? "–"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setExpandedTrialId(expandedTrialId === t.id ? null : t.id)}
                        >
                          {expandedTrialId === t.id ? "Hide" : "Steps"}
                        </button>
                      </td>
                    </tr>
                    {expandedTrialId === t.id && (
                      <tr key={`${t.id}-steps`}>
                        <td colSpan={7} style={{ background: "var(--page, #f9f9f7)" }}>
                          {t.reasoning_tags && t.reasoning_tags.length > 0 && (
                            <p style={{ fontSize: 12, margin: "4px 0 4px" }}>
                              <strong>Reasoning:</strong> {t.reasoning_tags.join(", ")}
                            </p>
                          )}
                          {t.explanation && (
                            <p style={{ fontSize: 12, margin: "0 0 10px" }}>
                              <strong>Other:</strong> {t.explanation}
                            </p>
                          )}
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Step</th>
                                <th>Line</th>
                                <th>Iteration</th>
                                <th>Answer</th>
                                <th>Correct</th>
                                <th>Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.step_answers.map((s) => (
                                <tr key={s.id}>
                                  <td>{s.step_index + 1}</td>
                                  <td>{s.line}</td>
                                  <td>{s.iteration_label ?? "–"}</td>
                                  <td>{JSON.stringify(s.answer)}</td>
                                  <td><CorrectMark correct={s.correct} /></td>
                                  <td>{s.completion_time_ms ? `${(s.completion_time_ms / 1000).toFixed(1)}s` : "–"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}

          <h4 className="admin-section-title" style={{ marginTop: 20 }}>
            Parsons problems ({detail.parsons_trials.length})
          </h4>
          {detail.parsons_trials.length === 0 ? (
            <p className="admin-empty">None recorded.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Correct</th>
                  <th>Time</th>
                  <th>Submitted order</th>
                </tr>
              </thead>
              <tbody>
                {detail.parsons_trials.map((pt) => (
                  <tr key={pt.id}>
                    <td>{pt.problem_title}</td>
                    <td><CorrectMark correct={pt.correct} /></td>
                    <td>{pt.completion_time_ms ? `${(pt.completion_time_ms / 1000).toFixed(1)}s` : "–"}</td>
                    <td>{pt.submitted_order.join(" → ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
