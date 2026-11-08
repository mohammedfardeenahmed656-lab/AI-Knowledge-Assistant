"""
Convenience CLI Runner for the FastAPI Backend Server
"""

import uvicorn
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENV", "development") == "development"
    
    print(f"Starting AI Knowledge Assistant backend on http://{host}:{port} ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)