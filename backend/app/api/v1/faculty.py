from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Faculty
from app.schemas.schemas import FacultyOut, FacultyCreate
from app.api.deps import require_admin, require_faculty_or_above

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("", response_model=List[FacultyOut])
def list_faculty(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    q = db.query(Faculty).filter(Faculty.is_active == True)
    if department_id:
        q = q.filter(Faculty.department_id == department_id)
    return q.all()


@router.get("/{faculty_id}", response_model=FacultyOut)
def get_faculty(faculty_id: int, db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    f = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return f


@router.post("", response_model=FacultyOut)
def create_faculty(req: FacultyCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    f = Faculty(**req.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@router.put("/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: int, req: FacultyCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    f = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    return f
