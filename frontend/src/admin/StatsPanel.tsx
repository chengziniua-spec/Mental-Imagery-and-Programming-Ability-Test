import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "./adminApi";
import { BarChart } from "./BarChart";

const CONDITION_LABELS: Record<string, string> = {
  code_only: "Code only",
  scaffolded: "Scaffolded",
};

const SCAFFOLD_LABELS: Record<string, string> = {
  state_table: "Variable-state table",
  execution_timeline: "Execution timeline",
  control_flow: "Control-flow cues",
};

const DIMENSION_LABELS: Record<string, string> = {
  visual_vividness: "Visual vividness",
  imagery_control: "Imagery control",
  imagery_stability: "Imagery stability",
  spatial_flow: "Spatial / flow",
};

function pct(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function StatsPanel({ includeTest }: { includeTest: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats(includeTest)
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load stats."));
  }, [includeTest]);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <p className="admin-empty">Loading...</p>;

  const conditionItems = Object.entries(stats.by_condition).map(([key, s], index) => ({
    label: CONDITION_LABELS[key] ?? key,
    value: s.accuracy,
    displayValue: `${pct(s.accuracy)} (${s.step_n} checkpoints)`,
    colorVar: `--series-${index + 1}`,
  }));

  const scaffoldItems = Object.entries(stats.by_scaffold_type).map(([key, s], index) => ({
    label: SCAFFOLD_LABELS[key] ?? key,
    value: s.accuracy,
    displayValue: `${pct(s.accuracy)} (${s.step_n} checkpoints)`,
    colorVar: `--series-${index + 1}`,
  }));

  const imageryItems = Object.entries(stats.imagery_dimension_avgs).map(([key, value], index) => ({
    label: DIMENSION_LABELS[key] ?? key,
    value,
    displayValue: value.toFixed(1),
    colorVar: `--series-${index + 1}`,
  }));

  const objectiveTaskItems = [
    {
      label: "Mental rotation",
      value: stats.mental_rotation.accuracy,
      displayValue: `${pct(stats.mental_rotation.accuracy)} (n=${stats.mental_rotation.n}, ${
        stats.mental_rotation.avg_rt_ms ? Math.round(stats.mental_rotation.avg_rt_ms) : "–"
      }ms avg)`,
      colorVar: "--series-1",
    },
    {
      label: "Picture recognition",
      value: stats.picture_memory.accuracy,
      displayValue: `${pct(stats.picture_memory.accuracy)} (n=${stats.picture_memory.n}, ${
        stats.picture_memory.avg_rt_ms ? Math.round(stats.picture_memory.avg_rt_ms) : "–"
      }ms avg)`,
      colorVar: "--series-2",
    },
  ];

  const maxScaffoldOpens = Math.max(1, ...Object.values(stats.by_scaffold_type).map((s) => s.avg_scaffold_open_count ?? 0));
  const scaffoldUsageItems = Object.entries(stats.by_scaffold_type).map(([key, s], index) => ({
    label: SCAFFOLD_LABELS[key] ?? key,
    value: s.avg_scaffold_open_count,
    displayValue:
      s.avg_scaffold_open_count === null
        ? "–"
        : `${s.avg_scaffold_open_count.toFixed(1)} opens/task (avg ${Math.round((s.avg_scaffold_open_ms ?? 0) / 1000)}s open)`,
    colorVar: `--series-${index + 1}`,
  }));

  const correlationItems = Object.entries(stats.scaffold_usage_correlation).map(([key, r], index) => ({
    label: DIMENSION_LABELS[key] ?? key,
    value: Math.abs(r),
    displayValue: `r = ${r >= 0 ? "+" : ""}${r.toFixed(2)}`,
    colorVar: `--series-${index + 1}`,
  }));

  const parsonsItems = [
    {
      label: "Parsons problems",
      value: stats.parsons.accuracy,
      displayValue: `${pct(stats.parsons.accuracy)} (n=${stats.parsons.n}, ${
        stats.parsons.avg_rt_ms ? Math.round(stats.parsons.avg_rt_ms / 1000) : "–"
      }s avg)`,
      colorVar: "--series-3",
    },
  ];

  return (
    <>
      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="stat-tile-label">Participants</div>
          <div className="stat-tile-value">{stats.total_participants}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Tasks completed</div>
          <div className="stat-tile-value">{stats.total_trials}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Checkpoints answered</div>
          <div className="stat-tile-value">{stats.total_steps}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Overall accuracy</div>
          <div className="stat-tile-value">{pct(stats.overall_accuracy)}</div>
        </div>
      </div>

      <div className="admin-panel">
        <BarChart title="Accuracy by condition" items={conditionItems} maxValue={1} />
      </div>
      <div className="admin-panel">
        <BarChart title="Accuracy by scaffold type" items={scaffoldItems} maxValue={1} />
      </div>
      <div className="admin-panel">
        <BarChart title="Visual-aid opens per task (scaffolded conditions)" items={scaffoldUsageItems} maxValue={maxScaffoldOpens} />
      </div>
      <div className="admin-panel">
        <BarChart
          title="Visual-aid usage ↔ imagery ability (Pearson r, dashboard sanity check only)"
          items={correlationItems}
          maxValue={1}
        />
      </div>
      <div className="admin-panel">
        <BarChart title="Imagery dimension averages (1-7 scale)" items={imageryItems} maxValue={7} />
      </div>
      <div className="admin-panel">
        <BarChart title="Objective imagery task accuracy" items={objectiveTaskItems} maxValue={1} />
      </div>
      <div className="admin-panel">
        <BarChart title="Parsons problem accuracy (logic construction, separate construct)" items={parsonsItems} maxValue={1} />
      </div>
    </>
  );
}
