from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import Student, Department, StudentMLFeatures, UserRole
from app.schemas.schemas import StudentOut, StudentCreate, StudentDetail, PaginatedResponse
from app.repositories.student_repo import StudentRepository
from app.api.deps import get_current_user, require_admin, require_faculty_or_above
from app.models.models import User

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=PaginatedResponse)
def list_students(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_above),
):
    repo = StudentRepository(db)
    skip = (page - 1) * size
    if search:
        items = repo.search(search, skip, size)
        total = len(repo.search(search, 0, 10000))
    elif department_id:
        items = repo.get_by_department(department_id, skip, size)
        total = repo.count_by_department(department_id)
    else:
        items = repo.get_all(skip, size)
        total = repo.count()
    import math
    return PaginatedResponse(items=items, total=total, page=page, size=size, pages=math.ceil(total / size))


@router.get("/{student_id}", response_model=StudentDetail)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = StudentRepository(db)
    # Students can only view their own profile
    if current_user.role == UserRole.student:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    student = repo.get_with_details(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("", response_model=StudentOut)
def create_student(
    req: StudentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    repo = StudentRepository(db)
    existing = repo.get_by_student_id(req.student_id)
    if existing:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    student = Student(**req.model_dump())
    return repo.create(student)


@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    req: StudentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    repo = StudentRepository(db)
    student = repo.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(student, k, v)
    return repo.update(student)


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    repo = StudentRepository(db)
    student = repo.get(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = False
    repo.update(student)
    return {"message": "Student deactivated"}
