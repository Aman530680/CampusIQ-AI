import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import shap
import joblib
import os
from app.core.config import settings
from app.core.logging import logger


FEATURE_COLS = [
    "avg_attendance", "avg_internal_marks", "avg_external_marks",
    "current_cgpa", "total_backlogs", "subjects_failed",
    "attendance_trend", "marks_trend", "internship_count",
    "certifications_count", "coding_score", "extra_curricular_score",
]


class ModelRegistry:
    _models: Dict[str, Any] = {}
    _scalers: Dict[str, Any] = {}

    @classmethod
    def save(cls, name: str, model: Any, scaler: Any = None):
        os.makedirs(settings.MODELS_PATH, exist_ok=True)
        joblib.dump(model, f"{settings.MODELS_PATH}/{name}.pkl")
        cls._models[name] = model
        if scaler:
            joblib.dump(scaler, f"{settings.MODELS_PATH}/{name}_scaler.pkl")
            cls._scalers[name] = scaler

    @classmethod
    def load(cls, name: str) -> Tuple[Any, Any]:
        if name not in cls._models:
            path = f"{settings.MODELS_PATH}/{name}.pkl"
            if os.path.exists(path):
                cls._models[name] = joblib.load(path)
            else:
                return None, None
        scaler_path = f"{settings.MODELS_PATH}/{name}_scaler.pkl"
        if name not in cls._scalers and os.path.exists(scaler_path):
            cls._scalers[name] = joblib.load(scaler_path)
        return cls._models.get(name), cls._scalers.get(name)


def prepare_features(df: pd.DataFrame) -> np.ndarray:
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0
    return df[FEATURE_COLS].fillna(0).values


def train_cgpa_predictor(df: pd.DataFrame) -> Dict[str, float]:
    X = prepare_features(df)
    y = df["current_cgpa"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    model = xgb.XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = {"rmse": float(np.sqrt(mean_squared_error(y_test, preds))), "r2": float(r2_score(y_test, preds))}
    ModelRegistry.save("cgpa_predictor", model, scaler)
    logger.info(f"CGPA predictor trained: {metrics}")
    return metrics


def train_risk_classifier(df: pd.DataFrame) -> Dict[str, float]:
    X = prepare_features(df)
    y = (df["risk_score"] >= 0.6).astype(int).values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    model = lgb.LGBMClassifier(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42, verbose=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = {"accuracy": float(accuracy_score(y_test, preds))}
    ModelRegistry.save("risk_classifier", model, scaler)
    logger.info(f"Risk classifier trained: {metrics}")
    return metrics


def train_placement_predictor(df: pd.DataFrame) -> Dict[str, float]:
    X = prepare_features(df)
    y = df["is_placed"].astype(int).values if "is_placed" in df.columns else np.zeros(len(df))
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    model = xgb.XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    metrics = {"accuracy": float(accuracy_score(y_test, preds))}
    ModelRegistry.save("placement_predictor", model, scaler)
    logger.info(f"Placement predictor trained: {metrics}")
    return metrics


def predict_student(student_features: Dict[str, float]) -> Dict[str, Any]:
    df = pd.DataFrame([student_features])
    X = prepare_features(df)
    results = {}

    # CGPA prediction
    model, scaler = ModelRegistry.load("cgpa_predictor")
    if model and scaler:
        X_scaled = scaler.transform(X)
        cgpa_pred = float(model.predict(X_scaled)[0])
        results["predicted_cgpa"] = round(min(max(cgpa_pred, 0), 10), 2)
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_scaled)
        results["cgpa_shap"] = dict(zip(FEATURE_COLS, shap_vals[0].tolist()))

    # Risk prediction
    model, scaler = ModelRegistry.load("risk_classifier")
    if model and scaler:
        X_scaled = scaler.transform(X)
        risk_prob = float(model.predict_proba(X_scaled)[0][1])
        results["risk_probability"] = round(risk_prob, 3)
        results["risk_level"] = "high" if risk_prob >= 0.6 else "medium" if risk_prob >= 0.3 else "low"
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_scaled)
        sv = shap_vals[1][0] if isinstance(shap_vals, list) else shap_vals[0]
        results["risk_shap"] = dict(zip(FEATURE_COLS, sv.tolist()))

    # Placement prediction
    model, scaler = ModelRegistry.load("placement_predictor")
    if model and scaler:
        X_scaled = scaler.transform(X)
        placement_prob = float(model.predict_proba(X_scaled)[0][1])
        results["placement_probability"] = round(placement_prob, 3)

    results["recommendations"] = generate_recommendations(student_features, results)
    return results


def generate_recommendations(features: Dict, predictions: Dict) -> List[str]:
    recs = []
    if features.get("avg_attendance", 100) < 75:
        recs.append("Attendance is critically low. Attend all remaining classes to meet the 75% threshold.")
    if features.get("avg_internal_marks", 100) < 40:
        recs.append("Internal marks are below average. Focus on assignments and internal assessments.")
    if features.get("current_cgpa", 10) < 6.0:
        recs.append("CGPA is below 6.0. Seek academic counseling and focus on core subjects.")
    if features.get("total_backlogs", 0) > 2:
        recs.append("Multiple backlogs detected. Clear pending backlogs before next semester.")
    if features.get("coding_score", 100) < 50:
        recs.append("Improve coding skills. Practice DSA on LeetCode/HackerRank daily.")
    if features.get("internship_count", 0) == 0:
        recs.append("No internship experience. Apply for internships to improve placement chances.")
    if features.get("certifications_count", 0) < 2:
        recs.append("Earn relevant certifications (AWS, Google, Coursera) to boost your profile.")
    if predictions.get("placement_probability", 1) < 0.5:
        recs.append("Placement probability is low. Work on aptitude, communication, and technical skills.")
    if not recs:
        recs.append("You are on track! Keep maintaining your academic performance.")
    return recs
