from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Marks, Student, UserRole
from app.schemas.schemas import MarksOut, MarksCreate
from app.repositories.student_repo import MarksRepository
from app.api.deps import require_faculty_or_above, get_current_user
from app.models.models import User

router = APIRouter(prefix="/marks", tags=["Marks"])


@router.get("/student/{student_id}", response_model=List[MarksOut])
def get_student_marks(
    student_id: int,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    repo = MarksRepository(db)
    return repo.get_student_marks(student_id, semester)


@router.post("/bulk", response_model=List[MarksOut])
def upload_marks(
    records: List[MarksCreate],
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    created = []
    for rec in records:
        m = Marks(**rec.model_dump())
        db.add(m)
        created.append(m)
    db.commit()
    for m in created:
        db.refresh(m)
    return created
