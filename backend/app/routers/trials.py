from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/participants", tags=["trials"])


def score_step(expected: dict, answer: dict) -> bool:
    return all(answer.get(key) == value for key, value in expected.items())


@router.post("/{participant_id}/trials/start", response_model=schemas.TrialStartOut)
def start_trial(participant_id: str, payload: schemas.TrialStartIn, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    task = db.get(models.TracingTask, payload.task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")

    trial = models.TracingTrial(
        participant_id=participant_id,
        task_id=payload.task_id,
        condition=payload.condition,
        scaffold_type=payload.scaffold_type,
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)
    return schemas.TrialStartOut(id=trial.id, task_id=trial.task_id)


@router.post("/{participant_id}/trials/{trial_id}/steps", response_model=schemas.StepAnswerOut)
def submit_step(participant_id: str, trial_id: int, payload: schemas.StepAnswerIn, db: Session = Depends(get_db)):
    trial = db.get(models.TracingTrial, trial_id)
    if trial is None or trial.participant_id != participant_id:
        raise HTTPException(status_code=404, detail="Trial not found.")

    task = trial.task
    if payload.step_index < 0 or payload.step_index >= len(task.trace_steps):
        raise HTTPException(status_code=400, detail="Invalid step index.")
    step_def = task.trace_steps[payload.step_index]

    correct = score_step(step_def["expected"], payload.answer)

    step_answer = models.TracingStepAnswer(
        trial_id=trial_id,
        step_index=payload.step_index,
        line=step_def["line"],
        iteration_label=step_def.get("iteration_label"),
        answer=payload.answer,
        correct=correct,
        completion_time_ms=payload.completion_time_ms,
    )
    db.add(step_answer)
    db.commit()
    db.refresh(step_answer)
    return schemas.StepAnswerOut(id=step_answer.id, step_index=step_answer.step_index, correct=step_answer.correct)


@router.patch("/{participant_id}/trials/{trial_id}/finish", response_model=schemas.TracingTrialOut)
def finish_trial(participant_id: str, trial_id: int, payload: schemas.TrialFinishIn, db: Session = Depends(get_db)):
    trial = db.get(models.TracingTrial, trial_id)
    if trial is None or trial.participant_id != participant_id:
        raise HTTPException(status_code=404, detail="Trial not found.")

    step_answers = trial.step_answers
    trial.step_count = len(step_answers)
    trial.correct_step_count = sum(1 for s in step_answers if s.correct)
    trial.correct = (trial.step_count > 0) and (trial.correct_step_count == trial.step_count)
    trial.completion_time_ms = sum(s.completion_time_ms or 0 for s in step_answers) or None
    trial.confidence = payload.confidence
    trial.reasoning_tags = payload.reasoning_tags
    trial.explanation = payload.explanation
    trial.scaffold_open_count = payload.scaffold_open_count
    trial.scaffold_open_ms = payload.scaffold_open_ms
    trial.finished_at = datetime.utcnow()
    trial.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(trial)
    return trial


@router.get("/{participant_id}/trials", response_model=list[schemas.TracingTrialOut])
def list_trials(participant_id: str, db: Session = Depends(get_db)):
    return db.query(models.TracingTrial).filter(models.TracingTrial.participant_id == participant_id).all()
