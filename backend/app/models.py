import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid() -> str:
    return uuid.uuid4().hex


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    consent = Column(Boolean, default=False)
    programming_experience = Column(String, nullable=True)  # none/beginner/intermediate/advanced/expert
    years_experience = Column(Float, nullable=True)
    condition_order = Column(JSON, nullable=True)  # e.g. ["code_only", "scaffolded"] assignment metadata
    is_test = Column(Boolean, default=False, nullable=False)  # marked as test data, excluded from exports by default
    picture_memory_old = Column(JSON, nullable=True)  # this participant's randomly-assigned "old" (studied) icon set

    imagery_responses = relationship("ImageryResponse", back_populates="participant", cascade="all, delete-orphan")
    trials = relationship("TracingTrial", back_populates="participant", cascade="all, delete-orphan")
    imagery_task_trials = relationship("ImageryTaskTrial", back_populates="participant", cascade="all, delete-orphan")
    parsons_trials = relationship("ParsonsTrial", back_populates="participant", cascade="all, delete-orphan")


class ImageryResponse(Base):
    __tablename__ = "imagery_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    dimension = Column(String, nullable=False)  # visual_vividness/imagery_control/imagery_stability/spatial_flow
    item_id = Column(String, nullable=False)
    value = Column(Integer, nullable=False)  # Likert scale response
    created_at = Column(DateTime, default=datetime.utcnow)

    participant = relationship("Participant", back_populates="imagery_responses")


class TracingTask(Base):
    __tablename__ = "tracing_tasks"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    task_type = Column(String, nullable=False)  # variable/loop/conditional/function/state
    difficulty = Column(String, nullable=False)  # easy/medium/hard
    glossary = Column(JSON, nullable=False, default=list)  # [{"term": "range()", "explanation": "..."}]
    trace_steps = Column(JSON, nullable=False)
    # [{"line": 3, "iteration_label": "i=1"|None, "prompt": "...",
    #   "fields": [{"name": "total", "type": "number|number_list|choice"}],
    #   "options": ["A","B"]|None, "expected": {"total": 1}}, ...]
    # `expected` is stripped before anything is sent to the client.

    trials = relationship("TracingTrial", back_populates="task")


class TracingTrial(Base):
    """One participant's full attempt at one task -- a summary row aggregated
    from its child TracingStepAnswer rows once all checkpoints are answered."""

    __tablename__ = "tracing_trials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    task_id = Column(String, ForeignKey("tracing_tasks.id"), nullable=False)
    condition = Column(String, nullable=False)  # code_only/scaffolded
    scaffold_type = Column(String, nullable=True)  # state_table/execution_timeline/control_flow/None
    step_count = Column(Integer, nullable=False, default=0)
    correct_step_count = Column(Integer, nullable=False, default=0)
    correct = Column(Boolean, nullable=True)  # True only if every step was correct
    completion_time_ms = Column(Integer, nullable=True)  # sum of all step completion times
    confidence = Column(Integer, nullable=True)  # 1-7, rated once after all steps are done
    reasoning_tags = Column(JSON, nullable=True)  # e.g. ["mental_execution", "guessed"]
    explanation = Column(Text, nullable=True)  # free text, only meaningful when "other" is tagged
    # The scaffold panel (scaffolded condition only) is opt-in/click-to-reveal, not always-on --
    # these count how often and how long the participant chose to consult it across the whole task.
    # Always 0 in the code_only condition (no scaffold panel exists there).
    scaffold_open_count = Column(Integer, nullable=False, default=0)
    scaffold_open_ms = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    participant = relationship("Participant", back_populates="trials")
    task = relationship("TracingTask", back_populates="trials")
    step_answers = relationship("TracingStepAnswer", back_populates="trial", cascade="all, delete-orphan")


class TracingStepAnswer(Base):
    """One answered checkpoint (one line/iteration) within a TracingTrial."""

    __tablename__ = "tracing_step_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trial_id = Column(Integer, ForeignKey("tracing_trials.id"), nullable=False)
    step_index = Column(Integer, nullable=False)
    line = Column(Integer, nullable=False)
    iteration_label = Column(String, nullable=True)
    answer = Column(JSON, nullable=True)
    correct = Column(Boolean, nullable=True)
    completion_time_ms = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    trial = relationship("TracingTrial", back_populates="step_answers")


class ImageryTaskTrial(Base):
    """One trial of an objective imagery task (mental rotation or picture-memory recognition)."""

    __tablename__ = "imagery_task_trials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    task_type = Column(String, nullable=False)  # mental_rotation | picture_memory
    item_id = Column(String, nullable=False)
    response = Column(String, nullable=False)
    correct = Column(Boolean, nullable=True)
    rt_ms = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    participant = relationship("Participant", back_populates="imagery_task_trials")


class ParsonsProblem(Base):
    """A Parsons-problem style code-construction task (Parsons & Haden, 2006):
    given a requirement, arrange shuffled code blocks (some are distractors)
    into the correct order. Measures logic/requirement-to-code construction,
    distinct from the execution-tracing construct used elsewhere."""

    __tablename__ = "parsons_problems"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    requirement = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False)
    blocks = Column(JSON, nullable=False)  # [{"id": "b1", "code": "total = 0"}, ...] includes distractors
    correct_order = Column(JSON, nullable=False)  # ordered list of block ids, distractors excluded

    trials = relationship("ParsonsTrial", back_populates="problem")


class ParsonsTrial(Base):
    __tablename__ = "parsons_trials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    problem_id = Column(String, ForeignKey("parsons_problems.id"), nullable=False)
    submitted_order = Column(JSON, nullable=False)
    correct = Column(Boolean, nullable=True)
    completion_time_ms = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    participant = relationship("Participant", back_populates="parsons_trials")
    problem = relationship("ParsonsProblem", back_populates="trials")
