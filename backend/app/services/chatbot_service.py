import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.models.models import Student, StudentMLFeatures, Department, Placement
from app.core.config import settings
from app.core.logging import logger


class ChatbotService:
    """
    Rule-based + SQL-driven chatbot with optional LLM enhancement.
    Falls back to structured query responses when LLM is unavailable.
    """

    def __init__(self, db: Session):
        self.db = db
        self._sessions: Dict[str, List[Dict]] = {}

    def chat(self, message: str, session_id: Optional[str] = None) -> Dict:
        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        self._sessions[session_id].append({"role": "user", "content": message})
        response = self._process_query(message.lower().strip())
        self._sessions[session_id].append({"role": "assistant", "content": response})

        return {"response": response, "session_id": session_id}

    def _process_query(self, query: str) -> str:
        if any(k in query for k in ["below 75", "low attendance", "attendance below"]):
            return self._low_attendance_students()
        if any(k in query for k in ["at risk", "likely to fail", "fail risk", "failing"]):
            return self._at_risk_students()
        if any(k in query for k in ["placement rate", "placement statistics", "placed students"]):
            return self._placement_stats()
        if any(k in query for k in ["top performer", "best student", "highest cgpa"]):
            return self._top_performers()
        if any(k in query for k in ["department performance", "department comparison"]):
            return self._department_comparison()
        if "recommend" in query and "stu" in query:
            student_id = self._extract_student_id(query)
            if student_id:
                return self._student_recommendations(student_id)
        if any(k in query for k in ["total student", "how many student"]):
            count = self.db.query(func.count(Student.id)).filter(Student.is_active == True).scalar()
            return f"There are currently {count} active students in the institution."
        if any(k in query for k in ["average cgpa", "avg cgpa", "mean cgpa"]):
            avg = self.db.query(func.avg(StudentMLFeatures.current_cgpa)).scalar() or 0
            return f"The institution-wide average CGPA is {round(float(avg), 2)}."
        if any(k in query for k in ["help", "what can you do", "capabilities"]):
            return self._help_message()
        return self._general_response(query)

    def _low_attendance_students(self) -> str:
        students = (
            self.db.query(Student, StudentMLFeatures)
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.avg_attendance < 75, Student.is_active == True)
            .order_by(StudentMLFeatures.avg_attendance)
            .limit(10)
            .all()
        )
        if not students:
            return "No students found with attendance below 75%."
        lines = [f"Students with attendance below 75% (showing top 10):"]
        for s, f in students:
            lines.append(f"• {s.name} ({s.student_id}) — {round(f.avg_attendance, 1)}%")
        total = (
            self.db.query(func.count(Student.id))
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.avg_attendance < 75)
            .scalar()
        )
        lines.append(f"\nTotal students below 75% attendance: {total}")
        return "\n".join(lines)

    def _at_risk_students(self) -> str:
        students = (
            self.db.query(Student, StudentMLFeatures)
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.risk_score >= 0.6, Student.is_active == True)
            .order_by(StudentMLFeatures.risk_score.desc())
            .limit(10)
            .all()
        )
        if not students:
            return "No high-risk students found currently."
        lines = ["High-risk students (risk score ≥ 60%):"]
        for s, f in students:
            lines.append(f"• {s.name} ({s.student_id}) — Risk: {round(f.risk_score * 100, 1)}%, CGPA: {round(f.current_cgpa, 2)}")
        return "\n".join(lines)

    def _placement_stats(self) -> str:
        total = self.db.query(func.count(Placement.id)).scalar() or 0
        placed = self.db.query(func.count(Placement.id)).filter(Placement.is_placed == True).scalar() or 0
        avg_pkg = self.db.query(func.avg(Placement.package_lpa)).filter(Placement.is_placed == True).scalar() or 0
        max_pkg = self.db.query(func.max(Placement.package_lpa)).filter(Placement.is_placed == True).scalar() or 0
        rate = round((placed / total * 100) if total > 0 else 0, 2)
        return (
            f"Placement Statistics:\n"
            f"• Total eligible: {total}\n"
            f"• Total placed: {placed}\n"
            f"• Placement rate: {rate}%\n"
            f"• Average package: {round(float(avg_pkg), 2)} LPA\n"
            f"• Highest package: {round(float(max_pkg), 2)} LPA"
        )

    def _top_performers(self) -> str:
        students = (
            self.db.query(Student, StudentMLFeatures)
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(Student.is_active == True)
            .order_by(StudentMLFeatures.current_cgpa.desc())
            .limit(10)
            .all()
        )
        lines = ["Top 10 students by CGPA:"]
        for i, (s, f) in enumerate(students, 1):
            lines.append(f"{i}. {s.name} ({s.student_id}) — CGPA: {round(f.current_cgpa, 2)}")
        return "\n".join(lines)

    def _department_comparison(self) -> str:
        depts = self.db.query(Department).all()
        lines = ["Department Performance Comparison:"]
        for dept in depts:
            student_ids = [s.id for s in self.db.query(Student).filter(Student.department_id == dept.id).all()]
            if not student_ids:
                continue
            avg_cgpa = self.db.query(func.avg(StudentMLFeatures.current_cgpa)).filter(
                StudentMLFeatures.student_id.in_(student_ids)
            ).scalar() or 0
            lines.append(f"• {dept.name}: Avg CGPA {round(float(avg_cgpa), 2)}, Students: {len(student_ids)}")
        return "\n".join(lines)

    def _student_recommendations(self, student_id: str) -> str:
        student = self.db.query(Student).filter(Student.student_id.ilike(f"%{student_id}%")).first()
        if not student:
            return f"Student '{student_id}' not found."
        features = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == student.id).first()
        if not features:
            return f"No data available for student {student_id}."
        from app.ml.predictor import generate_recommendations
        feature_dict = {
            "avg_attendance": features.avg_attendance,
            "avg_internal_marks": features.avg_internal_marks,
            "current_cgpa": features.current_cgpa,
            "total_backlogs": features.total_backlogs,
            "coding_score": features.coding_score,
            "internship_count": features.internship_count,
            "certifications_count": features.certifications_count,
        }
        recs = generate_recommendations(feature_dict, {"placement_probability": features.placement_probability})
        lines = [f"Recommendations for {student.name} ({student.student_id}):"]
        for i, r in enumerate(recs, 1):
            lines.append(f"{i}. {r}")
        return "\n".join(lines)

    def _extract_student_id(self, query: str) -> Optional[str]:
        import re
        match = re.search(r"stu\d+", query, re.IGNORECASE)
        return match.group(0) if match else None

    def _help_message(self) -> str:
        return (
            "I can help you with:\n"
            "• Show students below 75% attendance\n"
            "• Find at-risk or likely-to-fail students\n"
            "• Placement rate and statistics\n"
            "• Top performers by CGPA\n"
            "• Department performance comparison\n"
            "• Recommendations for a specific student (e.g., 'recommend improvements for STU00001')\n"
            "• Total student count\n"
            "• Average CGPA\n\n"
            "Just ask in natural language!"
        )

    def _general_response(self, query: str) -> str:
        return (
            "I understand you're asking about academic data. "
            "Try asking about attendance, CGPA, placements, at-risk students, or specific student recommendations. "
            "Type 'help' to see all available queries."
        )
