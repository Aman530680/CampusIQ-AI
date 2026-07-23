from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.prediction_service import PredictionService
from app.models.models import Prediction, StudentMLFeatures
from app.schemas.schemas import PredictionOut
from app.api.deps import get_current_user, require_faculty_or_above
from app.models.models import User, UserRole, Student
from typing import List

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("/student/{student_id}")
def predict_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return PredictionService(db).predict_for_student(student_id)


@router.get("/student/{student_id}/history", response_model=List[PredictionOut])
def prediction_history(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    return db.query(Prediction).filter(Prediction.student_id == student_id).order_by(Prediction.created_at.desc()).limit(10).all()


@router.get("/at-risk")
def at_risk_students(
    threshold: float = 0.6,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    from sqlalchemy import func
    rows = (
        db.query(Student, StudentMLFeatures)
        .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
        .filter(StudentMLFeatures.risk_score >= threshold, Student.is_active == True)
        .order_by(StudentMLFeatures.risk_score.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "student_id": s.student_id,
            "name": s.name,
            "risk_score": round(f.risk_score, 3),
            "risk_level": "high" if f.risk_score >= 0.6 else "medium",
            "cgpa": round(f.current_cgpa, 2),
            "attendance": round(f.avg_attendance, 1),
        }
        for s, f in rows
    ]
