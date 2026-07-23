from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Attendance, Student, Subject
from app.schemas.schemas import AttendanceOut, AttendanceCreate, AttendanceSummary
from app.repositories.student_repo import AttendanceRepository
from app.api.deps import require_faculty_or_above, get_current_user
from app.models.models import User, UserRole
from sqlalchemy import func, case

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/student/{student_id}", response_model=List[AttendanceSummary])
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

    rows = (
        db.query(
            Subject.name.label("subject_name"),
            func.count(Attendance.id).label("total"),
            func.sum(case((Attendance.status == "present", 1), else_=0)).label("attended"),
        )
        .join(Attendance, Attendance.subject_id == Subject.id)
        .filter(Attendance.student_id == student_id)
        .group_by(Subject.id, Subject.name)
        .all()
    )

    student = db.query(Student).filter(Student.id == student_id).first()
    result = []
    for r in rows:
        pct = round((r.attended / r.total * 100) if r.total > 0 else 0, 2)
        result.append(AttendanceSummary(
            student_id=student_id,
            student_name=student.name if student else "",
            subject_name=r.subject_name,
            total_classes=r.total,
            attended=r.attended,
            percentage=pct,
            status="safe" if pct >= 75 else "warning" if pct >= 65 else "critical",
        ))
    return result


@router.post("/bulk", response_model=List[AttendanceOut])
def upload_attendance(
    records: List[AttendanceCreate],
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    created = []
    for rec in records:
        att = Attendance(**rec.model_dump())
        db.add(att)
        created.append(att)
    db.commit()
    for a in created:
        db.refresh(a)
    return created


@router.get("/department/{dept_id}/summary")
def department_attendance_summary(
    dept_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    from app.repositories.student_repo import AttendanceRepository
    repo = AttendanceRepository(db)
    avg = repo.get_department_avg_attendance(dept_id)
    return {"department_id": dept_id, "avg_attendance": round(avg, 2)}
