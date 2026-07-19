import type { TimelineStep, TrialRecord } from "./types";

type Listener = () => void;

/**
 * Minimal jsPsych-style timeline runner: walks a fixed sequence of trial
 * steps, stamping each response with reaction time from when the step
 * became current to when the participant submitted.
 */
export class TaskEngine {
  private readonly timeline: TimelineStep[];
  private index = 0;
  private stepStartedAt = 0;
  private records: TrialRecord[] = [];
  private listeners = new Set<Listener>();

  constructor(timeline: TimelineStep[]) {
    this.timeline = timeline;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  start() {
    this.index = 0;
    this.records = [];
    this.stepStartedAt = performance.now();
    this.notify();
  }

  get currentStep(): TimelineStep | null {
    return this.timeline[this.index] ?? null;
  }

  get currentIndex(): number {
    return this.index;
  }

  get total(): number {
    return this.timeline.length;
  }

  get progress(): number {
    return this.timeline.length === 0 ? 1 : this.index / this.timeline.length;
  }

  get isDone(): boolean {
    return this.index >= this.timeline.length;
  }

  get allRecords(): TrialRecord[] {
    return this.records;
  }

  submit(response: unknown) {
    const step = this.currentStep;
    if (!step) return;
    const submittedAt = performance.now();
    this.records.push({
      step,
      rtMs: Math.round(submittedAt - this.stepStartedAt),
      response,
    });
    this.index += 1;
    this.stepStartedAt = performance.now();
    this.notify();
  }
}
