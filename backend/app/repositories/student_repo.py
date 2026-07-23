from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from app.repositories.base import BaseRepository
from app.models.models import Student, Attendance, Marks, SemesterResult, Placement, StudentMLFeatures


class StudentRepository(BaseRepository[Student]):
    def __init__(self, db: Session):
        super().__init__(Student, db)

    def get_by_student_id(self, student_id: str) -> Optional[Student]:
        return self.db.query(Student).filter(Student.student_id == student_id).first()

    def get_by_email(self, email: str) -> Optional[Student]:
        return self.db.query(Student).filter(Student.email == email).first()

    def get_with_details(self, student_id: int) -> Optional[Student]:
        return (
            self.db.query(Student)
            .options(
                joinedload(Student.department),
                joinedload(Student.ml_features),
                joinedload(Student.placement_record),
            )
            .filter(Student.id == student_id)
            .first()
        )

    def get_by_department(self, dept_id: int, skip: int = 0, limit: int = 100) -> List[Student]:
        return (
            self.db.query(Student)
            .filter(Student.department_id == dept_id, Student.is_active == True)
            .offset(skip).limit(limit).all()
        )

    def search(self, query: str, skip: int = 0, limit: int = 50) -> List[Student]:
        q = f"%{query}%"
        return (
            self.db.query(Student)
            .filter(
                Student.is_active == True,
                (Student.name.ilike(q) | Student.student_id.ilike(q) | Student.email.ilike(q))
            )
            .offset(skip).limit(limit).all()
        )

    def get_at_risk(self, risk_threshold: float = 0.6) -> List[Student]:
        return (
            self.db.query(Student)
            .join(StudentMLFeatures)
            .filter(StudentMLFeatures.risk_score >= risk_threshold)
            .all()
        )

    def count_by_department(self, dept_id: int) -> int:
        return self.db.query(Student).filter(Student.department_id == dept_id, Student.is_active == True).count()


class AttendanceRepository(BaseRepository[Attendance]):
    def __init__(self, db: Session):
        super().__init__(Attendance, db)

    def get_student_attendance_summary(self, student_id: int):
        from sqlalchemy import case
        return (
            self.db.query(
                Attendance.subject_id,
                func.count(Attendance.id).label("total"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("attended"),
            )
            .filter(Attendance.student_id == student_id)
            .group_by(Attendance.subject_id)
            .all()
        )

    def get_department_avg_attendance(self, dept_id: int) -> float:
        from sqlalchemy import case
        result = (
            self.db.query(
                func.avg(
                    func.coalesce(
                        func.sum(case((Attendance.status == "present", 1), else_=0)) * 100.0 /
                        func.nullif(func.count(Attendance.id), 0),
                        0
                    )
                )
            )
            .join(Student, Attendance.student_id == Student.id)
            .filter(Student.department_id == dept_id)
            .scalar()
        )
        return float(result or 0)


class MarksRepository(BaseRepository[Marks]):
    def __init__(self, db: Session):
        super().__init__(Marks, db)

    def get_student_marks(self, student_id: int, semester: Optional[int] = None) -> List[Marks]:
        q = self.db.query(Marks).filter(Marks.student_id == student_id)
        if semester:
            q = q.filter(Marks.semester == semester)
        return q.all()

    def get_avg_marks_by_department(self, dept_id: int) -> float:
        result = (
            self.db.query(func.avg(Marks.total_marks))
            .join(Student, Marks.student_id == Student.id)
            .filter(Student.department_id == dept_id)
            .scalar()
        )
        return float(result or 0)


class SemesterResultRepository(BaseRepository[SemesterResult]):
    def __init__(self, db: Session):
        super().__init__(SemesterResult, db)

    def get_student_results(self, student_id: int) -> List[SemesterResult]:
        return (
            self.db.query(SemesterResult)
            .filter(SemesterResult.student_id == student_id)
            .order_by(SemesterResult.semester)
            .all()
        )

    def get_latest_cgpa(self, student_id: int) -> float:
        result = (
            self.db.query(SemesterResult.cgpa)
            .filter(SemesterResult.student_id == student_id)
            .order_by(SemesterResult.semester.desc())
            .first()
        )
        return float(result[0]) if result else 0.0


class PlacementRepository(BaseRepository[Placement]):
    def __init__(self, db: Session):
        super().__init__(Placement, db)

    def get_by_student(self, student_id: int) -> Optional[Placement]:
        return self.db.query(Placement).filter(Placement.student_id == student_id).first()

    def get_placement_rate_by_department(self, dept_id: int) -> float:
        total = (
            self.db.query(func.count(Placement.id))
            .join(Student, Placement.student_id == Student.id)
            .filter(Student.department_id == dept_id)
            .scalar() or 0
        )
        placed = (
            self.db.query(func.count(Placement.id))
            .join(Student, Placement.student_id == Student.id)
            .filter(Student.department_id == dept_id, Placement.is_placed == True)
            .scalar() or 0
        )
        return round((placed / total * 100) if total > 0 else 0, 2)
