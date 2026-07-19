export interface ReasoningTag {
  id: string;
  label: string;
}

export const REASONING_TAGS: ReasoningTag[] = [
  { id: "mental_execution", label: "Traced it mentally, step by step" },
  { id: "used_aid", label: "Used the scratch space / diagram" },
  { id: "pattern_match", label: "Recognized a similar pattern" },
  { id: "guessed", label: "Mostly guessed" },
];

export const OTHER_TAG_ID = "other";
