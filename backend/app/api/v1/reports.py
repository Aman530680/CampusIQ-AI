from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.report_service import ReportService
from app.api.deps import require_admin_or_principal, require_faculty_or_above

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/student/{student_id}/pdf")
def student_pdf_report(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    try:
        pdf_bytes = ReportService(db).generate_student_pdf(student_id)
        return Response(content=pdf_bytes, media_type="application/pdf",
                        headers={"Content-Disposition": f"attachment; filename=student_{student_id}_report.pdf"})
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/department/{dept_id}/excel")
def department_excel_report(
    dept_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    excel_bytes = ReportService(db).generate_department_excel(dept_id)
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename=department_{dept_id}_report.xlsx"})


@router.get("/institution/excel")
def institution_excel_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    excel_bytes = ReportService(db).generate_institution_excel()
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=institution_report.xlsx"})
