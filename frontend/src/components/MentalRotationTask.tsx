import { useEffect, useRef, useState } from "react";
import type { MentalRotationItem } from "../engine/types";

interface Props {
  items: MentalRotationItem[];
  onSubmitTrial: (itemId: string, response: string, rtMs: number) => Promise<void>;
  onComplete: () => void;
}

export function MentalRotationTask({ items, onSubmitTrial, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    if (started) startedAt.current = performance.now();
  }, [started, index]);

  const item = items[index];

  const handleAnswer = async (response: "normal" | "mirrored") => {
    if (submitting || !item) return;
    setSubmitting(true);
    const rtMs = Math.round(performance.now() - startedAt.current);
    await onSubmitTrial(item.id, response, rtMs);
    setSubmitting(false);
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  if (!started) {
    return (
      <div className="screen">
        <p className="eyebrow">Mental rotation</p>
        <h2>Before you start</h2>
        <p className="scaffold-hint">
          You'll see a letter, sometimes rotated to different angles. Decide whether it's shown in its
          normal form or flipped into a mirror image -- like this:
        </p>

        <div className="rotation-example-row">
          <div className="rotation-example-item">
            <span className="rotation-letter">R</span>
            <span className="rotation-example-label">Normal</span>
          </div>
          <div className="rotation-example-item">
            <span className="rotation-letter" style={{ transform: "scaleX(-1)" }}>
              R
            </span>
            <span className="rotation-example-label">Mirrored</span>
          </div>
        </div>

        <p className="scaffold-hint">
          The rotation angle doesn't matter for your answer -- judge only whether the letter itself has
          been flipped. Answer as quickly and accurately as you can.
        </p>

        <button type="button" className="btn-primary" onClick={() => setStarted(true)}>
          Start
        </button>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="screen">
      <p className="eyebrow">Mental rotation</p>
      <h2>Is this letter normal or mirrored?</h2>
      <p className="step-progress">Item {index + 1} of {items.length}</p>

      <div className="rotation-stage">
        <span
          className="rotation-letter"
          style={{ transform: `rotate(${item.angle}deg) scaleX(${item.mirrored ? -1 : 1})` }}
        >
          {item.letter}
        </span>
      </div>

      <div className="rotation-actions">
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => handleAnswer("normal")}>
          Normal
        </button>
        <button type="button" className="btn-primary" disabled={submitting} onClick={() => handleAnswer("mirrored")}>
          Mirrored
        </button>
      </div>
    </div>
  );
}
