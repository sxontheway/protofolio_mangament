import sys
import os
import uvicorn
import webbrowser
import time
from backend.main import app

if __name__ == "__main__":
    try:
        print("Starting Portfolio Manager...")
        
        # Use a fixed port or find an available one? Fixed for now.
        port = 8000
        host = "127.0.0.1"
        
        url = f"http://{host}:{port}"
        print(f"Opening browser at {url}")
        
        # Open browser
        webbrowser.open(url)
        
        print(f"Starting server on {host}:{port}")
        # Run server
        uvicorn.run(app, host=host, port=port)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
