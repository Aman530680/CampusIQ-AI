from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Department
from app.schemas.schemas import DepartmentOut, DepartmentCreate
from app.api.deps import require_admin, require_faculty_or_above

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    return db.query(Department).all()


@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db), _=Depends(require_faculty_or_above)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("", response_model=DepartmentOut)
def create_department(req: DepartmentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    dept = Department(**req.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: int, req: DepartmentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept
