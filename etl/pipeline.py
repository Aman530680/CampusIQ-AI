import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
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
        _seed_faculty(db)
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
    existing_student_ids = {s[0] for s in db.query(Student.student_id).all()}
    existing_usernames = {u[0] for u in db.query(User.username).all()}
    loaded = 0
    batch_size = 1000
    default_hashed_pwd = hash_password("Student@123")

    for i, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), f"STU{i:05d}")).strip()
        if student_id in existing_student_ids:
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
        existing_student_ids.add(student_id)

        # Create user account for student
        username = student_id.lower()
        if username not in existing_usernames:
            user = User(
                email=email,
                username=username,
                hashed_password=default_hashed_pwd,
                role=UserRole.student,
            )
            db.add(user)
            existing_usernames.add(username)

        loaded += 1
        if loaded % batch_size == 0:
            db.commit()
            logger.info(f"Loaded {loaded} students...")

    db.commit()
    logger.info(f"Total students loaded: {loaded}")


def _load_placements(db: Session, df: pd.DataFrame, col_map: dict):
    student_cache = {s.student_id: s.id for s in db.query(Student).all()}
    existing_placements = {p[0] for p in db.query(Placement.student_id).all()}
    loaded = 0
    batch_size = 1000

    for _, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), "")).strip()
        sid = student_cache.get(student_id)
        if not sid:
            continue
        if sid in existing_placements:
            continue

        is_placed_col = col_map.get("is_placed")
        is_placed = False
        if is_placed_col:
            val = str(row.get(is_placed_col, "")).lower()
            is_placed = val in ["yes", "1", "true", "placed"]
        else:
            sem = int(_safe_float(row.get("semester", 6)))
            if sem >= 7:
                is_placed = bool(np.random.choice([True, False], p=[0.55, 0.45]))

        company = str(row.get(col_map.get("company", ""), "")).strip() or None
        package = _safe_float(row.get(col_map.get("package", ""), 0))
        if is_placed and not company:
            company = str(np.random.choice(["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Cognizant", "Accenture"]))
            package = float(np.random.uniform(10.0, 24.0) if company in ["Google", "Microsoft", "Amazon"] else np.random.uniform(3.6, 8.5))

        placement = Placement(
            student_id=sid,
            is_placed=is_placed,
            company_name=company,
            package_lpa=package,
            internship_count=int(np.random.choice([0, 1, 2], p=[0.75, 0.20, 0.05])),
            certifications_count=int(np.random.choice([0, 1, 2, 3], p=[0.60, 0.25, 0.12, 0.03])),
            coding_score=float(np.random.randint(45, 98)),
            aptitude_score=float(np.random.randint(50, 95)),
            communication_score=float(np.random.randint(50, 95)),
        )
        db.add(placement)
        existing_placements.add(sid)
        loaded += 1
        if loaded % batch_size == 0:
            db.commit()

    db.commit()
    logger.info(f"Loaded {loaded} placement records")


def _load_ml_features(db: Session, df: pd.DataFrame, col_map: dict):
    student_cache = {s.student_id: s.id for s in db.query(Student).all()}
    existing_ml_features = {m[0] for m in db.query(StudentMLFeatures.student_id).all()}
    loaded = 0
    batch_size = 1000

    for _, row in df.iterrows():
        student_id = str(row.get(col_map.get("student_id", ""), "")).strip()
        sid = student_cache.get(student_id)
        if not sid:
            continue
        if sid in existing_ml_features:
            continue

        cgpa = _safe_float(row.get(col_map.get("cgpa", ""), 0))
        if cgpa <= 0.01:
            cgpa = float(np.random.uniform(5.5, 9.8))

        attendance = _safe_float(row.get(col_map.get("attendance", ""), 0))
        if attendance <= 0.01:
            attendance = float(np.random.uniform(62.0, 98.0))

        backlogs_val = row.get(col_map.get("backlogs", ""), None)
        if backlogs_val is None or pd.isna(backlogs_val) or _safe_float(backlogs_val) <= 0.01:
            backlogs = int(np.random.choice([0, 1, 2, 3], p=[0.85, 0.10, 0.04, 0.01]))
        else:
            backlogs = int(_safe_float(backlogs_val))

        risk = _safe_float(row.get("risk_score", 0))
        if risk <= 0.01:
            risk = 0.85 if (attendance < 75 or cgpa < 6.0) else 0.45 if (attendance < 80 or cgpa < 7.0) else 0.12

        internships = int(_safe_float(row.get(col_map.get("internships", ""), 0)))
        if internships == 0:
            internships = int(np.random.choice([0, 1, 2], p=[0.75, 0.20, 0.05]))

        certs = int(_safe_float(row.get(col_map.get("certifications", ""), 0)))
        if certs == 0:
            certs = int(np.random.choice([0, 1, 2, 3], p=[0.60, 0.25, 0.12, 0.03]))

        coding = _safe_float(row.get(col_map.get("coding_score", ""), 0))
        if coding <= 0.01:
            coding = float(np.random.randint(45, 98))

        extra = _safe_float(row.get(col_map.get("extra_curricular", ""), 0))
        if extra <= 0.01:
            extra = float(np.random.randint(50, 95))

        att_trend = _safe_float(row.get("attendance_trend", 0))
        if att_trend == 0:
            att_trend = float(np.random.uniform(-5.0, 5.0))

        m_trend = _safe_float(row.get("marks_trend", 0))
        if m_trend == 0:
            m_trend = float(np.random.uniform(-0.5, 0.5))

        features = StudentMLFeatures(
            student_id=sid,
            avg_attendance=min(max(attendance, 0), 100),
            avg_internal_marks=_safe_float(row.get("avg_internal_marks", 0)) or _estimate_internal(cgpa),
            avg_external_marks=_safe_float(row.get("avg_external_marks", 0)) or _estimate_external(cgpa),
            current_cgpa=min(max(cgpa, 0), 10),
            total_backlogs=backlogs,
            subjects_failed=backlogs,
            attendance_trend=att_trend,
            marks_trend=m_trend,
            internship_count=internships,
            certifications_count=certs,
            coding_score=coding,
            extra_curricular_score=extra,
            risk_score=min(max(risk, 0), 1),
            placement_probability=_estimate_placement_prob(cgpa, attendance, backlogs),
        )
        db.add(features)
        existing_ml_features.add(sid)
        loaded += 1
        if loaded % batch_size == 0:
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


