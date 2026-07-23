from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "CampusIQ AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "campusiq"
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/campusiq"

    REDIS_URL: str = "redis://localhost:6379/0"

    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-3.5-turbo"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    STORAGE_PATH: str = "./storage"
    VECTOR_DB_PATH: str = "./storage/vector_db"
    MODELS_PATH: str = "./storage/models"
    REPORTS_PATH: str = "./storage/reports"
    UPLOADS_PATH: str = "./storage/uploads"
    DATASET_PATH: str = "./storage/uploads/CampusIQ_20000_Students_Dataset.xlsx"

    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
