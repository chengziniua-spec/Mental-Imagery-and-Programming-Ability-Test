import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["parsons"])


@router.get("/api/parsons-problems", response_model=list[schemas.ParsonsProblemOut])
def list_parsons_problems(db: Session = Depends(get_db)):
    problems = db.query(models.ParsonsProblem).all()
    out = []
    for problem in problems:
        blocks = list(problem.blocks)
        random.shuffle(blocks)
        out.append(
            schemas.ParsonsProblemOut(
                id=problem.id,
                title=problem.title,
                requirement=problem.requirement,
                difficulty=problem.difficulty,
                blocks=[schemas.ParsonsBlockOut(**b) for b in blocks],
            )
        )
    return out


@router.post("/api/participants/{participant_id}/parsons-trials", response_model=schemas.ParsonsTrialOut)
def submit_parsons_trial(
    participant_id: str, payload: schemas.ParsonsTrialIn, db: Session = Depends(get_db)
):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")

    problem = db.get(models.ParsonsProblem, payload.problem_id)
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found.")

    correct = payload.submitted_order == problem.correct_order

    trial = models.ParsonsTrial(
        participant_id=participant_id,
        problem_id=payload.problem_id,
        submitted_order=payload.submitted_order,
        correct=correct,
        completion_time_ms=payload.completion_time_ms,
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)
    return schemas.ParsonsTrialOut(id=trial.id, problem_id=trial.problem_id, correct=trial.correct)
