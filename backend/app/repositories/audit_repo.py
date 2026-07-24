from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.models import AuditLog


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def log_activity(self, action: str, details: str = None, user_id: int = None, ip_address: str = None) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        return self.create(log)

    def get_logs(self, skip: int = 0, limit: int = 100):
        return self.db.query(self.model).order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()
