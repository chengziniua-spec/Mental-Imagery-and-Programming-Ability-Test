import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { ConsentScreen } from "./components/ConsentScreen";
import { ImageryQuestionnaireItem } from "./components/ImageryQuestionnaireItem";
import { MentalRotationTask } from "./components/MentalRotationTask";
import { PictureMemoryStudy } from "./components/PictureMemoryStudy";
import { PictureMemoryTest } from "./components/PictureMemoryTest";
import { CodeTracingTask, type StepOutcome, type TaskFinishPayload } from "./components/CodeTracingTask";
import { ParsonsProblemTask, type ParsonsOutcome } from "./components/ParsonsProblemTask";
import { ProgressBar } from "./components/ProgressBar";
import { ScoreHud } from "./components/ScoreHud";
import { DoneScreen } from "./components/DoneScreen";
import { useTaskEngine } from "./engine/useTaskEngine";
import { IMAGERY_ITEMS } from "./data/imageryQuestionnaire";
import {
  createParticipant,
  fetchTasks,
  submitImageryResponses,
  startTrial,
  submitStep,
  finishTrial,
  fetchMentalRotationItems,
  fetchPictureMemorySet,
  submitImageryTaskTrial,
  fetchParsonsProblems,
  submitParsonsTrial,
} from "./api/client";
import type { Participant, TimelineStep, MentalRotationItem, PictureMemorySet, ParsonsProblem } from "./engine/types";

const POINTS_BASE = 10;
const POINTS_STREAK_BONUS = 2;
const MAX_STREAK_BONUS = 5;

interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  totalCount: number;
}

const INITIAL_SCORE: ScoreState = { score: 0, streak: 0, bestStreak: 0, correctCount: 0, totalCount: 0 };

type Phase =
  | "consent"
  | "loading"
  | "imagery"
  | "picture-study"
  | "mental-rotation"
  | "picture-test"
  | "tracing"
  | "parsons"
  | "done"
  | "error";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const imageryTimeline: TimelineStep[] = IMAGERY_ITEMS.map((item) => ({
  kind: "imagery",
  imageryItem: item,
}));

