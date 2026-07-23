def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_login_success(client):
    res = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "Test@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"


def test_login_invalid(client):
    res = client.post("/api/v1/auth/login", json={"username": "wrong", "password": "wrong"})
    assert res.status_code == 401


def test_protected_route_without_token(client):
    res = client.get("/api/v1/students")
    assert res.status_code == 403


def test_students_list(client, auth_headers):
    res = client.get("/api/v1/students", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_departments_list(client, auth_headers):
    res = client.get("/api/v1/departments", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_analytics_kpis(client, auth_headers):
    res = client.get("/api/v1/analytics/kpis", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_students" in data
    assert "avg_cgpa" in data


def test_chatbot(client, auth_headers):
    res = client.post("/api/v1/chatbot/chat", json={"message": "help"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "session_id" in data
