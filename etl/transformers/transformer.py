import pandas as pd
import numpy as np
from typing import Tuple
from loguru import logger


def extract(filepath: str) -> pd.DataFrame:
    logger.info(f"Extracting data from {filepath}")
    df = pd.read_excel(filepath, engine="openpyxl")
    logger.info(f"Extracted {len(df)} rows, {len(df.columns)} columns")
    return df


def transform(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
    logger.info("Starting data transformation")
    original_count = len(df)

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

    # Drop duplicates
    df = df.drop_duplicates(subset=["student_id"] if "student_id" in df.columns else None)

    # Fill missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    cat_cols = df.select_dtypes(include=["object"]).columns
    df[cat_cols] = df[cat_cols].fillna("Unknown")

    # Validate ranges
    if "attendance_percentage" in df.columns:
        df["attendance_percentage"] = df["attendance_percentage"].clip(0, 100)
    if "cgpa" in df.columns:
        df["cgpa"] = df["cgpa"].clip(0, 10)

    # Derived features
    df = _create_derived_features(df)

    stats = {
        "original_rows": original_count,
        "cleaned_rows": len(df),
        "dropped_rows": original_count - len(df),
        "columns": list(df.columns),
    }
    logger.info(f"Transformation complete: {stats}")
    return df, stats


def _create_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    # Attendance trend (difference between recent and older semesters)
    sem_att_cols = [c for c in df.columns if "attendance" in c and "sem" in c]
    if len(sem_att_cols) >= 2:
        df["attendance_trend"] = df[sem_att_cols[-1]] - df[sem_att_cols[0]]
    elif "attendance_percentage" in df.columns:
        df["attendance_trend"] = 0.0

    # Marks trend
    sem_mark_cols = [c for c in df.columns if "sgpa" in c or ("marks" in c and "sem" in c)]
    if len(sem_mark_cols) >= 2:
        df["marks_trend"] = df[sem_mark_cols[-1]] - df[sem_mark_cols[0]]
    else:
        df["marks_trend"] = 0.0

    # Risk score (rule-based)
    risk = np.zeros(len(df))
    if "attendance_percentage" in df.columns:
        risk += np.where(df["attendance_percentage"] < 60, 0.4, np.where(df["attendance_percentage"] < 75, 0.2, 0))
    if "cgpa" in df.columns:
        risk += np.where(df["cgpa"] < 5, 0.4, np.where(df["cgpa"] < 6, 0.2, 0))
    if "backlogs" in df.columns:
        risk += np.where(df["backlogs"] > 3, 0.2, np.where(df["backlogs"] > 1, 0.1, 0))
    df["risk_score"] = np.clip(risk, 0, 1)

    return df


def _map_columns(df: pd.DataFrame) -> dict:
    """Map dataset columns to our schema fields."""
    col_map = {}
    cols = df.columns.tolist()

    def find(keywords):
        for kw in keywords:
            for c in cols:
                if kw in c:
                    return c
        return None

    col_map["student_id"] = find(["student_id", "roll_no", "enrollment"])
    col_map["name"] = find(["name", "student_name"])
    col_map["email"] = find(["email"])
    col_map["department"] = find(["department", "dept", "branch"])
    col_map["batch_year"] = find(["batch", "year_of_admission", "admission_year"])
    col_map["semester"] = find(["semester", "current_sem"])
    col_map["gender"] = find(["gender", "sex"])
    col_map["phone"] = find(["phone", "mobile", "contact"])
    col_map["cgpa"] = find(["cgpa", "cumulative_gpa"])
    col_map["attendance"] = find(["attendance_percentage", "attendance", "avg_attendance"])
    col_map["backlogs"] = find(["backlogs", "arrears", "backlog"])
    col_map["internships"] = find(["internship", "internships"])
    col_map["certifications"] = find(["certification", "certifications"])
    col_map["coding_score"] = find(["coding_score", "coding", "programming_score"])
    col_map["aptitude_score"] = find(["aptitude", "aptitude_score"])
    col_map["communication_score"] = find(["communication", "communication_score"])
    col_map["is_placed"] = find(["placed", "placement_status", "is_placed"])
    col_map["company"] = find(["company", "company_name"])
    col_map["package"] = find(["package", "ctc", "salary"])
    col_map["admission_type"] = find(["admission_type", "quota"])
    col_map["category"] = find(["category", "caste"])
    col_map["extra_curricular"] = find(["extra_curricular", "extracurricular", "activities"])

    return {k: v for k, v in col_map.items() if v is not None}
