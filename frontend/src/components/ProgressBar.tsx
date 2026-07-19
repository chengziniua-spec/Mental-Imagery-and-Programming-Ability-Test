interface Props {
  progress: number;
  label: string;
}

export function ProgressBar({ progress, label }: Props) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">{label}</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </div>
  );
}
