import os
import subprocess
import sys
import shutil

def build():
    # Ensure we are in the project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)
    
    print(f"Building in: {project_root}")

    # 1. Install Python Dependencies
    print("--- Installing Python Dependencies ---")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

    # 2. Build Frontend
    print("--- Building Frontend ---")
    frontend_dir = os.path.join(project_root, "frontend")
    
    # Check if node_modules exists, if not install
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("Installing frontend dependencies...")
        subprocess.check_call(["npm", "install"], cwd=frontend_dir)
    
    print("Running npm build...")
    subprocess.check_call(["npm", "run", "build"], cwd=frontend_dir)

    # 3. Package with PyInstaller
    print("--- Packaging with PyInstaller ---")
    
    # Determine separator for --add-data
    sep = ":" if os.name != 'nt' else ";"
    
    # Include frontend/dist
    # Source: frontend/dist
    # Destination: frontend/dist
    add_data = f"frontend/dist{sep}frontend/dist"
    
    # PyInstaller command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "PortfolioManager",
        "--onefile",
        "--clean",
        "--add-data", add_data,
        # We might need to handle hidden imports if any (e.g. uvicorn.loops, etc)
        # Usually uvicorn needs --hidden-import
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "launcher.py"
    ]
    
    print(f"Running: {' '.join(cmd)}")
    subprocess.check_call(cmd)
    
    print("\n===========================================")
    print("Build Complete!")
    print(f"Executable is located at: {os.path.join(project_root, 'dist', 'PortfolioManager')}")
    print("You can run it directly to test.")
    print("===========================================")

if __name__ == "__main__":
    build()
