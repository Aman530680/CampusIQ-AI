#!/usr/bin/env python3
"""
Setup script: Creates DB, runs migrations, seeds admin user, and optionally runs ETL.
Usage: python scripts/setup.py [--dataset path/to/dataset.xlsx]
"""
import sys
import os
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine, SessionLocal, Base
from app.models.models import User, UserRole, Department
from app.core.security import hash_password
from loguru import logger


def setup(dataset_path: str = None):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed admin
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(email="admin@campusiq.ai", username="admin", hashed_password=hash_password("Admin@123"), role=UserRole.admin))
            logger.info("Admin user created: admin / Admin@123")

        # Seed principal
        if not db.query(User).filter(User.username == "principal").first():
            db.add(User(email="principal@campusiq.ai", username="principal", hashed_password=hash_password("Principal@123"), role=UserRole.principal))
            logger.info("Principal user created: principal / Principal@123")

        # Seed faculty
        if not db.query(User).filter(User.username == "faculty1").first():
            db.add(User(email="faculty1@campusiq.ai", username="faculty1", hashed_password=hash_password("Faculty@123"), role=UserRole.faculty))
            logger.info("Faculty user created: faculty1 / Faculty@123")

        db.commit()

        # Run ETL if dataset provided
        if dataset_path and os.path.exists(dataset_path):
            logger.info(f"Running ETL pipeline on {dataset_path}")
            from etl.pipeline import run_etl_pipeline
            run_etl_pipeline(dataset_path)
        elif dataset_path:
            logger.warning(f"Dataset not found at {dataset_path}")

        logger.info("Setup complete!")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", help="Path to Excel dataset", default=None)
    args = parser.parse_args()
    setup(args.dataset)
