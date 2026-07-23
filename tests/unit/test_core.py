import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.ml.predictor import generate_recommendations


def test_password_hashing():
    pwd = "TestPassword@123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_token():
    payload = {"sub": "1", "role": "admin", "username": "admin"}
    token = create_access_token(payload)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "1"
    assert decoded["role"] == "admin"


def test_invalid_token():
    result = decode_token("invalid.token.here")
    assert result is None


def test_recommendations_low_attendance():
    features = {"avg_attendance": 60, "avg_internal_marks": 50, "current_cgpa": 7, "total_backlogs": 0, "coding_score": 70, "internship_count": 1, "certifications_count": 2}
    recs = generate_recommendations(features, {"placement_probability": 0.7})
    assert any("attendance" in r.lower() for r in recs)


def test_recommendations_low_cgpa():
    features = {"avg_attendance": 80, "avg_internal_marks": 30, "current_cgpa": 4.5, "total_backlogs": 3, "coding_score": 40, "internship_count": 0, "certifications_count": 0}
    recs = generate_recommendations(features, {"placement_probability": 0.2})
    assert len(recs) > 1


def test_recommendations_good_student():
    features = {"avg_attendance": 90, "avg_internal_marks": 80, "current_cgpa": 8.5, "total_backlogs": 0, "coding_score": 85, "internship_count": 2, "certifications_count": 3}
    recs = generate_recommendations(features, {"placement_probability": 0.9})
    assert any("on track" in r.lower() for r in recs)
