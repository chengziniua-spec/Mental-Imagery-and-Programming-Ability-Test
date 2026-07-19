from statistics import mean

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..auth import require_admin_auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin_auth)])


def _participant_query(db: Session, include_test: bool):
    query = db.query(models.Participant)
    if not include_test:
        query = query.filter(models.Participant.is_test.is_(False))
    return query


def _finished(trials: list[models.TracingTrial]) -> list[models.TracingTrial]:
    return [t for t in trials if t.finished_at is not None]


def _summarize(participant: models.Participant) -> schemas.ParticipantSummaryOut:
    trials = _finished(participant.trials)
    step_count = sum(t.step_count for t in trials)
    correct_step_count = sum(t.correct_step_count for t in trials)
    confidences = [t.confidence for t in trials if t.confidence is not None]
    times = [t.completion_time_ms for t in trials if t.completion_time_ms is not None]
    return schemas.ParticipantSummaryOut(
        id=participant.id,
        created_at=participant.created_at,
        programming_experience=participant.programming_experience,
        years_experience=participant.years_experience,
        is_test=participant.is_test,
        trial_count=len(trials),
        step_count=step_count,
        correct_step_count=correct_step_count,
        accuracy=(correct_step_count / step_count) if step_count else None,
        avg_confidence=mean(confidences) if confidences else None,
        avg_completion_time_ms=mean(times) if times else None,
        imagery_item_count=len(participant.imagery_responses),
    )


def _condition_stats(trials: list[models.TracingTrial]) -> schemas.ConditionStats:
    step_count = sum(t.step_count for t in trials)
    correct_step_count = sum(t.correct_step_count for t in trials)
    confidences = [t.confidence for t in trials if t.confidence is not None]
    times = [t.completion_time_ms for t in trials if t.completion_time_ms is not None]
    return schemas.ConditionStats(
        n=len(trials),
        step_n=step_count,
        accuracy=(correct_step_count / step_count) if step_count else None,
        avg_confidence=mean(confidences) if confidences else None,
        avg_completion_time_ms=mean(times) if times else None,
    )


@router.get("/participants", response_model=list[schemas.ParticipantSummaryOut])
def list_participants(include_test: bool = False, db: Session = Depends(get_db)):
    participants = (
        _participant_query(db, include_test)
        .options(joinedload(models.Participant.trials), joinedload(models.Participant.imagery_responses))
        .order_by(models.Participant.created_at.desc())
        .all()
    )
    return [_summarize(p) for p in participants]


