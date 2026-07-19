import { Target, Flame } from "./icons";

interface Props {
  score: number;
  streak: number;
}

export function ScoreHud({ score, streak }: Props) {
  return (
    <div className="score-hud">
      <span>
        <Target size={14} /> Score: <strong>{score}</strong>
      </span>
      <span>
        <Flame size={14} /> Streak: <strong>{streak}</strong>
      </span>
    </div>
  );
}
