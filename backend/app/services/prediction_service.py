from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models.models import Student, StudentMLFeatures, Prediction
from app.ml.predictor import predict_student
from app.core.logging import logger


class PredictionService:
    def __init__(self, db: Session):
        self.db = db

    def predict_for_student(self, student_id: int) -> Dict[str, Any]:
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {"error": "Student not found"}

        features = self.db.query(StudentMLFeatures).filter(StudentMLFeatures.student_id == student_id).first()
        if not features:
            return {"error": "No ML features found for student"}

        feature_dict = {
            "avg_attendance": features.avg_attendance,
            "avg_internal_marks": features.avg_internal_marks,
            "avg_external_marks": features.avg_external_marks,
            "current_cgpa": features.current_cgpa,
            "total_backlogs": features.total_backlogs,
            "subjects_failed": features.subjects_failed,
            "attendance_trend": features.attendance_trend,
            "marks_trend": features.marks_trend,
            "internship_count": features.internship_count,
            "certifications_count": features.certifications_count,
            "coding_score": features.coding_score,
            "extra_curricular_score": features.extra_curricular_score,
        }

        try:
            results = predict_student(feature_dict)
        except Exception as e:
            logger.error(f"Prediction error for student {student_id}: {e}")
            results = self._fallback_prediction(feature_dict)

        # Persist prediction
        pred = Prediction(
            student_id=student_id,
            prediction_type="comprehensive",
            predicted_value=results.get("predicted_cgpa"),
            confidence=results.get("risk_probability"),
            risk_level=results.get("risk_level", "low"),
            shap_values=results.get("risk_shap"),
            feature_importance=results.get("cgpa_shap"),
            recommendations=results.get("recommendations"),
        )
        self.db.add(pred)
        # Update ML features
        features.placement_probability = results.get("placement_probability", 0)
        features.risk_score = results.get("risk_probability", 0)
        self.db.commit()
        return results

    def _fallback_prediction(self, features: Dict) -> Dict:
        """Rule-based fallback when ML models are not trained yet."""
        cgpa = features.get("current_cgpa", 0)
        attendance = features.get("avg_attendance", 0)
        backlogs = features.get("total_backlogs", 0)
        risk = 0.0
        if attendance < 60:
            risk += 0.4
        elif attendance < 75:
            risk += 0.2
        if cgpa < 5:
            risk += 0.4
        elif cgpa < 6:
            risk += 0.2
        if backlogs > 3:
            risk += 0.2
        risk = min(risk, 1.0)
        placement_prob = min(max((cgpa / 10) * 0.5 + (features.get("coding_score", 0) / 100) * 0.3 + (features.get("internship_count", 0) * 0.1), 0), 1)
        from app.ml.predictor import generate_recommendations
        return {
            "predicted_cgpa": cgpa,
            "risk_probability": round(risk, 3),
            "risk_level": "high" if risk >= 0.6 else "medium" if risk >= 0.3 else "low",
            "placement_probability": round(placement_prob, 3),
            "recommendations": generate_recommendations(features, {"placement_probability": placement_prob}),
        }
