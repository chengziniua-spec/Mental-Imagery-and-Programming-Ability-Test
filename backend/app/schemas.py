from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ParticipantCreate(BaseModel):
    consent: bool
    programming_experience: Optional[str] = None
    years_experience: Optional[float] = None


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    consent: bool
    programming_experience: Optional[str]
    years_experience: Optional[float]
    condition_order: Optional[dict[str, Any]]
    is_test: bool


class ImageryResponseIn(BaseModel):
    dimension: str
    item_id: str
    value: int


class ImageryResponseBulkIn(BaseModel):
    responses: list[ImageryResponseIn]


class ImageryResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dimension: str
    item_id: str
    value: int


class MentalRotationItemOut(BaseModel):
    id: str
    letter: str
    angle: int
    mirrored: bool


class PictureMemoryItemOut(BaseModel):
    item_id: str
    icon: str


class PictureMemorySetOut(BaseModel):
    study: list[PictureMemoryItemOut]
    test: list[PictureMemoryItemOut]


class ImageryTaskTrialIn(BaseModel):
    task_type: str  # mental_rotation | picture_memory
    item_id: str
    response: str
    rt_ms: Optional[int] = None


class ImageryTaskTrialOut(BaseModel):
    id: int
    task_type: str
    item_id: str
    correct: Optional[bool]


class StepField(BaseModel):
    name: str
    type: str  # number/number_list/choice


class StepPublic(BaseModel):
    """A checkpoint as sent to the client -- never includes `expected`."""

    line: int
    iteration_label: Optional[str] = None
    prompt: str
    fields: list[StepField]
    options: Optional[list[str]] = None


class TracingTaskOut(BaseModel):
    id: str
    title: str
    code: str
    task_type: str
    difficulty: str
    glossary: list[dict]
    steps: list[StepPublic]


class TrialStartIn(BaseModel):
    task_id: str
    condition: str
    scaffold_type: Optional[str] = None


class TrialStartOut(BaseModel):
    id: int
    task_id: str


class StepAnswerIn(BaseModel):
    step_index: int
    answer: dict[str, Any]
    completion_time_ms: Optional[int] = None


class StepAnswerOut(BaseModel):
    id: int
    step_index: int
    correct: Optional[bool]


class TrialFinishIn(BaseModel):
    confidence: int
    reasoning_tags: list[str] = []
    explanation: Optional[str] = None


class TracingTrialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: str
    condition: str
    scaffold_type: Optional[str]
    step_count: int
    correct_step_count: int
    correct: Optional[bool]
    completion_time_ms: Optional[int]
    confidence: Optional[int]
    reasoning_tags: Optional[list[str]]
    explanation: Optional[str]
    submitted_at: datetime


class ParticipantSummaryOut(BaseModel):
    id: str
    created_at: datetime
    programming_experience: Optional[str]
    years_experience: Optional[float]
    is_test: bool
    trial_count: int
    step_count: int
    correct_step_count: int
    accuracy: Optional[float]
    avg_confidence: Optional[float]
    avg_completion_time_ms: Optional[float]
    imagery_item_count: int


class StepAnswerDetailOut(BaseModel):
    id: int
    step_index: int
    line: int
    iteration_label: Optional[str]
    answer: Any
    correct: Optional[bool]
    completion_time_ms: Optional[int]


class TrialDetailOut(BaseModel):
    id: int
    task_id: str
    task_title: str
    task_type: str
    condition: str
    scaffold_type: Optional[str]
    correct: Optional[bool]
    step_count: int
    correct_step_count: int
    completion_time_ms: Optional[int]
    confidence: Optional[int]
    reasoning_tags: Optional[list[str]]
    explanation: Optional[str]
    submitted_at: datetime
    step_answers: list[StepAnswerDetailOut]


class ParsonsTrialDetailOut(BaseModel):
    id: int
    problem_id: str
    problem_title: str
    submitted_order: list[str]
    correct: Optional[bool]
    completion_time_ms: Optional[int]
    submitted_at: datetime


class ParticipantDetailOut(BaseModel):
    id: str
    created_at: datetime
    consent: bool
    programming_experience: Optional[str]
    years_experience: Optional[float]
    is_test: bool
    imagery_responses: list[ImageryResponseOut]
    trials: list[TrialDetailOut]
    parsons_trials: list[ParsonsTrialDetailOut]


class TestFlagIn(BaseModel):
    is_test: bool


class ConditionStats(BaseModel):
    n: int
    step_n: int
    accuracy: Optional[float]
    avg_confidence: Optional[float]
    avg_completion_time_ms: Optional[float]


class ImageryTaskStats(BaseModel):
    n: int
    accuracy: Optional[float]
    avg_rt_ms: Optional[float]


class ParsonsBlockOut(BaseModel):
    id: str
    code: str


class ParsonsProblemOut(BaseModel):
    id: str
    title: str
    requirement: str
    difficulty: str
    blocks: list[ParsonsBlockOut]


class ParsonsTrialIn(BaseModel):
    problem_id: str
    submitted_order: list[str]
    completion_time_ms: Optional[int] = None


class ParsonsTrialOut(BaseModel):
    id: int
    problem_id: str
    correct: Optional[bool]


class StatsOut(BaseModel):
    total_participants: int
    total_trials: int
    total_steps: int
    overall_accuracy: Optional[float]
    by_condition: dict[str, ConditionStats]
    by_scaffold_type: dict[str, ConditionStats]
    imagery_dimension_avgs: dict[str, float]
    mental_rotation: ImageryTaskStats
    picture_memory: ImageryTaskStats
    parsons: ImageryTaskStats
