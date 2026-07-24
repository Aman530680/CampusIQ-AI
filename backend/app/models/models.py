from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    principal = "principal"
    faculty = "faculty"
    student = "student"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    student_profile = relationship("Student", back_populates="user", uselist=False)
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False)


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    hod_name = Column(String(100))
    established_year = Column(Integer)
    total_seats = Column(Integer, default=60)
    students = relationship("Student", back_populates="department")
    faculty = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")


class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(String(20), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    designation = Column(String(100))
    specialization = Column(String(200))
    experience_years = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty")
    subjects = relationship("Subject", back_populates="faculty")


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(20), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    batch_year = Column(Integer)
    current_semester = Column(Integer)
    gender = Column(String(10))
    date_of_birth = Column(Date, nullable=True)
    phone = Column(String(20))
    address = Column(Text)
    guardian_name = Column(String(100))
    guardian_phone = Column(String(20))
    admission_type = Column(String(50))
    category = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student")
    marks_records = relationship("Marks", back_populates="student")
    semester_results = relationship("SemesterResult", back_populates="student")
    placement_record = relationship("Placement", back_populates="student", uselist=False)
    ml_features = relationship("StudentMLFeatures", back_populates="student", uselist=False)
    predictions = relationship("Prediction", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    semester = Column(Integer)
    credits = Column(Integer, default=3)
    subject_type = Column(String(50), default="theory")
    department = relationship("Department", back_populates="subjects")
    faculty = relationship("Faculty", back_populates="subjects")
    attendance_records = relationship("Attendance", back_populates="subject")
    marks_records = relationship("Marks", back_populates="subject")


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), default="present")
    semester = Column(Integer)
    academic_year = Column(String(20))
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")


class Marks(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester = Column(Integer)
    academic_year = Column(String(20))
    internal_marks = Column(Float, default=0)
    external_marks = Column(Float, default=0)
    total_marks = Column(Float, default=0)
    grade = Column(String(5))
    grade_points = Column(Float, default=0)
    is_pass = Column(Boolean, default=True)
    student = relationship("Student", back_populates="marks_records")
    subject = relationship("Subject", back_populates="marks_records")


class SemesterResult(Base):
    __tablename__ = "semester_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    academic_year = Column(String(20))
    sgpa = Column(Float, default=0)
    cgpa = Column(Float, default=0)
    total_credits = Column(Integer, default=0)
    credits_earned = Column(Integer, default=0)
    backlogs = Column(Integer, default=0)
    is_pass = Column(Boolean, default=True)
    student = relationship("Student", back_populates="semester_results")


class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    is_placed = Column(Boolean, default=False)
    company_name = Column(String(200))
    package_lpa = Column(Float)
    placement_type = Column(String(50))
    placement_date = Column(Date, nullable=True)
    internship_count = Column(Integer, default=0)
    certifications_count = Column(Integer, default=0)
    coding_score = Column(Float, default=0)
    aptitude_score = Column(Float, default=0)
    communication_score = Column(Float, default=0)
    student = relationship("Student", back_populates="placement_record")


class StudentMLFeatures(Base):
    __tablename__ = "student_ml_features"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    avg_attendance = Column(Float, default=0)
    avg_internal_marks = Column(Float, default=0)
    avg_external_marks = Column(Float, default=0)
    current_cgpa = Column(Float, default=0)
    total_backlogs = Column(Integer, default=0)
    subjects_failed = Column(Integer, default=0)
    attendance_trend = Column(Float, default=0)
    marks_trend = Column(Float, default=0)
    internship_count = Column(Integer, default=0)
    certifications_count = Column(Integer, default=0)
    coding_score = Column(Float, default=0)
    extra_curricular_score = Column(Float, default=0)
    risk_score = Column(Float, default=0)
    placement_probability = Column(Float, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    student = relationship("Student", back_populates="ml_features")


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    prediction_type = Column(String(50), nullable=False)
    predicted_value = Column(Float)
    confidence = Column(Float)
    risk_level = Column(String(20))
    shap_values = Column(JSON)
    feature_importance = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    student = relationship("Student", back_populates="predictions")


class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester = Column(Integer)
    assignment_number = Column(Integer)
    marks_obtained = Column(Float, default=0)
    max_marks = Column(Float, default=10)
    submitted = Column(Boolean, default=False)
    submission_date = Column(Date, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

