import { useEffect, useRef, useState } from "react";
import type { PictureMemoryItem } from "../engine/types";
import { PICTURE_ICONS } from "./pictureIcons";

interface Props {
  items: PictureMemoryItem[];
  onSubmitTrial: (itemId: string, response: string, rtMs: number) => Promise<void>;
  onComplete: () => void;
}

export function PictureMemoryTest({ items, onSubmitTrial, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    startedAt.current = performance.now();
  }, [index]);

  const item = items[index];

  const handleAnswer = async (response: "seen" | "not_seen") => {
    if (submitting || !item) return;
    setSubmitting(true);
    const rtMs = Math.round(performance.now() - startedAt.current);
    await onSubmitTrial(item.item_id, response, rtMs);
    setSubmitting(false);
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  if (!item) return null;
  const Icon = PICTURE_ICONS[item.icon];

  return (
    <div className="screen">
      <p className="eyebrow">Picture memory - test</p>
      <h2>Have you seen this picture before?</h2>
      <p className="step-progress">Picture {index + 1} of {items.length}</p>

      <div className="picture-stage">{Icon && <Icon size={96} strokeWidth={1.5} />}</div>

      <div className="rotation-actions">
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => handleAnswer("seen")}>
          Seen it
        </button>
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => handleAnswer("not_seen")}>
          New to me
        </button>
      </div>
    </div>
  );
}
