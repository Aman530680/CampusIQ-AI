import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from loguru import logger
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.models.models import (
    Department, Student, Faculty, Subject, Attendance,
    Marks, SemesterResult, Placement, StudentMLFeatures, User, UserRole
)
from app.core.security import hash_password
from etl.transformers.transformer import extract, transform, _map_columns


def run_etl_pipeline(filepath: str):
    logger.info("=" * 60)
    logger.info("CampusIQ ETL Pipeline Starting")
    logger.info("=" * 60)

    Base.metadata.create_all(bind=engine)
    df, stats = transform(extract(filepath))
    col_map = _map_columns(df)
    logger.info(f"Column mapping: {col_map}")

    db = SessionLocal()
    try:
        _load_departments(db, df, col_map)
        _load_students(db, df, col_map)
        _load_placements(db, df, col_map)
        _load_ml_features(db, df, col_map)
        logger.info("ETL Pipeline completed successfully")
    except Exception as e:
        db.rollback()
        logger.error(f"ETL Pipeline failed: {e}")
        raise
    finally:
        db.close()


def _load_departments(db: Session, df: pd.DataFrame, col_map: dict):
    dept_col = col_map.get("department")
    if not dept_col:
        _create_default_departments(db)
        return

    departments = df[dept_col].dropna().unique()
    dept_codes = {
        "Computer Science": "CSE", "Information Technology": "IT",
        "Electronics": "ECE", "Mechanical": "MECH", "Civil": "CIVIL",
        "Electrical": "EEE", "Chemical": "CHEM", "Biotechnology": "BT",
        "MBA": "MBA", "MCA": "MCA",
    }
    for dept_name in departments:
        dept_name = str(dept_name).strip()
        if not db.query(Department).filter(Department.name == dept_name).first():
            code = dept_codes.get(dept_name, dept_name[:6].upper().replace(" ", ""))
            dept = Department(name=dept_name, code=code, total_seats=60)
            db.add(dept)
    db.commit()
    logger.info(f"Loaded {len(departments)} departments")


def _create_default_departments(db: Session):
    defaults = [
        ("Computer Science Engineering", "CSE"), ("Information Technology", "IT"),
        ("Electronics & Communication", "ECE"), ("Mechanical Engineering", "MECH"),
        ("Civil Engineering", "CIVIL"), ("Electrical Engineering", "EEE"),
    ]
    for name, code in defaults:
        if not db.query(Department).filter(Department.code == code).first():
            db.add(Department(name=name, code=code, total_seats=60))
    db.commit()


def _load_students(db: Session, df: pd.DataFrame, col_map: dict):
    dept_cache = {d.name: d.id for d in db.query(Department).all()}
    loaded = 0
    batch_size = 500

    for i, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), f"STU{i:05d}")).strip()
        if db.query(Student).filter(Student.student_id == student_id).first():
            continue

        dept_name = str(row.get(col_map.get("department", ""), "")).strip()
        dept_id = dept_cache.get(dept_name, list(dept_cache.values())[0] if dept_cache else 1)

        name = str(row.get(col_map.get("name", ""), f"Student {i}")).strip()
        email_col = col_map.get("email")
        email = str(row.get(email_col, "")).strip() if email_col else f"{student_id.lower()}@campusiq.edu"
        if not email or email == "nan":
            email = f"{student_id.lower()}@campusiq.edu"

        batch_col = col_map.get("batch_year")
        batch_year = int(row.get(batch_col, 2021)) if batch_col else 2021

        sem_col = col_map.get("semester")
        semester = int(row.get(sem_col, 6)) if sem_col else 6

        student = Student(
            student_id=student_id,
            name=name,
            email=email,
            department_id=dept_id,
            batch_year=batch_year,
            current_semester=min(max(semester, 1), 8),
            gender=str(row.get(col_map.get("gender", ""), "")).strip() or None,
            phone=str(row.get(col_map.get("phone", ""), "")).strip() or None,
            admission_type=str(row.get(col_map.get("admission_type", ""), "")).strip() or None,
            category=str(row.get(col_map.get("category", ""), "")).strip() or None,
        )
        db.add(student)

        # Create user account for student
        if not db.query(User).filter(User.username == student_id.lower()).first():
            user = User(
                email=email,
                username=student_id.lower(),
                hashed_password=hash_password("Student@123"),
                role=UserRole.student,
            )
            db.add(user)

        loaded += 1
        if loaded % batch_size == 0:
            db.commit()
            logger.info(f"Loaded {loaded} students...")

    db.commit()
    logger.info(f"Total students loaded: {loaded}")


