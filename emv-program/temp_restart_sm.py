import subprocess
import time
import sys
import os
from pathlib import Path

project_root = Path(__file__).parent
daemon_script = project_root / "service_manager_daemon.py"
python_exe = r"C:\Users\Admin\AppData\Local\Programs\Python\Python312\python.exe"

# Wait a moment for current Service Manager process to stop
time.sleep(3)

# Start Service Manager in a new process
try:
    creation_flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    subprocess.Popen(
        [python_exe, str(daemon_script)],
        cwd=str(project_root),
        creationflags=creation_flags,
        stdout=open(project_root / "logs" / "service_manager.log", 'a'),
        stderr=open(project_root / "logs" / "service_manager_error.log", 'a')
    )
    print("Service Manager restart initiated")
except Exception as e:
    print(f"Error restarting Service Manager: {e}")
