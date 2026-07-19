import { useState } from "react";

interface Props {
  onSubmit: (info: { consent: boolean; programming_experience: string; years_experience: number }) => void;
  submitting: boolean;
  error: string | null;
}

const EXPERIENCE_LEVELS: { value: string; label: string; description: string }[] = [
  {
    value: "none",
    label: "None",
    description: "Never written code, or only followed a very basic tutorial (e.g. typed a few print statements).",
  },
  {
    value: "beginner",
    label: "Beginner",
    description:
      "Learned the basics of at least one language (variables, loops, conditionals). Can write short programs (a few dozen lines) but have rarely finished a project independently.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description:
      "Can independently build medium-sized programs (a course project, a small tool). Comfortable with common libraries/frameworks in at least one language, and with code split across multiple functions or files.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description:
      "1-3+ years of practical development experience (coursework, internship, or job). Can design and build fairly complex systems; familiar with debugging, version control and code review.",
  },
  {
    value: "expert",
    label: "Expert",
    description:
      "3+ years of professional development experience. Can independently design software architecture, mentor others, and is very familiar with at least one language and its ecosystem.",
  },
];

export function ConsentScreen({ onSubmit, submitting, error }: Props) {
  const [consent, setConsent] = useState(false);
  const [experience, setExperience] = useState("intermediate");
  const [years, setYears] = useState(2);

  return (
    <div className="screen">
      <h2>Welcome</h2>
      <p>
        This study looks at how mental imagery relates to code-tracing performance, and whether visual
        scaffolding helps different people trace code differently. You will complete a short imagery
        questionnaire and a series of code-tracing tasks, with a score and streak shown after each one.
        Your responses, timing and confidence ratings will be recorded for research analysis. Participation
        is voluntary and you may stop at any time.
      </p>

      <label className="field">
        <span>Programming experience</span>
        <select value={experience} onChange={(event) => setExperience(event.target.value)}>
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </label>

      <div className="experience-reference">
        {EXPERIENCE_LEVELS.map((level) => (
          <div
            key={level.value}
            className={`experience-reference-item${level.value === experience ? " experience-reference-item-active" : ""}`}
          >
            <span className="experience-reference-label">{level.label}</span>
            <span className="experience-reference-desc">{level.description}</span>
          </div>
        ))}
      </div>

      <label className="field">
        <span>Years of programming experience</span>
        <input
          type="number"
          min={0}
          max={50}
          value={years}
          onChange={(event) => setYears(Number(event.target.value))}
        />
      </label>

      <label className="field field-checkbox">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>I consent to take part in this study and have my responses recorded for research.</span>
      </label>

      {error && <p className="error-text">{error}</p>}

      <button
        type="button"
        className="btn-primary"
        disabled={!consent || submitting}
        onClick={() => onSubmit({ consent, programming_experience: experience, years_experience: years })}
      >
        {submitting ? "Starting..." : "Begin study"}
      </button>
    </div>
  );
}
