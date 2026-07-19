interface Props {
  participantId: string;
  score: number;
  bestStreak: number;
  correctCount: number;
  totalCount: number;
  parsonsScore: number;
  parsonsCorrectCount: number;
  parsonsTotalCount: number;
}

export function DoneScreen({
  participantId,
  score,
  bestStreak,
  correctCount,
  totalCount,
  parsonsScore,
  parsonsCorrectCount,
  parsonsTotalCount,
}: Props) {
  return (
    <div className="screen">
      <h2>Thank you</h2>
      <p>Your responses have been recorded. You may now close this window.</p>

      <h4 className="admin-section-title">Code tracing</h4>
      <div className="score-summary">
        <div className="score-summary-item">
          <strong>{score}</strong>
          <span>Total score</span>
        </div>
        <div className="score-summary-item">
          <strong>{bestStreak}</strong>
          <span>Best streak</span>
        </div>
        <div className="score-summary-item">
          <strong>{correctCount}/{totalCount}</strong>
          <span>Checkpoints correct</span>
        </div>
      </div>

      <h4 className="admin-section-title" style={{ marginTop: 16 }}>Parsons problems</h4>
      <div className="score-summary">
        <div className="score-summary-item">
          <strong>{parsonsScore}</strong>
          <span>Total score</span>
        </div>
        <div className="score-summary-item">
          <strong>{parsonsCorrectCount}/{parsonsTotalCount}</strong>
          <span>Problems correct</span>
        </div>
      </div>

      <p className="scaffold-hint">Participant reference: {participantId}</p>
    </div>
  );
}
