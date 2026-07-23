import io
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib import colors
from sqlalchemy.orm import Session
from app.models.models import Student, Department, SemesterResult, Placement, StudentMLFeatures
from app.services.analytics_service import AnalyticsService


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.analytics = AnalyticsService(db)

    def generate_student_pdf(self, student_id: int) -> bytes:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("CampusIQ AI - Student Report", styles["Title"]))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Student: {student.name} ({student.student_id})", styles["Heading2"]))
        elements.append(Spacer(1, 8))

        features = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == student_id).first()
        if features:
            data = [
                ["Metric", "Value"],
                ["CGPA", str(round(features.current_cgpa, 2))],
                ["Avg Attendance", f"{round(features.avg_attendance, 1)}%"],
                ["Risk Level", "High" if features.risk_score >= 0.6 else "Medium" if features.risk_score >= 0.3 else "Low"],
                ["Placement Probability", f"{round(features.placement_probability * 100, 1)}%"],
                ["Total Backlogs", str(features.total_backlogs)],
                ["Internships", str(features.internship_count)],
                ["Certifications", str(features.certifications_count)],
            ]
            table = Table(data, colWidths=[200, 200])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4ff")]),
            ]))
            elements.append(table)

        doc.build(elements)
        return buffer.getvalue()

    def generate_department_excel(self, dept_id: int) -> bytes:
        dept = self.db.query(Department).filter(Department.id == dept_id).first()
        students = self.db.query(Student).filter(Student.department_id == dept_id, Student.is_active == True).all()
        rows = []
        for s in students:
            f = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            p = self.db.query(Placement).filter(Placement.student_id == s.id).first()
            rows.append({
                "Student ID": s.student_id,
                "Name": s.name,
                "Semester": s.current_semester,
                "CGPA": round(f.current_cgpa, 2) if f else 0,
                "Attendance %": round(f.avg_attendance, 1) if f else 0,
                "Risk Score": round(f.risk_score, 2) if f else 0,
                "Placed": "Yes" if p and p.is_placed else "No",
                "Company": p.company_name if p and p.is_placed else "",
                "Package (LPA)": p.package_lpa if p and p.is_placed else 0,
            })
        df = pd.DataFrame(rows)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            df.to_excel(writer, sheet_name=dept.name if dept else "Department", index=False)
            ws = writer.sheets[dept.name if dept else "Department"]
            ws.set_column("A:A", 15)
            ws.set_column("B:B", 25)
            ws.set_column("C:I", 15)
        return buffer.getvalue()

    def generate_institution_excel(self) -> bytes:
        kpis = self.analytics.get_institution_kpis()
        dept_data = self.analytics.get_department_analytics()
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            pd.DataFrame([kpis]).to_excel(writer, sheet_name="KPIs", index=False)
            pd.DataFrame(dept_data).to_excel(writer, sheet_name="Departments", index=False)
        return buffer.getvalue()
