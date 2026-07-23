from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from app.models.models import UserRole


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    username: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: UserRole


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Department ────────────────────────────────────────────────────────────────
class DepartmentCreate(BaseModel):
    name: str
    code: str
    hod_name: Optional[str] = None
    established_year: Optional[int] = None
    total_seats: int = 60


class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    hod_name: Optional[str]
    established_year: Optional[int]
    total_seats: int

    class Config:
        from_attributes = True


# ── Faculty ───────────────────────────────────────────────────────────────────
class FacultyCreate(BaseModel):
    faculty_id: str
    name: str
    email: EmailStr
    department_id: int
    designation: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: int = 0


class FacultyOut(BaseModel):
    id: int
    faculty_id: str
    name: str
    email: str
    department_id: int
    designation: Optional[str]
    specialization: Optional[str]
    experience_years: int
    is_active: bool

    class Config:
        from_attributes = True


# ── Student ───────────────────────────────────────────────────────────────────
class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    department_id: int
    batch_year: int
    current_semester: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    admission_type: Optional[str] = None
    category: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    student_id: str
    name: str
    email: str
    department_id: int
    batch_year: int
    current_semester: int
    gender: Optional[str]
    phone: Optional[str]
    admission_type: Optional[str]
    category: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class StudentDetail(StudentOut):
    department: Optional[DepartmentOut]
    ml_features: Optional[Any]

    class Config:
        from_attributes = True


# ── Subject ───────────────────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    subject_code: str
    name: str
    department_id: int
    faculty_id: Optional[int] = None
    semester: int
    credits: int = 3
    subject_type: str = "theory"


class SubjectOut(BaseModel):
    id: int
    subject_code: str
    name: str
    department_id: int
    faculty_id: Optional[int]
    semester: int
    credits: int
    subject_type: str

    class Config:
        from_attributes = True


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    date: date
    status: str = "present"
    semester: int
    academic_year: str


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    date: date
    status: str
    semester: int
    academic_year: str

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    student_id: int
    student_name: str
    subject_name: str
    total_classes: int
    attended: int
    percentage: float
    status: str


# ── Marks ─────────────────────────────────────────────────────────────────────
class MarksCreate(BaseModel):
    student_id: int
    subject_id: int
    semester: int
    academic_year: str
    internal_marks: float
    external_marks: float
    total_marks: float
    grade: str
    grade_points: float
    is_pass: bool


class MarksOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    semester: int
    internal_marks: float
    external_marks: float
    total_marks: float
    grade: str
    grade_points: float
    is_pass: bool

    class Config:
        from_attributes = True


# ── Semester Result ───────────────────────────────────────────────────────────
class SemesterResultOut(BaseModel):
    id: int
    student_id: int
    semester: int
    academic_year: Optional[str]
    sgpa: float
    cgpa: float
    total_credits: int
    credits_earned: int
    backlogs: int
    is_pass: bool

    class Config:
        from_attributes = True


# ── Placement ─────────────────────────────────────────────────────────────────
class PlacementOut(BaseModel):
    id: int
    student_id: int
    is_placed: bool
    company_name: Optional[str]
    package_lpa: Optional[float]
    placement_type: Optional[str]
    internship_count: int
    certifications_count: int
    coding_score: float
    aptitude_score: float
    communication_score: float

    class Config:
        from_attributes = True


# ── Prediction ────────────────────────────────────────────────────────────────
class PredictionOut(BaseModel):
    id: int
    student_id: int
    prediction_type: str
    predicted_value: Optional[float]
    confidence: Optional[float]
    risk_level: Optional[str]
    shap_values: Optional[Any]
    feature_importance: Optional[Any]
    recommendations: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Analytics ─────────────────────────────────────────────────────────────────
class DepartmentAnalytics(BaseModel):
    department: str
    total_students: int
    avg_cgpa: float
    avg_attendance: float
    placement_rate: float
    at_risk_count: int


class InstitutionKPI(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    avg_cgpa: float
    avg_attendance: float
    placement_rate: float
    at_risk_students: int
    top_performers: int


# ── Pagination ────────────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


# ── Chatbot ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: Optional[List[str]] = None
