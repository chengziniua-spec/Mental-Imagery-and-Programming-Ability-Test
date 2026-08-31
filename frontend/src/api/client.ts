import type { Participant, TracingTask, MentalRotationItem, PictureMemorySet, ParsonsProblem } from "../engine/types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

export function createParticipant(payload: {
  consent: boolean;
  programming_experience?: string;
  years_experience?: number;
}): Promise<Participant> {
  return request<Participant>("/api/participants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchTasks(): Promise<TracingTask[]> {
  return request<TracingTask[]>("/api/tasks");
}

export function submitImageryResponses(
  participantId: string,
  responses: { dimension: string; item_id: string; value: number }[],
): Promise<unknown> {
  return request(`/api/participants/${participantId}/imagery-responses`, {
    method: "POST",
    body: JSON.stringify({ responses }),
  });
}

export interface TrialStartResult {
  id: number;
  task_id: string;
}

export function startTrial(
  participantId: string,
  payload: { task_id: string; condition: string; scaffold_type: string | null },
): Promise<TrialStartResult> {
  return request<TrialStartResult>(`/api/participants/${participantId}/trials/start`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface StepResult {
  id: number;
  step_index: number;
  correct: boolean | null;
}

export function submitStep(
  participantId: string,
  trialId: number,
  payload: { step_index: number; answer: Record<string, unknown>; completion_time_ms: number },
): Promise<StepResult> {
  return request<StepResult>(`/api/participants/${participantId}/trials/${trialId}/steps`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function finishTrial(
  participantId: string,
  trialId: number,
  payload: {
    confidence: number;
    reasoning_tags: string[];
    explanation?: string;
    scaffold_open_count: number;
    scaffold_open_ms: number;
  },
): Promise<unknown> {
  return request(`/api/participants/${participantId}/trials/${trialId}/finish`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchMentalRotationItems(): Promise<MentalRotationItem[]> {
  return request<MentalRotationItem[]>("/api/imagery-tasks/mental-rotation");
}

export function fetchPictureMemorySet(participantId: string): Promise<PictureMemorySet> {
  return request<PictureMemorySet>(`/api/participants/${participantId}/picture-memory`);
}

export interface ImageryTaskTrialResult {
  id: number;
  correct: boolean | null;
}

export function submitImageryTaskTrial(
  participantId: string,
  payload: { task_type: "mental_rotation" | "picture_memory"; item_id: string; response: string; rt_ms: number },
): Promise<ImageryTaskTrialResult> {
  return request<ImageryTaskTrialResult>(`/api/participants/${participantId}/imagery-task-trials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchParsonsProblems(): Promise<ParsonsProblem[]> {
  return request<ParsonsProblem[]>("/api/parsons-problems");
}

export interface ParsonsTrialResult {
  id: number;
  problem_id: string;
  correct: boolean | null;
}

export function submitParsonsTrial(
  participantId: string,
  payload: { problem_id: string; submitted_order: string[]; completion_time_ms: number },
): Promise<ParsonsTrialResult> {
  return request<ParsonsTrialResult>(`/api/participants/${participantId}/parsons-trials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
