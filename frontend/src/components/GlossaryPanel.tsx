import "./scaffolds/scaffolds.css";

interface Props {
  entries: { term: string; explanation: string }[];
}

export function GlossaryPanel({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="scaffold-panel glossary-panel">
      <h4 className="scaffold-title">Built-in reference</h4>
      <p className="scaffold-hint">Shown the same way regardless of condition -- just explains the syntax, not the answer.</p>
      <dl className="glossary-list">
        {entries.map((entry) => (
          <div key={entry.term} className="glossary-entry">
            <dt><code>{entry.term}</code></dt>
            <dd>{entry.explanation}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
