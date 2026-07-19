import type { ImageryItem } from "../engine/types";

// Six-item bank across four imagery dimensions, styled after VVIQ (Marks,
// 1973) and PSIQ (Andrade et al., 2014). visual_vividness and spatial_flow
// carry only one self-report item each because those two dimensions now also
// have an objective task counterpart (picture-memory recognition and mental
// rotation respectively -- see IMAGERY_TASK_DESIGN.md); imagery_control and
// imagery_stability have no objective analogue in this build, so they keep
// two items each. Not a validated instrument on its own -- swap in the full
// published items before piloting.
export const IMAGERY_ITEMS: ImageryItem[] = [
  {
    id: "vv1",
    dimension: "visual_vividness",
    prompt: "Picture a close friend's face. How clear and vivid is the image?",
  },
  {
    id: "ic1",
    dimension: "imagery_control",
    prompt: "Imagine a car, then try to make it change color. How easily can you control the image?",
  },
  {
    id: "ic2",
    dimension: "imagery_control",
    prompt: "Imagine a bouncing ball, then try to slow its motion in your mind. How easily can you control it?",
  },
  {
    id: "is1",
    dimension: "imagery_stability",
    prompt: "Hold an image of a familiar room in mind for ten seconds. How stable does it remain?",
  },
  {
    id: "is2",
    dimension: "imagery_stability",
    prompt: "Picture a spinning coin and keep watching it. How stable is the image over time?",
  },
  {
    id: "sf1",
    dimension: "spatial_flow",
    prompt: "Imagine walking through your home, tracking each turn you take. How easily can you follow the path?",
  },
];
