from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router
from app.core.logging import logger

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Academic Intelligence Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.on_event("startup")
async def startup():
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started")
    _seed_admin()


def _seed_admin():
    from app.core.database import SessionLocal
    from app.models.models import User, UserRole
    from app.core.security import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                email="admin@campusiq.ai",
                username="admin",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.admin,
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created: admin / Admin@123")
    finally:
        db.close()
