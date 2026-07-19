from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def to_public_task(task: models.TracingTask) -> schemas.TracingTaskOut:
    steps = [
        schemas.StepPublic(
            line=step["line"],
            iteration_label=step.get("iteration_label"),
            prompt=step["prompt"],
            fields=[schemas.StepField(**f) for f in step["fields"]],
            options=step.get("options"),
        )
        for step in task.trace_steps
    ]
    return schemas.TracingTaskOut(
        id=task.id,
        title=task.title,
        code=task.code,
        task_type=task.task_type,
        difficulty=task.difficulty,
        glossary=task.glossary,
        steps=steps,
    )


@router.get("", response_model=list[schemas.TracingTaskOut])
def list_tasks(db: Session = Depends(get_db)):
    return [to_public_task(t) for t in db.query(models.TracingTask).all()]
