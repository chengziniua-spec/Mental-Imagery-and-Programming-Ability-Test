import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .data.seed_tasks import SEED_TASKS
from .data.seed_parsons_problems import SEED_PARSONS_PROBLEMS
from .database import Base, SessionLocal, engine
from .routers import admin, admin_auth, export, imagery, imagery_tasks, parsons, participants, tasks, trials


def seed_tasks_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.TracingTask).count() == 0:
            db.add_all(models.TracingTask(**task) for task in SEED_TASKS)
            db.commit()
        if db.query(models.ParsonsProblem).count() == 0:
            db.add_all(models.ParsonsProblem(**problem) for problem in SEED_PARSONS_PROBLEMS)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_tasks_if_empty()
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
