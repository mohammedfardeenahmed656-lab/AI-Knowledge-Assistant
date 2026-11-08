"""
Integration Tests: FastAPI Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_health_check_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "app_name" in data

def test_dashboard_stats_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_documents" in data
        assert "total_chunks" in data

def test_chat_endpoint_grounded_answer():
    with TestClient(app) as client:
        payload = {
            "message": "What is RAG and why use it over fine tuning?",
            "top_k": 3,
            "similarity_threshold": 0.05,
            "search_mode": "hybrid"
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "conversation_id" in data
        assert "rag_process" in data
        assert len(data["retrieved_chunks"]) > 0

def test_search_lab_endpoint():
    with TestClient(app) as client:
        payload = {
            "query": "Kubernetes and Redis caching",
            "top_k": 2,
            "mode": "hybrid"
        }
        response = client.post("/api/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "chunks" in data
        assert data["mode"] == "hybrid"
