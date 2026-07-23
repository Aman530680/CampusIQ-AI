from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
import shutil, os
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/import-dataset")
async def import_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    os.makedirs(settings.UPLOADS_PATH, exist_ok=True)
    dest = os.path.join(settings.UPLOADS_PATH, "CampusIQ_20000_Students_Dataset.xlsx")
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    background_tasks.add_task(_run_etl, dest)
    return {"message": "Dataset uploaded. ETL pipeline started in background.", "file": dest}


def _run_etl(filepath: str):
    from etl.pipeline import run_etl_pipeline
    try:
        run_etl_pipeline(filepath)
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"ETL pipeline failed: {e}")


@router.post("/train-models")
def train_models(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    background_tasks.add_task(_run_training, db)
    return {"message": "Model training started in background."}


def _run_training(db: Session):
    from app.ml.predictor import train_cgpa_predictor, train_risk_classifier, train_placement_predictor
    from app.models.models import StudentMLFeatures, Placement
    import pandas as pd
    from app.core.logging import logger
    try:
        features = db.query(StudentMLFeatures).all()
        if len(features) < 100:
            logger.warning("Not enough data to train models")
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
        train_cgpa_predictor(df)
        train_risk_classifier(df)
        train_placement_predictor(df)
        logger.info("All models trained successfully")
    except Exception as e:
        logger.error(f"Training failed: {e}")
