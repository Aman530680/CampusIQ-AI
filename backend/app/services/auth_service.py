from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def login(self, req: LoginRequest) -> TokenResponse:
        user = self.get_user_by_username(req.username)
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
        payload = {"sub": str(user.id), "role": user.role.value, "username": user.username}
        return TokenResponse(
            access_token=create_access_token(payload),
            refresh_token=create_refresh_token(payload),
            role=user.role.value,
            user_id=user.id,
            username=user.username,
        )

    def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user = self.get_user_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        new_payload = {"sub": str(user.id), "role": user.role.value, "username": user.username}
        return TokenResponse(
            access_token=create_access_token(new_payload),
            refresh_token=create_refresh_token(new_payload),
            role=user.role.value,
            user_id=user.id,
            username=user.username,
        )

    def create_user(self, req: UserCreate) -> User:
        existing = self.db.query(User).filter(
            (User.email == req.email) | (User.username == req.username)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        user = User(
            email=req.email,
            username=req.username,
            hashed_password=hash_password(req.password),
            role=req.role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
