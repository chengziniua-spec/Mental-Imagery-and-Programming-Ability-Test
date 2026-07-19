export type ImageryDimension =
  | "visual_vividness"
  | "imagery_control"
  | "imagery_stability"
  | "spatial_flow";

export interface ImageryItem {
  id: string;
  dimension: ImageryDimension;
  prompt: string;
}

export type AnswerFieldType = "number" | "number_list" | "choice";

export interface AnswerField {
  name: string;
  type: AnswerFieldType;
}

export interface TraceStep {
  line: number;
  iteration_label: string | null;
  prompt: string;
  fields: AnswerField[];
  options: string[] | null;
}

export interface TracingTask {
  id: string;
  title: string;
  code: string;
  task_type: string;
  difficulty: string;
  glossary: { term: string; explanation: string }[];
  steps: TraceStep[];
}

export type ScaffoldType = "state_table" | "execution_timeline" | "control_flow" | null;
export type Condition = "code_only" | "scaffolded";

export interface ConditionAssignment {
  condition: Condition;
  scaffold_type: ScaffoldType;
}

export interface MentalRotationItem {
  id: string;
  letter: string;
  angle: number;
  mirrored: boolean;
}

export interface PictureMemoryItem {
  item_id: string;
  icon: string;
}

export interface PictureMemorySet {
  study: PictureMemoryItem[];
  test: PictureMemoryItem[];
}

export interface ParsonsBlock {
  id: string;
  code: string;
}

export interface ParsonsProblem {
  id: string;
  title: string;
  requirement: string;
  difficulty: string;
  blocks: ParsonsBlock[];
}

export interface Participant {
  id: string;
  created_at: string;
  consent: boolean;
  programming_experience: string | null;
  years_experience: number | null;
  condition_order: Record<string, ConditionAssignment>;
}

export type TimelineStepKind = "imagery" | "tracing";

export interface TimelineStep {
  kind: TimelineStepKind;
  imageryItem?: ImageryItem;
  tracingTask?: TracingTask;
  assignment?: ConditionAssignment;
}

export interface TrialRecord {
  step: TimelineStep;
  rtMs: number;
  response: unknown;
}