def _seed_faculty(db: Session):
    from app.models.models import Faculty, Department, User, UserRole
    from app.core.security import hash_password
    import random

    depts = db.query(Department).all()
    if not depts:
        return

    faculty_names = [
        "Dr. Rajesh Kumar", "Dr. Shalini Sen", "Dr. Amit Verma",
        "Dr. Pooja Hegde", "Dr. Vikram Seth", "Dr. Neha Sharma",
        "Dr. Sanjay Dutt", "Dr. Ritu Karhal", "Dr. Manoj Bajpayee",
        "Dr. Divya Dutta", "Dr. Anil Kapoor", "Dr. Madhuri Dixit",
        "Dr. Aamir Khan", "Dr. Kajol Devgan", "Dr. Salman Khan",
        "Dr. Rani Mukerji", "Dr. Shah Rukh Khan", "Dr. Preity Zinta",
        "Dr. Akshay Kumar", "Dr. Karisma Kapoor", "Dr. Hrithik Roshan",
        "Dr. Kareena Kapoor", "Dr. Saif Ali Khan", "Dr. Tabu Hashmi"
    ]

    designations = ["Professor", "Associate Professor", "Assistant Professor"]
    specializations = {
        "CSE": ["Machine Learning", "Cloud Computing", "Cyber Security", "Algorithms"],
        "IT": ["Web Technologies", "Database Systems", "Software Engineering", "Data Science"],
        "ECE": ["Embedded Systems", "VLSI Design", "Signal Processing", "Communication Systems"],
        "EEE": ["Power Systems", "Control Systems", "Electrical Machines", "Smart Grids"],
        "MECH": ["Thermodynamics", "Fluid Mechanics", "Robotics", "CAD/CAM"],
        "CIVIL": ["Structural Engineering", "Geotechnical Engineering", "Transportation Systems"],
        "AIML": ["Deep Learning", "Natural Language Processing", "Computer Vision"],
        "AIDS": ["Big Data Analytics", "Statistical Modeling", "Data Mining"]
    }

    # Clear existing faculty to prevent duplicates on rerun
    db.query(Faculty).delete()
    db.query(User).filter(User.role == UserRole.faculty).delete()
    db.commit()

    faculty_hashed_password = hash_password("Faculty@123")

    loaded = 0
    for i, dept in enumerate(depts):
        dept_code = dept.code.upper()
        dept_specs = specializations.get(dept_code, ["General Engineering"])
        
        # Seed 3 faculty members per department
        for j in range(3):
            fac_idx = i * 3 + j
            if fac_idx >= len(faculty_names):
                break
            name = faculty_names[fac_idx]
            username = f"faculty{fac_idx + 1}"
            email = f"{username}@campusiq.edu"
            
            # Create user account
            user = User(
                email=email,
                username=username,
                hashed_password=faculty_hashed_password,
                role=UserRole.faculty
            )
            db.add(user)
            db.flush()  # to get user.id

            designation = designations[j]
            spec = random.choice(dept_specs)
            exp = 15 if designation == "Professor" else 8 if designation == "Associate Professor" else 3
            
            faculty = Faculty(
                faculty_id=f"FAC{fac_idx + 1:04d}",
                user_id=user.id,
                name=name,
                email=email,
                department_id=dept.id,
                designation=designation,
                specialization=spec,
                experience_years=exp,
                is_active=True
            )
            db.add(faculty)
            loaded += 1

    db.commit()
    logger.info(f"Seeded {loaded} faculty members and accounts")


if __name__ == "__main__":
    import sys
    filepath = sys.argv[1] if len(sys.argv) > 1 else "./storage/uploads/CampusIQ_20000_Students_Dataset.xlsx"
    run_etl_pipeline(filepath)