@router.get("/participants/{participant_id}", response_model=schemas.ParticipantDetailOut)
def get_participant_detail(participant_id: str, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")

    trials = [
        schemas.TrialDetailOut(
            id=t.id,
            task_id=t.task_id,
            task_title=t.task.title,
            task_type=t.task.task_type,
            condition=t.condition,
            scaffold_type=t.scaffold_type,
            correct=t.correct,
            step_count=t.step_count,
            correct_step_count=t.correct_step_count,
            completion_time_ms=t.completion_time_ms,
            confidence=t.confidence,
            reasoning_tags=t.reasoning_tags,
            explanation=t.explanation,
            submitted_at=t.submitted_at,
            step_answers=[
                schemas.StepAnswerDetailOut(
                    id=s.id,
                    step_index=s.step_index,
                    line=s.line,
                    iteration_label=s.iteration_label,
                    answer=s.answer,
                    correct=s.correct,
                    completion_time_ms=s.completion_time_ms,
                )
                for s in t.step_answers
            ],
        )
        for t in participant.trials
        if t.finished_at is not None
    ]

    parsons_trials = [
        schemas.ParsonsTrialDetailOut(
            id=pt.id,
            problem_id=pt.problem_id,
            problem_title=pt.problem.title,
            submitted_order=pt.submitted_order,
            correct=pt.correct,
            completion_time_ms=pt.completion_time_ms,
            submitted_at=pt.submitted_at,
        )
        for pt in participant.parsons_trials
    ]

    return schemas.ParticipantDetailOut(
        id=participant.id,
        created_at=participant.created_at,
        consent=participant.consent,
        programming_experience=participant.programming_experience,
        years_experience=participant.years_experience,
        is_test=participant.is_test,
        imagery_responses=participant.imagery_responses,
        trials=trials,
        parsons_trials=parsons_trials,
    )


@router.patch("/participants/{participant_id}/test-flag", response_model=schemas.ParticipantOut)
def set_test_flag(participant_id: str, payload: schemas.TestFlagIn, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    participant.is_test = payload.is_test
    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/participants/{participant_id}", status_code=204)
def delete_participant(participant_id: str, db: Session = Depends(get_db)):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")
    db.delete(participant)
    db.commit()


@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(include_test: bool = False, db: Session = Depends(get_db)):
    participants = _participant_query(db, include_test).all()
    participant_ids = [p.id for p in participants]

    all_trials = _finished([t for p in participants for t in p.trials])
    by_condition = {
        condition: _condition_stats([t for t in all_trials if t.condition == condition])
        for condition in ("code_only", "scaffolded")
    }
    by_scaffold_type = {
        scaffold_type: _condition_stats([t for t in all_trials if t.scaffold_type == scaffold_type])
        for scaffold_type in ("state_table", "execution_timeline", "control_flow")
    }

    imagery_responses = (
        db.query(models.ImageryResponse)
        .filter(models.ImageryResponse.participant_id.in_(participant_ids))
        .all()
        if participant_ids
        else []
    )
    dimensions = {"visual_vividness", "imagery_control", "imagery_stability", "spatial_flow"}
    imagery_dimension_avgs = {
        dimension: mean(values)
        for dimension in dimensions
        if (values := [r.value for r in imagery_responses if r.dimension == dimension])
    }

    total_steps = sum(t.step_count for t in all_trials)
    correct_steps = sum(t.correct_step_count for t in all_trials)

    imagery_task_trials = (
        db.query(models.ImageryTaskTrial)
        .filter(models.ImageryTaskTrial.participant_id.in_(participant_ids))
        .all()
        if participant_ids
        else []
    )

    def _imagery_task_stats(task_type: str) -> schemas.ImageryTaskStats:
        trials = [t for t in imagery_task_trials if t.task_type == task_type]
        n = len(trials)
        correct_n = sum(1 for t in trials if t.correct is True)
        rts = [t.rt_ms for t in trials if t.rt_ms is not None]
        return schemas.ImageryTaskStats(
            n=n,
            accuracy=(correct_n / n) if n else None,
            avg_rt_ms=mean(rts) if rts else None,
        )

    parsons_trials = (
        db.query(models.ParsonsTrial)
        .filter(models.ParsonsTrial.participant_id.in_(participant_ids))
        .all()
        if participant_ids
        else []
    )
    parsons_n = len(parsons_trials)
    parsons_correct_n = sum(1 for t in parsons_trials if t.correct is True)
    parsons_times = [t.completion_time_ms for t in parsons_trials if t.completion_time_ms is not None]
    parsons_stats = schemas.ImageryTaskStats(
        n=parsons_n,
        accuracy=(parsons_correct_n / parsons_n) if parsons_n else None,
        avg_rt_ms=mean(parsons_times) if parsons_times else None,
    )

    return schemas.StatsOut(
        total_participants=len(participants),
        total_trials=len(all_trials),
        total_steps=total_steps,
        overall_accuracy=(correct_steps / total_steps) if total_steps else None,
        by_condition=by_condition,
        by_scaffold_type=by_scaffold_type,
        imagery_dimension_avgs=imagery_dimension_avgs,
        mental_rotation=_imagery_task_stats("mental_rotation"),
        picture_memory=_imagery_task_stats("picture_memory"),
        parsons=parsons_stats,
    )
