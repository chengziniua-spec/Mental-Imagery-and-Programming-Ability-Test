const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "admin_token";

let authToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);
const unauthorizedListeners = new Set<() => void>();

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string): void {
  authToken = token;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  authToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function onUnauthorized(callback: () => void): () => void {
  unauthorizedListeners.add(callback);
  return () => unauthorizedListeners.delete(callback);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...options,
  });
  if (response.status === 401) {
    clearAuthToken();
    unauthorizedListeners.forEach((cb) => cb());
    throw new Error("Your admin session expired. Please log in again.");
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function adminLogin(password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Incorrect password." : `Login failed (${response.status}).`);
  }
  const data = (await response.json()) as { token: string };
  setAuthToken(data.token);
}

export async function downloadExport(
  kind: "dataset.csv" | "dataset.json" | "imagery-profiles.json",
  includeTest: boolean,
  filename: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/export/${kind}?include_test=${includeTest}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (response.status === 401) {
    clearAuthToken();
    unauthorizedListeners.forEach((cb) => cb());
    throw new Error("Your admin session expired. Please log in again.");
  }
  if (!response.ok) {
    throw new Error(`Export failed (${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ParticipantSummary {
  id: string;
  created_at: string;
  programming_experience: string | null;
  years_experience: number | null;
  is_test: boolean;
  trial_count: number;
  step_count: number;
  correct_step_count: number;
  accuracy: number | null;
  avg_confidence: number | null;
  avg_completion_time_ms: number | null;
  imagery_item_count: number;
}

export interface ImageryResponseRecord {
  id: number;
  dimension: string;
  item_id: string;
  value: number;
}

export interface StepAnswerDetail {
  id: number;
  step_index: number;
  line: number;
  iteration_label: string | null;
  answer: unknown;
  correct: boolean | null;
  completion_time_ms: number | null;
}

export interface TrialDetail {
  id: number;
  task_id: string;
  task_title: string;
  task_type: string;
  condition: string;
  scaffold_type: string | null;
  correct: boolean | null;
  step_count: number;
  correct_step_count: number;
  completion_time_ms: number | null;
  confidence: number | null;
  reasoning_tags: string[] | null;
  explanation: string | null;
  submitted_at: string;
  step_answers: StepAnswerDetail[];
}

export interface ParsonsTrialDetail {
  id: number;
  problem_id: string;
  problem_title: string;
  submitted_order: string[];
  correct: boolean | null;
  completion_time_ms: number | null;
  submitted_at: string;
}

export interface ParticipantDetail {
  id: string;
  created_at: string;
  consent: boolean;
  programming_experience: string | null;
  years_experience: number | null;
  is_test: boolean;
  imagery_responses: ImageryResponseRecord[];
  trials: TrialDetail[];
  parsons_trials: ParsonsTrialDetail[];
}

export interface ConditionStats {
  n: number;
  step_n: number;
  accuracy: number | null;
  avg_confidence: number | null;
  avg_completion_time_ms: number | null;
}

export interface ImageryTaskStats {
  n: number;
  accuracy: number | null;
  avg_rt_ms: number | null;
}

export interface Stats {
  total_participants: number;
  total_trials: number;
  total_steps: number;
  overall_accuracy: number | null;
  by_condition: Record<string, ConditionStats>;
  by_scaffold_type: Record<string, ConditionStats>;
  imagery_dimension_avgs: Record<string, number>;
  mental_rotation: ImageryTaskStats;
  picture_memory: ImageryTaskStats;
  parsons: ImageryTaskStats;
}

export function fetchParticipants(includeTest: boolean): Promise<ParticipantSummary[]> {
  return request(`/api/admin/participants?include_test=${includeTest}`);
}

export function fetchParticipantDetail(id: string): Promise<ParticipantDetail> {
  return request(`/api/admin/participants/${id}`);
}

export function setTestFlag(id: string, isTest: boolean): Promise<unknown> {
  return request(`/api/admin/participants/${id}/test-flag`, {
    method: "PATCH",
    body: JSON.stringify({ is_test: isTest }),
  });
}

export function deleteParticipant(id: string): Promise<void> {
  return request(`/api/admin/participants/${id}`, { method: "DELETE" });
}

export function fetchStats(includeTest: boolean): Promise<Stats> {
  return request(`/api/admin/stats?include_test=${includeTest}`);
}
