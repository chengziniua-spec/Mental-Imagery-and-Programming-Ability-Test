import { useEffect, useMemo, useRef, useState } from "react";
import type { ConditionAssignment, TracingTask } from "../engine/types";
import { VariableStateTable } from "./scaffolds/VariableStateTable";
import { ExecutionTimeline } from "./scaffolds/ExecutionTimeline";
import { ControlFlowCues } from "./scaffolds/ControlFlowCues";
import { GlossaryPanel } from "./GlossaryPanel";
import { CodeBlock } from "./CodeBlock";
import { TASK_TYPE_ICON, DifficultyMeter, CheckCircle2, XCircle, Eye, EyeOff } from "./icons";
import { REASONING_TAGS, OTHER_TAG_ID } from "../data/reasoningTags";

export interface StepOutcome {
  correct: boolean | null;
  points: number;
}

export interface TaskFinishPayload {
  confidence: number;
  reasoningTags: string[];
  explanation: string;
  scaffoldOpenCount: number;
  scaffoldOpenMs: number;
}

interface Props {
  task: TracingTask;
  assignment: ConditionAssignment;
  onStartTrial: () => Promise<void>;
  onSubmitStep: (stepIndex: number, answer: Record<string, unknown>, rtMs: number) => Promise<StepOutcome>;
  onFinishTrial: (payload: TaskFinishPayload) => Promise<void>;
  onContinue: () => void;
}

function parseField(type: string, raw: string): unknown {
  if (type === "number") return Number(raw);
  if (type === "number_list") {
    return raw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => !Number.isNaN(n));
  }
  return raw;
}

const FEEDBACK_DELAY_MS = 900;

type Phase = "loading" | "answering" | "submitting" | "feedback" | "wrapup" | "wrapup-submitting";

