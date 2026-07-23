from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any, List
from app.models.models import (
    Student, Faculty, Department, Placement, StudentMLFeatures,
    Attendance, Marks, SemesterResult
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_institution_kpis(self) -> Dict[str, Any]:
        total_students = self.db.query(func.count(Student.id)).filter(Student.is_active == True).scalar() or 0
        total_faculty = self.db.query(func.count(Faculty.id)).filter(Faculty.is_active == True).scalar() or 0
        total_departments = self.db.query(func.count(Department.id)).scalar() or 0
        avg_cgpa = self.db.query(func.avg(StudentMLFeatures.current_cgpa)).scalar() or 0
        avg_attendance = self.db.query(func.avg(StudentMLFeatures.avg_attendance)).scalar() or 0
        total_placed = self.db.query(func.count(Placement.id)).filter(Placement.is_placed == True).scalar() or 0
        total_placement_records = self.db.query(func.count(Placement.id)).scalar() or 1
        placement_rate = round((total_placed / total_placement_records) * 100, 2)
        at_risk = self.db.query(func.count(StudentMLFeatures.id)).filter(StudentMLFeatures.risk_score >= 0.6).scalar() or 0
        top_performers = self.db.query(func.count(StudentMLFeatures.id)).filter(StudentMLFeatures.current_cgpa >= 8.5).scalar() or 0
        return {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_departments": total_departments,
            "avg_cgpa": round(float(avg_cgpa), 2),
            "avg_attendance": round(float(avg_attendance), 2),
            "placement_rate": placement_rate,
            "at_risk_students": at_risk,
            "top_performers": top_performers,
        }

    def get_department_analytics(self) -> List[Dict[str, Any]]:
        departments = self.db.query(Department).all()
        result = []
        for dept in departments:
            students = self.db.query(Student).filter(Student.department_id == dept.id, Student.is_active == True).all()
            student_ids = [s.id for s in students]
            if not student_ids:
                continue
            avg_cgpa = self.db.query(func.avg(StudentMLFeatures.current_cgpa)).filter(
                StudentMLFeatures.student_id.in_(student_ids)
            ).scalar() or 0
            avg_att = self.db.query(func.avg(StudentMLFeatures.avg_attendance)).filter(
                StudentMLFeatures.student_id.in_(student_ids)
            ).scalar() or 0
            placed = self.db.query(func.count(Placement.id)).filter(
                Placement.student_id.in_(student_ids), Placement.is_placed == True
            ).scalar() or 0
            at_risk = self.db.query(func.count(StudentMLFeatures.id)).filter(
                StudentMLFeatures.student_id.in_(student_ids), StudentMLFeatures.risk_score >= 0.6
            ).scalar() or 0
            result.append({
                "department": dept.name,
                "code": dept.code,
                "total_students": len(student_ids),
                "avg_cgpa": round(float(avg_cgpa), 2),
                "avg_attendance": round(float(avg_att), 2),
                "placement_rate": round((placed / len(student_ids)) * 100, 2) if student_ids else 0,
                "at_risk_count": at_risk,
            })
        return result

    def get_cgpa_distribution(self) -> List[Dict[str, Any]]:
        ranges = [
            ("< 5.0", 0, 5), ("5.0 - 6.0", 5, 6), ("6.0 - 7.0", 6, 7),
            ("7.0 - 8.0", 7, 8), ("8.0 - 9.0", 8, 9), ("9.0 - 10.0", 9, 10.1),
        ]
        result = []
        for label, low, high in ranges:
            count = self.db.query(func.count(StudentMLFeatures.id)).filter(
                StudentMLFeatures.current_cgpa >= low, StudentMLFeatures.current_cgpa < high
            ).scalar() or 0
            result.append({"range": label, "count": count})
        return result

    def get_attendance_trend(self) -> List[Dict[str, Any]]:
        from sqlalchemy import case, extract
        rows = (
            self.db.query(
                extract("month", Attendance.date).label("month"),
                func.count(Attendance.id).label("total"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
            )
            .group_by("month")
            .order_by("month")
            .all()
        )
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return [
            {
                "month": months[int(r.month) - 1],
                "attendance_pct": round((r.present / r.total * 100) if r.total > 0 else 0, 2),
            }
            for r in rows
        ]

    def get_placement_analytics(self) -> Dict[str, Any]:
        total = self.db.query(func.count(Placement.id)).scalar() or 0
        placed = self.db.query(func.count(Placement.id)).filter(Placement.is_placed == True).scalar() or 0
        avg_package = self.db.query(func.avg(Placement.package_lpa)).filter(Placement.is_placed == True).scalar() or 0
        max_package = self.db.query(func.max(Placement.package_lpa)).filter(Placement.is_placed == True).scalar() or 0
        by_dept = self.get_department_analytics()
        return {
            "total_eligible": total,
            "total_placed": placed,
            "placement_rate": round((placed / total * 100) if total > 0 else 0, 2),
            "avg_package_lpa": round(float(avg_package), 2),
            "max_package_lpa": round(float(max_package), 2),
            "by_department": [{"department": d["department"], "placement_rate": d["placement_rate"]} for d in by_dept],
        }

    def get_semester_performance(self) -> List[Dict[str, Any]]:
        rows = (
            self.db.query(
                SemesterResult.semester,
                func.avg(SemesterResult.sgpa).label("avg_sgpa"),
                func.avg(SemesterResult.cgpa).label("avg_cgpa"),
                func.avg(SemesterResult.backlogs).label("avg_backlogs"),
            )
            .group_by(SemesterResult.semester)
            .order_by(SemesterResult.semester)
            .all()
        )
        return [
            {
                "semester": r.semester,
                "avg_sgpa": round(float(r.avg_sgpa or 0), 2),
                "avg_cgpa": round(float(r.avg_cgpa or 0), 2),
                "avg_backlogs": round(float(r.avg_backlogs or 0), 2),
            }
            for r in rows
        ]
