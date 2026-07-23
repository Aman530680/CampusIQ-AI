from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.api.deps import require_admin_or_principal, require_faculty_or_above

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def institution_kpis(db: Session = Depends(get_db), _=Depends(require_admin_or_principal)):
    return AnalyticsService(db).get_institution_kpis()


@router.get("/departments")
def department_analytics(db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    return AnalyticsService(db).get_department_analytics()


@router.get("/cgpa-distribution")
def cgpa_distribution(db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    return AnalyticsService(db).get_cgpa_distribution()


@router.get("/attendance-trend")
def attendance_trend(db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    return AnalyticsService(db).get_attendance_trend()


@router.get("/placement")
def placement_analytics(db: Session = Depends(get_db), _=Depends(require_admin_or_principal)):
    return AnalyticsService(db).get_placement_analytics()


@router.get("/semester-performance")
def semester_performance(db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    return AnalyticsService(db).get_semester_performance()