export function CodeTracingTask({ task, assignment, onStartTrial, onSubmitStep, onFinishTrial, onContinue }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<StepOutcome | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [scaffoldOpen, setScaffoldOpen] = useState(false);
  const stepStartedAt = useRef(performance.now());
  const hasAdvancedRef = useRef(false);
  const scaffoldOpenCount = useRef(0);
  const scaffoldOpenMs = useRef(0);
  const scaffoldOpenedAt = useRef<number | null>(null);

  const step = task.steps[stepIndex];

  useEffect(() => {
    onStartTrial().then(() => {
      setPhase("answering");
      stepStartedAt.current = performance.now();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step) setValues(Object.fromEntries(step.fields.map((f) => [f.name, ""])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const handleAdvance = () => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    if (stepIndex + 1 < task.steps.length) {
      setStepIndex((i) => i + 1);
      stepStartedAt.current = performance.now();
      setFeedback(null);
      setPhase("answering");
    } else {
      setPhase("wrapup");
    }
  };

  useEffect(() => {
    if (phase !== "feedback") return;
    const timer = window.setTimeout(handleAdvance, FEEDBACK_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const allFilled = step ? step.fields.every((f) => values[f.name]?.trim()) : false;

  const scaffold = useMemo(() => {
    if (assignment.condition !== "scaffolded" || !step) return null;
    const allFieldNames = [...new Set(task.steps.flatMap((s) => s.fields.map((f) => f.name)))];
    const stepLabels = task.steps.map((s, i) => s.iteration_label ?? `${i + 1}`);
    switch (assignment.scaffold_type) {
      case "state_table":
        return <VariableStateTable variableNames={allFieldNames} stepLabels={stepLabels} currentStepIndex={stepIndex} />;
      case "execution_timeline":
        return <ExecutionTimeline code={task.code} currentLine={step.line} />;
      case "control_flow":
        return <ControlFlowCues code={task.code} currentLine={step.line} />;
      default:
        return null;
    }
  }, [assignment, task, step, stepIndex]);

  const handleSubmitStep = async () => {
    if (!step || !allFilled) return;
    const answer = Object.fromEntries(step.fields.map((f) => [f.name, parseField(f.type, values[f.name])]));
    const rtMs = Math.round(performance.now() - stepStartedAt.current);
    setPhase("submitting");
    const outcome = await onSubmitStep(stepIndex, answer, rtMs);
    if (outcome.correct) setCorrectCount((c) => c + 1);
    hasAdvancedRef.current = false;
    setFeedback(outcome);
    setPhase("feedback");
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]));
  };

  // The scaffold panel is opt-in (click to reveal) rather than always-on, both so it reads as a
  // deliberate tool instead of background wallpaper, and so "how much did they lean on it" becomes
  // a clean, countable signal instead of a noisy mouse-hover proxy -- open count + cumulative open
  // time across the whole task, flushed into the trial summary at handleFinish.
  // (Side effects live outside the setState call, not inside a functional updater -- React's Strict
  // Mode intentionally double-invokes updater functions in dev to catch exactly this kind of impurity.)
  const toggleScaffold = () => {
    if (scaffoldOpen) {
      if (scaffoldOpenedAt.current !== null) {
        scaffoldOpenMs.current += performance.now() - scaffoldOpenedAt.current;
        scaffoldOpenedAt.current = null;
      }
      setScaffoldOpen(false);
    } else {
      scaffoldOpenCount.current += 1;
      scaffoldOpenedAt.current = performance.now();
      setScaffoldOpen(true);
    }
  };

  const handleFinish = async () => {
    if (confidence === null) return;
    if (scaffoldOpenedAt.current !== null) {
      scaffoldOpenMs.current += performance.now() - scaffoldOpenedAt.current;
      scaffoldOpenedAt.current = null;
    }
    setPhase("wrapup-submitting");
    await onFinishTrial({
      confidence,
      reasoningTags: selectedTags,
      explanation,
      scaffoldOpenCount: scaffoldOpenCount.current,
      scaffoldOpenMs: Math.round(scaffoldOpenMs.current),
    });
    onContinue();
  };

  if (phase === "loading") {
    return (
      <div className="screen">
        <p className="loading-text">Loading task...</p>
      </div>
    );
  }

  const TaskIcon = TASK_TYPE_ICON[task.task_type];

  if (phase === "wrapup" || phase === "wrapup-submitting") {
    return (
      <div className="screen">
        <p className="eyebrow">
          {TaskIcon && <TaskIcon size={13} />} {task.title}
        </p>
        <h2>How did that go?</h2>
        <p className="scaffold-hint">
          You got {correctCount} of {task.steps.length} checkpoints right.
        </p>

        <div className="field">
          <span>How confident are you in your overall trace of this task?</span>
          <div className="likert-row">
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <button
                key={value}
                type="button"
                className={`likert-btn${confidence === value ? " likert-btn-selected" : ""}`}
                onClick={() => setConfidence(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>How did you work it out? (optional, pick any)</span>
          <div className="tag-row">
            {REASONING_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`tag-pill${selectedTags.includes(tag.id) ? " tag-pill-selected" : ""}`}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.label}
              </button>
            ))}
            <button
              type="button"
              className={`tag-pill${selectedTags.includes(OTHER_TAG_ID) ? " tag-pill-selected" : ""}`}
              onClick={() => toggleTag(OTHER_TAG_ID)}
            >
              Other
            </button>
          </div>
          {selectedTags.includes(OTHER_TAG_ID) && (
            <input
              type="text"
              placeholder="Say a bit more..."
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          )}
        </div>

        <button type="button" className="btn-primary" disabled={confidence === null || phase === "wrapup-submitting"} onClick={handleFinish}>
          {phase === "wrapup-submitting" ? "Saving..." : "Next task"}
        </button>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="screen">
      <p className="eyebrow">
        {TaskIcon && <TaskIcon size={13} />} {task.task_type} &middot; <DifficultyMeter difficulty={task.difficulty} />
      </p>
      <h2>{task.title}</h2>
      <p className="step-progress">
        Checkpoint {stepIndex + 1} of {task.steps.length}
        {step.iteration_label ? ` · ${step.iteration_label}` : ""}
      </p>

      {scaffold && (
        <button type="button" className="scaffold-toggle-btn" onClick={toggleScaffold}>
          {scaffoldOpen ? <EyeOff size={15} /> : <Eye size={15} />}
          {scaffoldOpen ? "Hide visual aid" : "Show visual aid"}
        </button>
      )}

      <div className={scaffold && scaffoldOpen ? "tracing-layout tracing-layout-split" : "tracing-layout"}>
        <div className="scaffold-panel code-panel">
          <h4 className="scaffold-title">Code</h4>
          <CodeBlock code={task.code} currentLine={step.line} />
        </div>
        {scaffold && scaffoldOpen && scaffold}
      </div>

      <GlossaryPanel entries={task.glossary} />

      {phase === "feedback" && feedback ? (
        <div
          className={`feedback-banner${feedback.correct ? " feedback-correct" : " feedback-incorrect"}`}
          onClick={handleAdvance}
          role="status"
        >
          {feedback.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{feedback.correct ? "Correct" : "Not quite"}</span>
          <span className="feedback-points">+{feedback.points} pts</span>
        </div>
      ) : (
        <>
          <p className="tracing-prompt">{step.prompt}</p>

          <div className="answer-fields">
            {step.fields.map((field) => (
              <label key={field.name} className="field">
                <span>{field.name}</span>
                {field.type === "choice" ? (
                  <select
                    value={values[field.name] ?? ""}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  >
                    <option value="" disabled>
                      select...
                    </option>
                    {step.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={field.type === "number_list" ? "e.g. 1, 2, 4" : "value"}
                    value={values[field.name] ?? ""}
                    onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>

          <button type="button" className="btn-primary" disabled={!allFilled || phase === "submitting"} onClick={handleSubmitStep}>
            {phase === "submitting" ? "Checking..." : "Submit"}
          </button>
        </>
      )}
    </div>
  );
}
