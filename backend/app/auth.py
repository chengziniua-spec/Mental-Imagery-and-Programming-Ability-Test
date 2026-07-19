import os
import secrets

from fastapi import Header, HTTPException

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme-dev-password")

if ADMIN_PASSWORD == "changeme-dev-password":
    print(
        "[auth] WARNING: ADMIN_PASSWORD env var not set -- using the insecure default dev password. "
        "Set ADMIN_PASSWORD before deploying anywhere reachable by others."
    )

# In-memory session store: simple and sufficient for a small research tool.
# Sessions are lost on server restart (admins just log in again) -- no
# persistence needed for this threat model.
_valid_tokens: set[str] = set()


def create_session_token() -> str:
    token = secrets.token_urlsafe(32)
    _valid_tokens.add(token)
    return token


def require_admin_auth(authorization: str | None = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin credentials.")
    token = authorization.removeprefix("Bearer ")
    if token not in _valid_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session.")
