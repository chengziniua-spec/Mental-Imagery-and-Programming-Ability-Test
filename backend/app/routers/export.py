import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models
from ..auth import require_admin_auth
from ..database import get_db

router = APIRouter(prefix="/api/export", tags=["export"], dependencies=[Depends(require_admin_auth)])


def build_rows(db: Session, include_test: bool) -> list[dict]:
    query = (
        db.query(models.TracingStepAnswer)
        .join(models.TracingTrial)
        .join(models.Participant)
        .filter(models.TracingTrial.finished_at.isnot(None))
    )
    if not include_test:
        query = query.filter(models.Participant.is_test.is_(False))

    rows = []
    for step in query.all():
        trial = step.trial
        participant = trial.participant
        rows.append(
            {
                "participant_id": participant.id,
                "programming_experience": participant.programming_experience,
                "years_experience": participant.years_experience,
                "task_id": trial.task_id,
                "task_type": trial.task.task_type,
                "difficulty": trial.task.difficulty,
                "condition": trial.condition,
                "scaffold_type": trial.scaffold_type,
                "step_index": step.step_index,
                "line": step.line,
                "iteration_label": step.iteration_label,
                "step_correct": step.correct,
                "step_completion_time_ms": step.completion_time_ms,
                "trial_correct": trial.correct,
                "trial_confidence": trial.confidence,
                "trial_reasoning_tags": ";".join(trial.reasoning_tags) if trial.reasoning_tags else None,
                "trial_explanation": trial.explanation,
                "submitted_at": step.submitted_at.isoformat() if step.submitted_at else None,
            }
        )
    return rows


@router.get("/dataset.json")
def export_json(include_test: bool = False, db: Session = Depends(get_db)):
    return build_rows(db, include_test)


@router.get("/dataset.csv")
def export_csv(include_test: bool = False, db: Session = Depends(get_db)):
    rows = build_rows(db, include_test)
    buffer = io.StringIO()
    fieldnames = list(rows[0].keys()) if rows else [
        "participant_id", "programming_experience", "years_experience", "task_id",
        "task_type", "difficulty", "condition", "scaffold_type", "step_index", "line",
        "iteration_label", "step_correct", "step_completion_time_ms", "trial_correct",
        "trial_confidence", "trial_reasoning_tags", "trial_explanation", "submitted_at",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=code_tracing_dataset.csv"},
    )


@router.get("/imagery-profiles.json")
def export_imagery(include_test: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.ImageryResponse).join(models.Participant)
    if not include_test:
        query = query.filter(models.Participant.is_test.is_(False))
    return [
        {
            "participant_id": r.participant_id,
            "dimension": r.dimension,
            "item_id": r.item_id,
            "value": r.value,
        }
        for r in query.all()
    ]
