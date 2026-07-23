from fastapi import APIRouter
from app.api.v1 import auth, students, departments, faculty, attendance, marks, analytics, predictions, chatbot, reports, admin

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(departments.router)
api_router.include_router(faculty.router)
api_router.include_router(attendance.router)
api_router.include_router(marks.router)
api_router.include_router(analytics.router)
api_router.include_router(predictions.router)
api_router.include_router(chatbot.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