function ImageryPhase({ onComplete }: { onComplete: (responses: { dimension: string; item_id: string; value: number }[]) => void }) {
  const engine = useTaskEngine(imageryTimeline);
  const step = engine.currentStep;

  useEffect(() => {
    if (!engine.isDone) return;
    onComplete(
      engine.allRecords.map((record) => ({
        dimension: record.step.imageryItem!.dimension,
        item_id: record.step.imageryItem!.id,
        value: record.response as number,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isDone]);

  if (engine.isDone) {
    return <p className="loading-text">Saving imagery responses...</p>;
  }

  if (!step?.imageryItem) return null;

  return (
    <>
      <ProgressBar progress={engine.progress} label={`Imagery questionnaire - ${engine.currentIndex + 1} of ${engine.total}`} />
      <ImageryQuestionnaireItem item={step.imageryItem} onAnswer={(value) => engine.submit(value)} />
    </>
  );
}

function TracingPhase({
  timeline,
  onStartTrial,
  onSubmitStep,
  onFinishTrial,
  onComplete,
}: {
  timeline: TimelineStep[];
  onStartTrial: (step: TimelineStep) => Promise<void>;
  onSubmitStep: (
    step: TimelineStep,
    stepIndex: number,
    answer: Record<string, unknown>,
    rtMs: number,
  ) => Promise<{ correct: boolean | null }>;
  onFinishTrial: (step: TimelineStep, payload: TaskFinishPayload) => Promise<void>;
  onComplete: (result: ScoreState) => void;
}) {
  const engine = useTaskEngine(timeline);
  const [scoreState, setScoreState] = useState<ScoreState>(INITIAL_SCORE);
  const step = engine.currentStep;

  useEffect(() => {
    if (engine.isDone) onComplete(scoreState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isDone]);

  if (engine.isDone) {
    return <p className="loading-text">Finishing up...</p>;
  }

  if (!step?.tracingTask || !step.assignment) return null;

  const handleSubmitStep = async (stepIndex: number, answer: Record<string, unknown>, rtMs: number): Promise<StepOutcome> => {
    const result = await onSubmitStep(step, stepIndex, answer, rtMs);
    const correct = result.correct === true;
    const points = correct ? POINTS_BASE + Math.min(scoreState.streak, MAX_STREAK_BONUS) * POINTS_STREAK_BONUS : 0;
    setScoreState((prev) => {
      const nextStreak = correct ? prev.streak + 1 : 0;
      return {
        score: prev.score + points,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        correctCount: prev.correctCount + (correct ? 1 : 0),
        totalCount: prev.totalCount + 1,
      };
    });
    return { correct: result.correct, points };
  };

  return (
    <>
      <ScoreHud score={scoreState.score} streak={scoreState.streak} />
      <ProgressBar progress={engine.progress} label={`Task ${engine.currentIndex + 1} of ${engine.total}`} />
      <CodeTracingTask
        key={step.tracingTask.id}
        task={step.tracingTask}
        assignment={step.assignment}
        onStartTrial={() => onStartTrial(step)}
        onSubmitStep={handleSubmitStep}
        onFinishTrial={(payload) => onFinishTrial(step, payload)}
        onContinue={() => engine.submit(null)}
      />
    </>
  );
}

function ParsonsPhase({
  problems,
  onSubmitTrial,
  onComplete,
}: {
  problems: ParsonsProblem[];
  onSubmitTrial: (problem: ParsonsProblem, submittedOrder: string[], rtMs: number) => Promise<{ correct: boolean | null }>;
  onComplete: (result: ScoreState) => void;
}) {
  const [index, setIndex] = useState(0);
  const [scoreState, setScoreState] = useState<ScoreState>(INITIAL_SCORE);
  const problem = problems[index];

  useEffect(() => {
    if (index >= problems.length) onComplete(scoreState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!problem) {
    return <p className="loading-text">Finishing up...</p>;
  }

  const handleSubmitTrial = async (submittedOrder: string[], rtMs: number): Promise<ParsonsOutcome> => {
    const result = await onSubmitTrial(problem, submittedOrder, rtMs);
    const correct = result.correct === true;
    const points = correct ? POINTS_BASE + Math.min(scoreState.streak, MAX_STREAK_BONUS) * POINTS_STREAK_BONUS : 0;
    setScoreState((prev) => {
      const nextStreak = correct ? prev.streak + 1 : 0;
      return {
        score: prev.score + points,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        correctCount: prev.correctCount + (correct ? 1 : 0),
        totalCount: prev.totalCount + 1,
      };
    });
    return { correct: result.correct, points };
  };

  return (
    <>
      <ScoreHud score={scoreState.score} streak={scoreState.streak} />
      <ProgressBar progress={index / problems.length} label={`Parsons problem ${index + 1} of ${problems.length}`} />
      <ParsonsProblemTask
        key={problem.id}
        problem={problem}
        onSubmitTrial={handleSubmitTrial}
        onContinue={() => setIndex((i) => i + 1)}
      />
    </>
  );
}

function App() {
  const [phase, setPhase] = useState<Phase>("consent");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [tracingTimeline, setTracingTimeline] = useState<TimelineStep[]>([]);
  const [rotationItems, setRotationItems] = useState<MentalRotationItem[]>([]);
  const [pictureMemorySet, setPictureMemorySet] = useState<PictureMemorySet | null>(null);
  const [parsonsProblems, setParsonsProblems] = useState<ParsonsProblem[]>([]);
  const [finalScore, setFinalScore] = useState<ScoreState>(INITIAL_SCORE);
  const [parsonsScore, setParsonsScore] = useState<ScoreState>(INITIAL_SCORE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTrialId = useRef<number | null>(null);

  const handleConsent = async (info: { consent: boolean; programming_experience: string; years_experience: number }) => {
    setSubmitting(true);
    setError(null);
    try {
      const createdParticipant = await createParticipant(info);
      const [tasks, rotation, pictureSet, parsons] = await Promise.all([
        fetchTasks(),
        fetchMentalRotationItems(),
        fetchPictureMemorySet(createdParticipant.id),
        fetchParsonsProblems(),
      ]);
      const timeline: TimelineStep[] = shuffle(tasks).map((task) => ({
        kind: "tracing",
        tracingTask: task,
        assignment: createdParticipant.condition_order[task.id],
      }));
      setParticipant(createdParticipant);
      setTracingTimeline(timeline);
      setRotationItems(rotation);
      setPictureMemorySet(pictureSet);
      setParsonsProblems(shuffle(parsons));
      setPhase("imagery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the study. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageryComplete = useMemo(
    () => (responses: { dimension: string; item_id: string; value: number }[]) => {
      if (!participant) return;
      submitImageryResponses(participant.id, responses)
        .then(() => setPhase("picture-study"))
        .catch((err) => setError(err instanceof Error ? err.message : "Could not save imagery responses."));
    },
    [participant],
  );

  const handleImageryTaskTrial = async (
    taskType: "mental_rotation" | "picture_memory",
    itemId: string,
    response: string,
    rtMs: number,
  ) => {
    if (!participant) return;
    try {
      await submitImageryTaskTrial(participant.id, { task_type: taskType, item_id: itemId, response, rt_ms: rtMs });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that response.");
    }
  };

  const handleStartTrial = async (step: TimelineStep) => {
    if (!participant || !step.tracingTask || !step.assignment) return;
    try {
      const result = await startTrial(participant.id, {
        task_id: step.tracingTask.id,
        condition: step.assignment.condition,
        scaffold_type: step.assignment.scaffold_type,
      });
      currentTrialId.current = result.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start this task.");
    }
  };

  const handleSubmitStep = async (
    _step: TimelineStep,
    stepIndex: number,
    answer: Record<string, unknown>,
    rtMs: number,
  ): Promise<{ correct: boolean | null }> => {
    if (!participant || currentTrialId.current === null) return { correct: null };
    try {
      const result = await submitStep(participant.id, currentTrialId.current, {
        step_index: stepIndex,
        answer,
        completion_time_ms: rtMs,
      });
      return { correct: result.correct };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that checkpoint.");
      return { correct: null };
    }
  };

  const handleSubmitParsonsTrial = async (
    problem: ParsonsProblem,
    submittedOrder: string[],
    rtMs: number,
  ): Promise<{ correct: boolean | null }> => {
    if (!participant) return { correct: null };
    try {
      const result = await submitParsonsTrial(participant.id, {
        problem_id: problem.id,
        submitted_order: submittedOrder,
        completion_time_ms: rtMs,
      });
      return { correct: result.correct };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that solution.");
      return { correct: null };
    }
  };

  const handleFinishTrial = async (_step: TimelineStep, payload: TaskFinishPayload) => {
    if (!participant || currentTrialId.current === null) return;
    try {
      await finishTrial(participant.id, currentTrialId.current, {
        confidence: payload.confidence,
        reasoning_tags: payload.reasoningTags,
        explanation: payload.explanation || undefined,
        scaffold_open_count: payload.scaffoldOpenCount,
        scaffold_open_ms: payload.scaffoldOpenMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this task's summary.");
    } finally {
      currentTrialId.current = null;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Mental Imagery &amp; Code Tracing Study</h1>
        <p>Imagery profiling, code-tracing tasks and visual scaffolding, in one session.</p>
      </header>

      {phase === "consent" && <ConsentScreen onSubmit={handleConsent} submitting={submitting} error={error} />}

      {phase === "imagery" && participant && <ImageryPhase onComplete={handleImageryComplete} />}

      {phase === "picture-study" && pictureMemorySet && (
        <PictureMemoryStudy items={pictureMemorySet.study} onComplete={() => setPhase("mental-rotation")} />
      )}

      {phase === "mental-rotation" && rotationItems.length > 0 && (
        <MentalRotationTask
          items={rotationItems}
          onSubmitTrial={(itemId, response, rtMs) => handleImageryTaskTrial("mental_rotation", itemId, response, rtMs)}
          onComplete={() => setPhase("picture-test")}
        />
      )}

      {phase === "picture-test" && pictureMemorySet && (
        <PictureMemoryTest
          items={pictureMemorySet.test}
          onSubmitTrial={(itemId, response, rtMs) => handleImageryTaskTrial("picture_memory", itemId, response, rtMs)}
          onComplete={() => setPhase("tracing")}
        />
      )}

      {phase === "tracing" && participant && (
        <TracingPhase
          timeline={tracingTimeline}
          onStartTrial={handleStartTrial}
          onSubmitStep={handleSubmitStep}
          onFinishTrial={handleFinishTrial}
          onComplete={(result) => {
            setFinalScore(result);
            setPhase("parsons");
          }}
        />
      )}

      {phase === "parsons" && participant && parsonsProblems.length > 0 && (
        <ParsonsPhase
          problems={parsonsProblems}
          onSubmitTrial={handleSubmitParsonsTrial}
          onComplete={(result) => {
            setParsonsScore(result);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && participant && (
        <DoneScreen
          participantId={participant.id}
          score={finalScore.score}
          bestStreak={finalScore.bestStreak}
          correctCount={finalScore.correctCount}
          totalCount={finalScore.totalCount}
          parsonsScore={parsonsScore.score}
          parsonsCorrectCount={parsonsScore.correctCount}
          parsonsTotalCount={parsonsScore.totalCount}
        />
      )}

      {error && phase !== "consent" && <p className="error-text">{error}</p>}
    </div>
  );
}

export default App;
