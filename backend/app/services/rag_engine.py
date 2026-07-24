import os
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any, List, Optional
from loguru import logger
from app.core.config import settings
from app.models.models import Student, StudentMLFeatures, Department, Placement, Subject, Marks

# Try imports, fallback to dummy or log errors if not yet ready
try:
    from langchain_community.vectorstores import FAISS
    from langchain_core.documents import Document
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:
    FAISS = None
    Document = None
    HuggingFaceEmbeddings = None


class RAGEngine:
    def __init__(self):
        self.embeddings = None
        self.vector_store = None
        self.index_path = settings.VECTOR_DB_PATH
        self._init_embeddings()

    def _init_embeddings(self):
        if HuggingFaceEmbeddings is not None:
            try:
                # Initialize local HuggingFace embeddings
                self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
                logger.info(f"RAG embeddings initialized: {settings.EMBEDDING_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize HuggingFace embeddings: {e}")

    def build_index(self, db: Session):
        """Serialize student profiles into text, compute embeddings, and build the FAISS index."""
        if FAISS is None or Document is None or self.embeddings is None:
            logger.error("LangChain/FAISS dependencies not fully loaded. Cannot build index.")
            return False

        logger.info("Building FAISS student index...")
        students = db.query(Student).filter(Student.is_active == True).limit(2000).all() # Index top 2000 for efficiency
        
        documents = []
        for s in students:
            features = db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == s.id).first()
            placement = db.query(Placement).filter(Placement.student_id == s.id).first()
            dept = db.query(Department).filter(Department.id == s.department_id).first()
            
            dept_name = dept.name if dept else "Unknown Department"
            cgpa_val = round(features.current_cgpa, 2) if features else "N/A"
            att_val = round(features.avg_attendance, 1) if features else "N/A"
            backlogs = features.total_backlogs if features else 0
            
            placed_str = "Not Placed"
            if placement and placement.is_placed:
                placed_str = f"Placed at {placement.company_name} with package {placement.package_lpa} LPA"
            
            profile_text = (
                f"Student ID: {s.student_id}, Name: {s.name}, Email: {s.email}. "
                f"Department: {dept_name}, Batch Year: {s.batch_year}, Semester: {s.current_semester}. "
                f"Academic Performance: CGPA {cgpa_val}, Average Attendance {att_val}%, Backlogs: {backlogs}. "
                f"Profile Metrics: Internship Count: {placement.internship_count if placement else 0}, "
                f"Certifications: {placement.certifications_count if placement else 0}, "
                f"Coding Score: {placement.coding_score if placement else 0}, "
                f"Aptitude Score: {placement.aptitude_score if placement else 0}, "
                f"Communication Score: {placement.communication_score if placement else 0}. "
                f"Placement Status: {placed_str}."
            )
            
            doc = Document(
                page_content=profile_text,
                metadata={
                    "student_id": s.student_id,
                    "name": s.name,
                    "department": dept_name,
                    "cgpa": float(features.current_cgpa) if features else 0.0,
                }
            )
            documents.append(doc)

        if not documents:
            logger.warning("No student records found to index.")
            return False

        try:
            self.vector_store = FAISS.from_documents(documents, self.embeddings)
            os.makedirs(self.index_path, exist_ok=True)
            self.vector_store.save_local(self.index_path)
            logger.info(f"FAISS index built and saved to {self.index_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to build FAISS index: {e}")
            return False

    def load_index(self) -> bool:
        """Load the FAISS index from disk."""
        if FAISS is None or self.embeddings is None:
            return False
            
        if not os.path.exists(os.path.join(self.index_path, "index.faiss")):
            logger.warning("FAISS index files do not exist on disk.")
            return False
            
        try:
            self.vector_store = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
            logger.info("FAISS index loaded successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            return False

    def query(self, db: Session, question: str) -> Dict[str, Any]:
        """Hybrid Query routing: SQL parser + Vector Search RAG."""
        q = question.lower().strip()
        
        # 1. SQL / Aggregation queries (100% accuracy on structured lookups)
        if any(k in q for k in ["attendance below", "below 75", "low attendance"]):
            return self._query_low_attendance(db)
        if any(k in q for k in ["at risk", "academic risk", "likely to fail"]):
            return self._query_at_risk(db)
        if any(k in q for k in ["placement percentage", "placement rate", "placement stats"]):
            return self._query_placement_rate(db)
        if any(k in q for k in ["department performs best", "best department", "top department"]):
            return self._query_best_department(db)
            
        # 2. Student-specific query (Vector retrieval fallback)
        student_id = self._extract_student_id(q)
        if student_id:
            return self._query_student_profile(db, student_id, q)

        # 3. Semantic vector search RAG
        if self.vector_store is None:
            self.load_index()
            
        if self.vector_store is not None:
            try:
                hits = self.vector_store.similarity_search(question, k=3)
                context = "\n".join([h.page_content for h in hits])
                sources = [h.metadata.get("student_id") for h in hits if h.metadata.get("student_id")]
                
                # If OpenAI key is present, generate response with context
                if settings.OPENAI_API_KEY:
                    return self._generate_openai_response(question, context, sources)
                else:
                    # Generic template-based synthesis
                    response = (
                        f"Based on institutional records, here is the relevant academic context found:\n\n"
                        f"{hits[0].page_content}\n\n"
                        f"Sources: {', '.join(sources)}"
                    )
                    return {"response": response, "sources": sources}
            except Exception as e:
                logger.error(f"RAG search query failed: {e}")

        # Fallback response
        return {
            "response": "I'm the CampusIQ AI assistant. Try asking me:\n"
                        "• 'Show students below 75% attendance'\n"
                        "• 'Which department performs best?'\n"
                        "• 'Predict placement percentage'\n"
                        "• 'Summarize academic performance for STU00001'"
        }

    def _extract_student_id(self, query: str) -> Optional[str]:
        import re
        match = re.search(r"stu\d+", query)
        return match.group(0).upper() if match else None

    def _query_low_attendance(self, db: Session) -> Dict[str, Any]:
        rows = (
            db.query(Student, StudentMLFeatures)
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.avg_attendance < 75, Student.is_active == True)
            .order_by(StudentMLFeatures.avg_attendance)
            .limit(10)
            .all()
        )
        total = (
            db.query(func.count(Student.id))
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.avg_attendance < 75, Student.is_active == True)
            .scalar()
        )
        if not rows:
            return {"response": "All active students have attendance levels at or above 75%."}
            
        lines = [f"Found {total} students with attendance below 75%. Here are the top 10:"]
        for s, f in rows:
            lines.append(f"• {s.name} ({s.student_id}) — Attendance: {round(f.avg_attendance, 1)}% (CGPA: {round(f.current_cgpa, 2)})")
        return {"response": "\n".join(lines), "sources": [s.student_id for s in rows]}

    def _query_at_risk(self, db: Session) -> Dict[str, Any]:
        rows = (
            db.query(Student, StudentMLFeatures)
            .join(StudentMLFeatures, Student.id == StudentMLFeatures.student_id)
            .filter(StudentMLFeatures.risk_score >= 0.6, Student.is_active == True)
            .order_by(StudentMLFeatures.risk_score.desc())
            .limit(10)
            .all()
        )
        if not rows:
            return {"response": "No high-risk students found."}
            
        lines = ["Top 10 highest academic risk students (Risk ≥ 60%):"]
        for s, f in rows:
            lines.append(f"• {s.name} ({s.student_id}) — Risk: {round(f.risk_score * 100, 1)}% (CGPA: {round(f.current_cgpa, 2)}, Attendance: {round(f.avg_attendance, 1)}%)")
        return {"response": "\n".join(lines), "sources": [s.student_id for s in rows]}

    def _query_placement_rate(self, db: Session) -> Dict[str, Any]:
        total = db.query(func.count(Placement.id)).scalar() or 0
        placed = db.query(func.count(Placement.id)).filter(Placement.is_placed == True).scalar() or 0
        rate = round((placed / total * 100) if total > 0 else 0.0, 2)
        avg_pkg = db.query(func.avg(Placement.package_lpa)).filter(Placement.is_placed == True).scalar() or 0.0
        
        response = (
            f"The current institutional placement rate is **{rate}%**.\n"
            f"• Total candidates tracked: {total}\n"
            f"• Placed candidates: {placed}\n"
            f"• Average package: {round(float(avg_pkg), 2)} LPA"
        )
        return {"response": response}

    def _query_best_department(self, db: Session) -> Dict[str, Any]:
        depts = db.query(Department).all()
        best_dept = None
        best_cgpa = 0.0
        
        lines = ["Department Comparison by Avg CGPA:"]
        for d in depts:
            student_ids = [s.id for s in db.query(Student).filter(Student.department_id == d.id).all()]
            if not student_ids:
                continue
            avg_cgpa = db.query(func.avg(StudentMLFeatures.current_cgpa)).filter(
                StudentMLFeatures.student_id.in_(student_ids)
            ).scalar() or 0.0
            avg_cgpa = float(avg_cgpa)
            lines.append(f"• {d.name} ({d.code}) — Avg CGPA: {round(avg_cgpa, 2)}")
            if avg_cgpa > best_cgpa:
                best_cgpa = avg_cgpa
                best_dept = d
                
        if best_dept:
            lines.insert(0, f"The best performing department is **{best_dept.name} ({best_dept.code})** with an average CGPA of **{round(best_cgpa, 2)}**.\n")
        return {"response": "\n".join(lines)}

    def _query_student_profile(self, db: Session, student_id: str, query: str) -> Dict[str, Any]:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            return {"response": f"Student with ID {student_id} not found."}
            
        features = db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == student.id).first()
        placement = db.query(Placement).filter(Placement.student_id == student.id).first()
        
        cgpa_val = round(features.current_cgpa, 2) if features else 0.0
        att_val = round(features.avg_attendance, 1) if features else 0.0
        backlogs = features.total_backlogs if features else 0
        risk_level = "High" if (features and features.risk_score >= 0.6) else "Medium" if (features and features.risk_score >= 0.3) else "Low"
        
        placed_status = "Not Placed"
        if placement and placement.is_placed:
            placed_status = f"Placed at {placement.company_name} with {placement.package_lpa} LPA"
            
        response = (
            f"### Academic Profile: {student.name} ({student.student_id})\n"
            f"• **Department**: {student.department.name if student.department else 'N/A'}\n"
            f"• **Current CGPA**: {cgpa_val}\n"
            f"• **Avg Attendance**: {att_val}%\n"
            f"• **Backlogs**: {backlogs}\n"
            f"• **Placement Potential**: {round(features.placement_probability * 100, 1) if features else 0}%\n"
            f"• **Current Placement Status**: {placed_status}\n"
            f"• **Academic Risk Category**: {risk_level}\n\n"
        )
        
        if "recommend" in query:
            from app.ml.predictor import generate_recommendations
            feature_dict = {
                "avg_attendance": att_val,
                "avg_internal_marks": features.avg_internal_marks if features else 0,
                "current_cgpa": cgpa_val,
                "total_backlogs": backlogs,
                "coding_score": placement.coding_score if placement else 0,
                "internship_count": placement.internship_count if placement else 0,
                "certifications_count": placement.certifications_count if placement else 0,
            }
            recs = generate_recommendations(feature_dict, {"placement_probability": features.placement_probability if features else 0.0})
            response += "**Improvement Recommendations**:\n"
            for i, r in enumerate(recs, 1):
                response += f"{i}. {r}\n"
                
        return {"response": response, "sources": [student_id]}

    def _generate_openai_response(self, question: str, context: str, sources: List[str]) -> Dict[str, Any]:
        from openai import OpenAI
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = (
                f"You are CampusIQ AI, an enterprise academic assistant. Use the following context to answer the user's question.\n"
                f"Context:\n{context}\n\n"
                f"Question: {question}\n\n"
                f"Answer: "
            )
            completion = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            response = completion.choices[0].message.content
            return {"response": response, "sources": sources}
        except Exception as e:
            logger.error(f"OpenAI completion failed: {e}")
            return {
                "response": f"RAG context loaded, but OpenAI call failed. Local context:\n\n{context}",
                "sources": sources
            }
