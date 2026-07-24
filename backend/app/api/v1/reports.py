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


@router.get("/student/{student_id}/csv")
def student_csv_report(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    try:
         csv_bytes = ReportService(db).generate_student_csv(student_id)
         return Response(content=csv_bytes, media_type="text/csv",
                         headers={"Content-Disposition": f"attachment; filename=student_{student_id}_report.csv"})
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


@router.get("/department/{dept_id}/csv")
def department_csv_report(
    dept_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    csv_bytes = ReportService(db).generate_department_csv(dept_id)
    return Response(content=csv_bytes, media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=department_{dept_id}_report.csv"})


@router.get("/faculty/excel")
def faculty_excel_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    excel_bytes = ReportService(db).generate_faculty_excel()
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=faculty_report.xlsx"})


@router.get("/faculty/csv")
def faculty_csv_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    csv_bytes = ReportService(db).generate_faculty_csv()
    return Response(content=csv_bytes, media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=faculty_report.csv"})


@router.get("/placement/excel")
def placement_excel_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    excel_bytes = ReportService(db).generate_placement_excel()
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=placement_report.xlsx"})


@router.get("/placement/csv")
def placement_csv_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    csv_bytes = ReportService(db).generate_placement_csv()
    return Response(content=csv_bytes, media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=placement_report.csv"})


@router.get("/semester/{semester}/excel")
def semester_excel_report(
    semester: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    excel_bytes = ReportService(db).generate_semester_excel(semester)
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename=semester_{semester}_report.xlsx"})


@router.get("/semester/{semester}/csv")
def semester_csv_report(
    semester: int,
    db: Session = Depends(get_db),
    _=Depends(require_faculty_or_above),
):
    csv_bytes = ReportService(db).generate_semester_csv(semester)
    return Response(content=csv_bytes, media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=semester_{semester}_report.csv"})


@router.get("/institution/excel")
def institution_excel_report(
    db: Session = Depends(get_db),
    _=Depends(require_admin_or_principal),
):
    excel_bytes = ReportService(db).generate_institution_excel()
    return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=institution_report.xlsx"})

