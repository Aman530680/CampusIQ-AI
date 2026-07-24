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
            df.to_excel(writer, sheet_name=dept.name[:30] if dept else "Department", index=False)
            ws = writer.sheets[dept.name[:30] if dept else "Department"]
            ws.set_column("A:A", 15)
            ws.set_column("B:B", 25)
            ws.set_column("C:I", 15)
        return buffer.getvalue()

    def generate_department_csv(self, dept_id: int) -> bytes:
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
        return df.to_csv(index=False).encode('utf-8')

    def generate_institution_excel(self) -> bytes:
        kpis = self.analytics.get_institution_kpis()
        dept_data = self.analytics.get_department_analytics()
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            pd.DataFrame([kpis]).to_excel(writer, sheet_name="KPIs", index=False)
            pd.DataFrame(dept_data).to_excel(writer, sheet_name="Departments", index=False)
        return buffer.getvalue()

    def generate_faculty_excel(self) -> bytes:
        from app.models.models import Faculty
        faculties = self.db.query(Faculty).filter(Faculty.is_active == True).all()
        rows = []
        for f in faculties:
            dept = self.db.query(Department).filter(Department.id == f.department_id).first()
            rows.append({
                "Faculty ID": f.faculty_id,
                "Name": f.name,
                "Email": f.email,
                "Department": dept.name if dept else "N/A",
                "Designation": f.designation,
                "Specialization": f.specialization,
                "Experience (Years)": f.experience_years
            })
        df = pd.DataFrame(rows)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            df.to_excel(writer, sheet_name="Faculty", index=False)
        return buffer.getvalue()

    def generate_faculty_csv(self) -> bytes:
        from app.models.models import Faculty
        faculties = self.db.query(Faculty).filter(Faculty.is_active == True).all()
        rows = []
        for f in faculties:
            dept = self.db.query(Department).filter(Department.id == f.department_id).first()
            rows.append({
                "Faculty ID": f.faculty_id,
                "Name": f.name,
                "Email": f.email,
                "Department": dept.name if dept else "N/A",
                "Designation": f.designation,
                "Specialization": f.specialization,
                "Experience (Years)": f.experience_years
            })
        df = pd.DataFrame(rows)
        return df.to_csv(index=False).encode('utf-8')

    def generate_placement_excel(self) -> bytes:
        students = self.db.query(Student).filter(Student.is_active == True).all()
        rows = []
        for s in students:
            p = self.db.query(Placement).filter(Placement.student_id == s.id).first()
            f = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            dept = self.db.query(Department).filter(Department.id == s.department_id).first()
            rows.append({
                "Student ID": s.student_id,
                "Name": s.name,
                "Department": dept.name if dept else "N/A",
                "CGPA": round(f.current_cgpa, 2) if f else 0,
                "Placed": "Yes" if p and p.is_placed else "No",
                "Company": p.company_name if p and p.is_placed else "N/A",
                "Package (LPA)": p.package_lpa if p and p.is_placed else 0,
                "Internships": p.internship_count if p else 0,
                "Certifications": p.certifications_count if p else 0,
                "Coding Score": p.coding_score if p else 0,
                "Placement Probability %": round(f.placement_probability * 100, 1) if f else 0
            })
        df = pd.DataFrame(rows)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            df.to_excel(writer, sheet_name="Placements", index=False)
        return buffer.getvalue()

    def generate_placement_csv(self) -> bytes:
        students = self.db.query(Student).filter(Student.is_active == True).all()
        rows = []
        for s in students:
            p = self.db.query(Placement).filter(Placement.student_id == s.id).first()
            f = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            dept = self.db.query(Department).filter(Department.id == s.department_id).first()
            rows.append({
                "Student ID": s.student_id,
                "Name": s.name,
                "Department": dept.name if dept else "N/A",
                "CGPA": round(f.current_cgpa, 2) if f else 0,
                "Placed": "Yes" if p and p.is_placed else "No",
                "Company": p.company_name if p and p.is_placed else "N/A",
                "Package (LPA)": p.package_lpa if p and p.is_placed else 0,
                "Internships": p.internship_count if p else 0,
                "Certifications": p.certifications_count if p else 0,
                "Coding Score": p.coding_score if p else 0,
                "Placement Probability %": round(f.placement_probability * 100, 1) if f else 0
            })
        df = pd.DataFrame(rows)
        return df.to_csv(index=False).encode('utf-8')

    def generate_semester_excel(self, semester: int) -> bytes:
        students = self.db.query(Student).filter(Student.current_semester == semester, Student.is_active == True).all()
        rows = []
        for s in students:
            f = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            dept = self.db.query(Department).filter(Department.id == s.department_id).first()
            res = self.db.query(SemesterResult).filter(SemesterResult.student_id == s.id, SemesterResult.semester == semester).first()
            rows.append({
                "Student ID": s.student_id,
                "Name": s.name,
                "Department": dept.name if dept else "N/A",
                "CGPA": round(f.current_cgpa, 2) if f else 0,
                "SGPA": res.sgpa if res else 0.0,
                "Backlogs": res.backlogs if res else 0,
                "Status": "PASS" if (not res or res.is_pass) else "FAIL"
            })
        df = pd.DataFrame(rows)
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
            df.to_excel(writer, sheet_name=f"Semester {semester}", index=False)
        return buffer.getvalue()

    def generate_semester_csv(self, semester: int) -> bytes:
        students = self.db.query(Student).filter(Student.current_semester == semester, Student.is_active == True).all()
        rows = []
        for s in students:
            f = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            dept = self.db.query(Department).filter(Department.id == s.department_id).first()
            res = self.db.query(SemesterResult).filter(SemesterResult.student_id == s.id, SemesterResult.semester == semester).first()
            rows.append({
                "Student ID": s.student_id,
                "Name": s.name,
                "Department": dept.name if dept else "N/A",
                "CGPA": round(f.current_cgpa, 2) if f else 0,
                "SGPA": res.sgpa if res else 0.0,
                "Backlogs": res.backlogs if res else 0,
                "Status": "PASS" if (not res or res.is_pass) else "FAIL"
            })
        df = pd.DataFrame(rows)
        return df.to_csv(index=False).encode('utf-8')

    def generate_student_csv(self, student_id: int) -> bytes:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student not found")
        features = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == student_id).first()
        placement = self.db.query(Placement).filter(Placement.student_id == student_id).first()
        
        row = {
            "Student ID": student.student_id,
            "Name": student.name,
            "Email": student.email,
            "Department": student.department.name if student.department else "N/A",
            "Batch": student.batch_year,
            "Semester": student.current_semester,
            "CGPA": round(features.current_cgpa, 2) if features else 0,
            "Attendance %": round(features.avg_attendance, 1) if features else 0,
            "Backlogs": features.total_backlogs if features else 0,
            "Risk Score": round(features.risk_score, 2) if features else 0,
            "Placement Probability %": round(features.placement_probability * 100, 1) if features else 0,
            "Placed": "Yes" if placement and placement.is_placed else "No",
            "Company": placement.company_name if placement and placement.is_placed else "N/A",
            "Package (LPA)": placement.package_lpa if placement and placement.is_placed else 0
        }
        df = pd.DataFrame([row])
        return df.to_csv(index=False).encode('utf-8')

