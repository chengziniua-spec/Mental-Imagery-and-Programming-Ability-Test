import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .data.seed_tasks import SEED_TASKS
from .data.seed_parsons_problems import SEED_PARSONS_PROBLEMS
from .database import Base, SessionLocal, engine
from .routers import admin, admin_auth, export, imagery, imagery_tasks, parsons, participants, tasks, trials


def _sync_seed_rows(db, model, seed_rows):
    """Insert new seed rows and update existing ones in place, keyed by id.

    Content in seed_tasks.py / seed_parsons_problems.py gets edited over time
    (wording fixes, new items); a plain "seed if empty" check would leave a
    database that was already seeded once permanently stuck on stale content.
    Updating in place (rather than delete+recreate) keeps existing trial rows'
    foreign keys valid.
    """
    existing = {row.id: row for row in db.query(model).all()}
    for seed in seed_rows:
        row = existing.get(seed["id"])
        if row is None:
            db.add(model(**seed))
        else:
            for key, value in seed.items():
                setattr(row, key, value)
    db.commit()


def sync_seed_tasks():
    db = SessionLocal()
    try:
        _sync_seed_rows(db, models.TracingTask, SEED_TASKS)
        _sync_seed_rows(db, models.ParsonsProblem, SEED_PARSONS_PROBLEMS)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    sync_seed_tasks()
    yield


app = FastAPI(title="Mental Imagery & Code Tracing Experiment API", lifespan=lifespan)

# CORS_ORIGINS is a comma-separated list, e.g. "https://your-app.vercel.app,http://localhost:5173"
_default_origins = "http://localhost:5173"
allow_origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(participants.router)
app.include_router(imagery.router)
app.include_router(tasks.router)
app.include_router(trials.router)
app.include_router(export.router)
app.include_router(admin.router)
app.include_router(admin_auth.router)
app.include_router(imagery_tasks.router)
app.include_router(parsons.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
