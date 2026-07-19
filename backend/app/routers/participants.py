import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..data.seed_tasks import SEED_TASKS
from ..data.seed_imagery_tasks import PICTURE_POOL
from ..database import get_db

router = APIRouter(prefix="/api/participants", tags=["participants"])

SCAFFOLD_TYPES = ["state_table", "execution_timeline", "control_flow"]


def assign_conditions() -> dict:
    """Balanced random assignment of each seed task to code_only vs scaffolded."""
    task_ids = [t["id"] for t in SEED_TASKS]
    random.shuffle(task_ids)
    half = len(task_ids) // 2
    scaffolded_ids = set(task_ids[:half])
    assignment = {}
    for task_id in task_ids:
        if task_id in scaffolded_ids:
            assignment[task_id] = {
                "condition": "scaffolded",
                "scaffold_type": random.choice(SCAFFOLD_TYPES),
            }
        else:
            assignment[task_id] = {"condition": "code_only", "scaffold_type": None}
    return assignment


def assign_picture_memory_old() -> list[str]:
    """Randomly pick half the picture pool as this participant's studied ("old") set."""
    pool = list(PICTURE_POOL)
    random.shuffle(pool)
    return pool[: len(pool) // 2]


@router.post("", response_model=schemas.ParticipantOut)
def create_participant(payload: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent is required to participate.")
    participant = models.Participant(
        consent=payload.consent,
        programming_experience=payload.programming_experience,
        years_experience=payload.years_experience,
        condition_order=assign_conditions(),
        picture_memory_old=assign_picture_memory_old(),
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.get("/{participant_id}", response_model=schemas.ParticipantOut)
def get_participant(participant_id: str, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    return participant
