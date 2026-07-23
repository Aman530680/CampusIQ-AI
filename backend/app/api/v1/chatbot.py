from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.chatbot_service import ChatbotService
from app.schemas.schemas import ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])
_chatbot_instances = {}


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    result = service.chat(req.message, req.session_id)
    return ChatResponse(**result)
