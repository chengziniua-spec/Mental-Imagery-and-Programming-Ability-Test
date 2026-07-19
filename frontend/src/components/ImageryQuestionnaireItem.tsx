import { useEffect, useState } from "react";
import type { ImageryItem } from "../engine/types";

interface Props {
  item: ImageryItem;
  onAnswer: (value: number) => void;
}

const SCALE = [1, 2, 3, 4, 5, 6, 7];
const ADVANCE_DELAY_MS = 200;

export function ImageryQuestionnaireItem({ item, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [item.id]);

  const handleClick = (value: number) => {
    if (selected !== null) return;
    setSelected(value);
    window.setTimeout(() => onAnswer(value), ADVANCE_DELAY_MS);
  };

  return (
    <div className="screen">
      <p className="eyebrow">Mental imagery questionnaire</p>
      <h2>{item.prompt}</h2>
      <p className="scaffold-hint">1 = no image at all, 7 = as vivid and clear as normal perception.</p>
      <div className="likert-row">
        {SCALE.map((value) => (
          <button
            key={value}
            type="button"
            className={`likert-btn${selected === value ? " likert-btn-selected" : ""}`}
            disabled={selected !== null}
            onClick={() => handleClick(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
