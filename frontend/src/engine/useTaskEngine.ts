import { useEffect, useMemo, useState } from "react";
import { TaskEngine } from "./TaskEngine";
import type { TimelineStep } from "./types";

export function useTaskEngine(timeline: TimelineStep[]) {
  const engine = useMemo(() => new TaskEngine(timeline), [timeline]);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => forceRender((tick) => tick + 1));
    engine.start();
    return unsubscribe;
  }, [engine]);

  return engine;
}
