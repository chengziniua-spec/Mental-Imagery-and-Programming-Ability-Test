from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/participants", tags=["imagery"])


@router.post("/{participant_id}/imagery-responses", response_model=list[schemas.ImageryResponseOut])
def submit_imagery_responses(
    participant_id: str, payload: schemas.ImageryResponseBulkIn, db: Session = Depends(get_db)
):
    participant = db.get(models.Participant, participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found.")

    records = [
        models.ImageryResponse(
            participant_id=participant_id,
            dimension=item.dimension,
            item_id=item.item_id,
            value=item.value,
        )
        for item in payload.responses
    ]
    db.add_all(records)
    db.commit()
    for record in records:
        db.refresh(record)
    return records
