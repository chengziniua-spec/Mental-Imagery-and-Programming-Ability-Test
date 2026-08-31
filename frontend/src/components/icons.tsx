import { Repeat, GitBranch, SquareFunction, Package, Variable, CheckCircle2, XCircle, Flame, Target, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const TASK_TYPE_ICON: Record<string, LucideIcon> = {
  variable: Variable,
  loop: Repeat,
  conditional: GitBranch,
  function: SquareFunction,
  state: Package,
};

export { CheckCircle2, XCircle, Flame, Target, Eye, EyeOff };

const DIFFICULTY_LEVEL: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

export function DifficultyMeter({ difficulty }: { difficulty: string }) {
  const level = DIFFICULTY_LEVEL[difficulty] ?? 1;
  return (
    <span className="difficulty-meter" aria-label={`Difficulty: ${difficulty}`} title={difficulty}>
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={`difficulty-bar${bar <= level ? " difficulty-bar-filled" : ""}`} style={{ height: 4 + bar * 3 }} />
      ))}
    </span>
  );
}