def _load_placements(db: Session, df: pd.DataFrame, col_map: dict):
    student_cache = {s.student_id: s.id for s in db.query(Student).all()}
    loaded = 0

    for _, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), "")).strip()
        sid = student_cache.get(student_id)
        if not sid:
            continue
        if db.query(Placement).filter(Placement.student_id == sid).first():
            continue

        is_placed_col = col_map.get("is_placed")
        is_placed = False
        if is_placed_col:
            val = str(row.get(is_placed_col, "")).lower()
            is_placed = val in ["yes", "1", "true", "placed"]

        placement = Placement(
            student_id=sid,
            is_placed=is_placed,
            company_name=str(row.get(col_map.get("company", ""), "")).strip() or None,
            package_lpa=_safe_float(row.get(col_map.get("package", ""), 0)),
            internship_count=int(_safe_float(row.get(col_map.get("internships", ""), 0))),
            certifications_count=int(_safe_float(row.get(col_map.get("certifications", ""), 0))),
            coding_score=_safe_float(row.get(col_map.get("coding_score", ""), 0)),
            aptitude_score=_safe_float(row.get(col_map.get("aptitude_score", ""), 0)),
            communication_score=_safe_float(row.get(col_map.get("communication_score", ""), 0)),
        )
        db.add(placement)
        loaded += 1
        if loaded % 500 == 0:
            db.commit()

    db.commit()
    logger.info(f"Loaded {loaded} placement records")


def _load_ml_features(db: Session, df: pd.DataFrame, col_map: dict):
    student_cache = {s.student_id: s.id for s in db.query(Student).all()}
    loaded = 0

    for _, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), "")).strip()
        sid = student_cache.get(student_id)
        if not sid:
            continue
        if db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == sid).first():
            continue

        cgpa = _safe_float(row.get(col_map.get("cgpa", ""), 0))
        attendance = _safe_float(row.get(col_map.get("attendance", ""), 0))
        backlogs = int(_safe_float(row.get(col_map.get("backlogs", ""), 0)))
        risk = _safe_float(row.get("risk_score", 0))

        features = StudentMLFeatures(
            student_id=sid,
            avg_attendance=min(max(attendance, 0), 100),
            avg_internal_marks=_safe_float(row.get("avg_internal_marks", 0)) or _estimate_internal(cgpa),
            avg_external_marks=_safe_float(row.get("avg_external_marks", 0)) or _estimate_external(cgpa),
            current_cgpa=min(max(cgpa, 0), 10),
            total_backlogs=backlogs,
            subjects_failed=backlogs,
            attendance_trend=_safe_float(row.get("attendance_trend", 0)),
            marks_trend=_safe_float(row.get("marks_trend", 0)),
            internship_count=int(_safe_float(row.get(col_map.get("internships", ""), 0))),
            certifications_count=int(_safe_float(row.get(col_map.get("certifications", ""), 0))),
            coding_score=_safe_float(row.get(col_map.get("coding_score", ""), 0)),
            extra_curricular_score=_safe_float(row.get(col_map.get("extra_curricular", ""), 0)),
            risk_score=min(max(risk, 0), 1),
            placement_probability=_estimate_placement_prob(cgpa, attendance, backlogs),
        )
        db.add(features)
        loaded += 1
        if loaded % 500 == 0:
            db.commit()

    db.commit()
    logger.info(f"Loaded {loaded} ML feature records")


def _safe_float(val, default=0.0) -> float:
    try:
        v = float(val)
        return v if not np.isnan(v) else default
    except (ValueError, TypeError):
        return default


def _estimate_internal(cgpa: float) -> float:
    return round(cgpa * 4.5 + np.random.normal(0, 2), 1)


def _estimate_external(cgpa: float) -> float:
    return round(cgpa * 6.5 + np.random.normal(0, 3), 1)


def _estimate_placement_prob(cgpa: float, attendance: float, backlogs: int) -> float:
    prob = (cgpa / 10) * 0.5 + (attendance / 100) * 0.3 - (backlogs * 0.05)
    return round(min(max(prob, 0), 1), 3)


if __name__ == "__main__":
    import sys
    filepath = sys.argv[1] if len(sys.argv) > 1 else "./storage/uploads/CampusIQ_20000_Students_Dataset.xlsx"
    run_etl_pipeline(filepath)
