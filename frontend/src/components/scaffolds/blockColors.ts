import * as d3 from "d3";
import type { BlockType } from "./codeStructure";

const BASE_HUE: Record<Exclude<BlockType, "root">, number> = {
  loop: 205, // blue
  conditional: 32, // amber
  function: 168, // teal
};

export function colorForBlock(type: BlockType, id: number): string {
  if (type === "root") return "transparent";
  const hue = BASE_HUE[type];
  const lightness = 0.55 + ((id % 3) - 1) * 0.12;
  return d3.hsl(hue, 0.55, Math.min(0.78, Math.max(0.35, lightness))).formatHsl();
}

export function labelForBlock(type: BlockType): string {
  switch (type) {
    case "loop":
      return "Loop";
    case "conditional":
      return "Branch";
    case "function":
      return "Function";
    default:
      return "Root";
  }
}
