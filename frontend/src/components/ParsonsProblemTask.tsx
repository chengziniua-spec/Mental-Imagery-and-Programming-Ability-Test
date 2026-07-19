import { useEffect, useRef, useState } from "react";
import type { ParsonsProblem } from "../engine/types";
import { DifficultyMeter, CheckCircle2, XCircle } from "./icons";

export interface ParsonsOutcome {
  correct: boolean | null;
  points: number;
}

interface Props {
  problem: ParsonsProblem;
  onSubmitTrial: (submittedOrder: string[], rtMs: number) => Promise<ParsonsOutcome>;
  onContinue: () => void;
}

const FEEDBACK_DELAY_MS = 1200;

type Phase = "building" | "submitting" | "feedback";

export function ParsonsProblemTask({ problem, onSubmitTrial, onContinue }: Props) {
  const [bank, setBank] = useState(problem.blocks);
  const [solution, setSolution] = useState<typeof problem.blocks>([]);
  const [phase, setPhase] = useState<Phase>("building");
  const [outcome, setOutcome] = useState<ParsonsOutcome | null>(null);
  const startedAt = useRef(performance.now());
  const hasAdvancedRef = useRef(false);

  const moveToSolution = (blockId: string) => {
    if (phase !== "building") return;
    const block = bank.find((b) => b.id === blockId);
    if (!block) return;
    setBank((prev) => prev.filter((b) => b.id !== blockId));
    setSolution((prev) => [...prev, block]);
  };

  const moveToBank = (blockId: string) => {
    if (phase !== "building") return;
    const block = solution.find((b) => b.id === blockId);
    if (!block) return;
    setSolution((prev) => prev.filter((b) => b.id !== blockId));
    setBank((prev) => [...prev, block]);
  };

  const moveSolutionItem = (index: number, direction: -1 | 1) => {
    if (phase !== "building") return;
    setSolution((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (solution.length === 0) return;
    const rtMs = Math.round(performance.now() - startedAt.current);
    setPhase("submitting");
    const result = await onSubmitTrial(
      solution.map((b) => b.id),
      rtMs,
    );
    setOutcome(result);
    hasAdvancedRef.current = false;
    setPhase("feedback");
  };

  const handleAdvance = () => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    onContinue();
  };

  useEffect(() => {
    if (phase !== "feedback") return;
    const timer = window.setTimeout(handleAdvance, FEEDBACK_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "feedback" && outcome) {
    return (
      <div className="screen">
        <div
          className={`feedback-banner${outcome.correct ? " feedback-correct" : " feedback-incorrect"}`}
          onClick={handleAdvance}
          role="status"
        >
          {outcome.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{outcome.correct ? "Correct" : "Not quite"}</span>
          <span className="feedback-points">+{outcome.points} pts</span>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <p className="eyebrow">
        Parsons problem &middot; <DifficultyMeter difficulty={problem.difficulty} />
      </p>
      <h2>{problem.title}</h2>
      <p className="tracing-prompt">{problem.requirement}</p>
      <p className="scaffold-hint">
        Click blocks to add them to your solution in order. Not every block is needed -- some are
        distractors.
      </p>

      <div className="parsons-columns">
        <div className="scaffold-panel">
          <h4 className="scaffold-title">Available blocks</h4>
          <div className="parsons-bank">
            {bank.map((block) => (
              <button key={block.id} type="button" className="parsons-block" onClick={() => moveToSolution(block.id)}>
                <code>{block.code}</code>
              </button>
            ))}
            {bank.length === 0 && <p className="admin-empty">All blocks placed.</p>}
          </div>
        </div>

        <div className="scaffold-panel code-panel">
          <h4 className="scaffold-title" style={{ color: "#e8eef0" }}>Your solution</h4>
          <div className="parsons-solution">
            {solution.length === 0 && <p className="scaffold-hint" style={{ color: "#9fb2bd" }}>Click blocks on the left to build your answer here.</p>}
            {solution.map((block, index) => (
              <div key={block.id} className="parsons-solution-row">
                <div className="parsons-reorder">
                  <button type="button" onClick={() => moveSolutionItem(index, -1)} disabled={index === 0} aria-label="Move up">
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSolutionItem(index, 1)}
                    disabled={index === solution.length - 1}
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <code className="parsons-solution-code">{block.code}</code>
                <button type="button" className="parsons-remove" onClick={() => moveToBank(block.id)} aria-label="Remove">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        disabled={solution.length === 0 || phase === "submitting"}
        onClick={handleSubmit}
      >
        {phase === "submitting" ? "Checking..." : "Submit solution"}
      </button>
    </div>
  );
}
