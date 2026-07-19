from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..auth import ADMIN_PASSWORD, create_session_token

router = APIRouter(tags=["admin-auth"])


class AdminLoginIn(BaseModel):
    password: str


class AdminLoginOut(BaseModel):
    token: str


@router.post("/api/admin/login", response_model=AdminLoginOut)
def admin_login(payload: AdminLoginIn):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password.")
    return AdminLoginOut(token=create_session_token())
