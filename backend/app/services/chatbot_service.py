import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.rag_engine import RAGEngine
from app.core.logging import logger


class ChatbotService:
    """
    RAG-driven chatbot that leverages FAISS vector database and MySQL relational search
    to provide smart, context-aware answers to user inquiries.
    """
    _rag_engine = None

    def __init__(self, db: Session):
        self.db = db
        # Caching RAGEngine instance globally to avoid loading embeddings on every request
        if ChatbotService._rag_engine is None:
            try:
                ChatbotService._rag_engine = RAGEngine()
                # Try loading index or build one from db
                if not ChatbotService._rag_engine.load_index():
                    ChatbotService._rag_engine.build_index(db)
            except Exception as e:
                logger.error(f"Failed to initialize RAG Engine: {e}")
        
        self.rag = ChatbotService._rag_engine
        self._sessions: Dict[str, List[Dict]] = {}

    def chat(self, message: str, session_id: Optional[str] = None) -> Dict:
        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        self._sessions[session_id].append({"role": "user", "content": message})
        
        try:
            if self.rag:
                res = self.rag.query(self.db, message)
                response = res.get("response", "No response generated.")
                sources = res.get("sources", [])
            else:
                response = "RAG chatbot is currently offline. Please verify dependencies."
                sources = []
        except Exception as e:
            logger.error(f"Error during RAG chat process: {e}")
            response = f"An error occurred while compiling your response: {str(e)}"
            sources = []

        self._sessions[session_id].append({"role": "assistant", "content": response})

        return {
            "response": response,
            "session_id": session_id,
            "sources": sources
        }

