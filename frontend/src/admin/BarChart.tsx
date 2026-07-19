export interface BarItem {
  label: string;
  value: number | null;
  displayValue: string;
  colorVar: string;
}

interface Props {
  title: string;
  items: BarItem[];
  maxValue: number;
}

export function BarChart({ title, items, maxValue }: Props) {
  const hasAnyData = items.some((item) => item.value !== null);

  return (
    <div>
      <h4 className="admin-section-title">{title}</h4>
      {!hasAnyData ? (
        <p className="admin-empty">No data yet.</p>
      ) : (
        <div className="bar-chart">
          {items.map((item) => {
            const hasData = item.value !== null;
            const pct = hasData ? Math.max(0, Math.min(100, (item.value as number / maxValue) * 100)) : 0;
            return (
              <div className="bar-row" key={item.label}>
                <span className="bar-row-label">
                  <span className="bar-row-swatch" style={{ background: `var(${item.colorVar})` }} />
                  {item.label}
                </span>
                {hasData ? (
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${pct}%`, background: `var(${item.colorVar})` }} />
                  </span>
                ) : (
                  <span className="bar-track bar-track-empty">no data</span>
                )}
                <span className="bar-row-value">{hasData ? item.displayValue : "–"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
