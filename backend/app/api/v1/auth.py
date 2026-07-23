from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.schemas import LoginRequest, TokenResponse, RefreshRequest, UserCreate, UserOut
from app.api.deps import require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(req)


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(req.refresh_token)


@router.post("/register", response_model=UserOut)
def register(req: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return AuthService(db).create_user(req)
