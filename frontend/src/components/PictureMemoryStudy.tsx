import { useEffect, useState } from "react";
import type { PictureMemoryItem } from "../engine/types";
import { PICTURE_ICONS } from "./pictureIcons";

interface Props {
  items: PictureMemoryItem[];
  onComplete: () => void;
}

const EXPOSURE_MS = 3000;

export function PictureMemoryStudy({ items, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => {
      if (index + 1 < items.length) {
        setIndex((i) => i + 1);
      } else {
        onComplete();
      }
    }, EXPOSURE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, index]);

  if (!started) {
    return (
      <div className="screen">
        <p className="eyebrow">Picture memory - study</p>
        <h2>You're about to see 6 pictures</h2>
        <p className="scaffold-hint">
          Each one will stay on screen for a few seconds. Try to remember them -- you'll be asked which
          ones you saw a bit later in the session.
        </p>
        <button type="button" className="btn-primary" onClick={() => setStarted(true)}>
          Start
        </button>
      </div>
    );
  }

  const item = items[index];
  if (!item) return null;
  const Icon = PICTURE_ICONS[item.icon];

  return (
    <div className="screen">
      <p className="eyebrow">Picture memory - study</p>
      <h2>Try to remember this picture</h2>
      <p className="step-progress">Picture {index + 1} of {items.length}</p>
      <div className="picture-stage">{Icon && <Icon size={96} strokeWidth={1.5} />}</div>
    </div>
  );
}
