#!/usr/bin/env python3
"""
Train all ML models using data from the database.
Usage: python scripts/train_models.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
from app.core.database import SessionLocal
from app.models.models import StudentMLFeatures, Placement
from app.ml.predictor import train_cgpa_predictor, train_risk_classifier, train_placement_predictor
from loguru import logger


def train():
    db = SessionLocal()
    try:
        features = db.query(StudentMLFeatures).all()
        if len(features) < 50:
            logger.error(f"Insufficient data: only {len(features)} records. Need at least 50.")
            return

        rows = []
        for f in features:
            p = db.query(Placement).filter(Placement.student_id == f.student_id).first()
            rows.append({
                "avg_attendance": f.avg_attendance,
                "avg_internal_marks": f.avg_internal_marks,
                "avg_external_marks": f.avg_external_marks,
                "current_cgpa": f.current_cgpa,
                "total_backlogs": f.total_backlogs,
                "subjects_failed": f.subjects_failed,
                "attendance_trend": f.attendance_trend,
                "marks_trend": f.marks_trend,
                "internship_count": f.internship_count,
                "certifications_count": f.certifications_count,
                "coding_score": f.coding_score,
                "extra_curricular_score": f.extra_curricular_score,
                "risk_score": f.risk_score,
                "is_placed": 1 if p and p.is_placed else 0,
            })

        df = pd.DataFrame(rows)
        logger.info(f"Training on {len(df)} records")

        m1 = train_cgpa_predictor(df)
        logger.info(f"CGPA Predictor: {m1}")

        m2 = train_risk_classifier(df)
        logger.info(f"Risk Classifier: {m2}")

        m3 = train_placement_predictor(df)
        logger.info(f"Placement Predictor: {m3}")

        logger.info("All models trained and saved successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    train()
