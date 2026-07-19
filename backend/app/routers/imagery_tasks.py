import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..data.seed_imagery_tasks import MENTAL_ROTATION_ITEMS, PICTURE_POOL
from ..database import get_db

router = APIRouter(tags=["imagery-tasks"])

_ROTATION_BY_ID = {item["id"]: item for item in MENTAL_ROTATION_ITEMS}


@router.get("/api/imagery-tasks/mental-rotation", response_model=list[schemas.MentalRotationItemOut])
def list_mental_rotation_items():
    return [schemas.MentalRotationItemOut(**item) for item in MENTAL_ROTATION_ITEMS]


@router.get("/api/participants/{participant_id}/picture-memory", response_model=schemas.PictureMemorySetOut)
def get_picture_memory_set(participant_id: str, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")

    old_icons = participant.picture_memory_old or []
    study = [schemas.PictureMemoryItemOut(item_id=icon, icon=icon) for icon in old_icons]

    test_icons = list(PICTURE_POOL)
    random.shuffle(test_icons)
    test = [schemas.PictureMemoryItemOut(item_id=icon, icon=icon) for icon in test_icons]

    return schemas.PictureMemorySetOut(study=study, test=test)


@router.post("/api/participants/{participant_id}/imagery-task-trials", response_model=schemas.ImageryTaskTrialOut)
def submit_imagery_task_trial(
    participant_id: str, payload: schemas.ImageryTaskTrialIn, db: Session = Depends(get_db)
):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")

    if payload.task_type == "mental_rotation":
        item = _ROTATION_BY_ID.get(payload.item_id)
        if item is None:
            raise HTTPException(status_code=400, detail="Unknown mental rotation item.")
        expected = "mirrored" if item["mirrored"] else "normal"
        correct = payload.response == expected
    elif payload.task_type == "picture_memory":
        old_icons = set(participant.picture_memory_old or [])
        expected = "seen" if payload.item_id in old_icons else "not_seen"
        correct = payload.response == expected
    else:
        raise HTTPException(status_code=400, detail="Unknown task_type.")

    trial = models.ImageryTaskTrial(
        participant_id=participant_id,
        task_type=payload.task_type,
        item_id=payload.item_id,
        response=payload.response,
        correct=correct,
        rt_ms=payload.rt_ms,
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)
    return schemas.ImageryTaskTrialOut(id=trial.id, task_type=trial.task_type, item_id=trial.item_id, correct=trial.correct)
