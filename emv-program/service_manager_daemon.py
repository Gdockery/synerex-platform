#!/usr/bin/env python3
"""
SYNEREX Service Manager Daemon
Clean architecture for managing all SYNEREX services
"""

import os
import sys
import time
import yaml
import json
import signal
import threading
import subprocess
import requests
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil

@dataclass
class ServiceStatus:
    name: str
    running: bool
    pid: Optional[int]
    port: int
    last_health_check: float
    restart_count: int
    error_message: Optional[str] = None

class ServiceManager:
    def __init__(self, config_file: str = "services.yaml"):
        self.config_file = config_file
        self.project_root = Path(__file__).parent
        self.config = self._load_config()
        self.services: Dict[str, ServiceStatus] = {}
        self.processes: Dict[str, subprocess.Popen] = {}
        self.monitoring_thread = None
        self.running = False
        
        # Initialize service statuses
        for service_id, service_config in self.config['services'].items():
            self.services[service_id] = ServiceStatus(
                name=service_config['name'],
                running=False,
                pid=None,
                port=service_config['port'],
                last_health_check=0,
                restart_count=0
            )
    
    def _load_config(self) -> dict:
        """Load service configuration from YAML file"""
        config_path = self.project_root / self.config_file
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            if not config:
                raise ValueError(f"Configuration file is empty or invalid: {config_path}")
            if 'services' not in config:
                raise ValueError(f"Configuration file missing 'services' section: {config_path}")
            if 'service_manager' not in config:
                raise ValueError(f"Configuration file missing 'service_manager' section: {config_path}")
            return config
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in configuration file {config_path}: {e}")
        except Exception as e:
            raise RuntimeError(f"Error loading configuration from {config_path}: {e}")
    
    def _is_service_healthy(self, service_id: str) -> bool:
        """Check if a service is healthy by making HTTP request"""
        service_config = self.config['services'][service_id]
        try:
            # Use longer timeout for main_app (8082) since it can be slow to respond
            timeout = 10 if service_id == 'main_app' else 2
            url = f"http://127.0.0.1:{service_config['port']}{service_config['health_endpoint']}"
            if service_id == 'main_app':
                url = "http://127.0.0.1:8082/api/health"
            response = requests.get(url, timeout=timeout)
            return response.status_code == 200
        except:
            return False
    
    def _start_service(self, service_id: str) -> bool:
        """Start a single service"""
        service_config = self.config['services'][service_id]
        service_status = self.services[service_id]
        
        try:
            # Check if already running
            if service_status.running and self._is_service_healthy(service_id):
                print(f"INFO: {service_status.name} is already running")
                return True
            
            # Stop if already running but unhealthy
            if service_status.running:
                self._stop_service(service_id)
            
            # Start the service
            service_dir = self.project_root / service_config['directory']
            script_path = service_dir / service_config['script']
            
            if not script_path.exists():
                print(f"ERROR: Script not found: {script_path}")
                service_status.error_message = f"Script not found: {script_path}"
                return False
            
            print(f"Starting {service_status.name} from {service_dir}")
            print(f"Script: {script_path}")
            
            # Start service with cross-platform process creation
            process = subprocess.Popen(
                [sys.executable, service_config['script']],
                cwd=str(service_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.processes[service_id] = process
            service_status.pid = process.pid
            service_status.running = True
            service_status.error_message = None
            
            print(f"SUCCESS: {service_status.name} started (PID: {process.pid})")
            
            # Wait for service to become healthy (with longer intervals to avoid overwhelming)
            timeout = service_config['startup_timeout']
            start_time = time.time()
            check_interval = 2  # Check every 2 seconds instead of every 1 second
            
            while time.time() - start_time < timeout:
                if self._is_service_healthy(service_id):
                    print(f"VERIFIED: {service_status.name} is responding on port {service_config['port']}")
                    return True
                time.sleep(check_interval)
            
            print(f"WARNING: {service_status.name} started but not responding on port {service_config['port']} after {timeout} seconds")
            return False
            
        except Exception as e:
            print(f"ERROR: Failed to start {service_status.name}: {e}")
            service_status.error_message = str(e)
            service_status.running = False
            return False
    
    def _stop_service(self, service_id: str) -> bool:
        """Stop a single service"""
        service_status = self.services[service_id]
        
        try:
            if not service_status.running:
                print(f"INFO: {service_status.name} is not running")
                return True
            
            # Find and kill the process
            if service_id in self.processes:
                process = self.processes[service_id]
                if process.poll() is None:  # Process is still running
                    print(f"Stopping {service_status.name} (PID: {process.pid})")
                    process.terminate()
                    process.wait(timeout=5)
            
            # Also try to kill by port
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    if proc.info['name'] == 'python.exe':
                        connections = proc.net_connections()
                        for conn in connections:
                            if conn.laddr.port == service_status.port:
                                print(f"Stopping {service_status.name} (PID: {proc.pid})")
                                proc.terminate()
                                proc.wait(timeout=5)
                                break
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    continue
            
            service_status.running = False
            service_status.pid = None
            if service_id in self.processes:
                del self.processes[service_id]
            
            print(f"SUCCESS: {service_status.name} stopped")
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to stop {service_status.name}: {e}")
            return False
    
    def start_all_services(self) -> Dict[str, bool]:
        """Start all services in dependency order"""
        results = {}
        
        # Sort services by dependencies
        sorted_services = self._resolve_dependencies()
        
        for service_id in sorted_services:
            print(f"\n--- Starting {self.services[service_id].name} ---")
            results[service_id] = self._start_service(service_id)
        
        return results
    
    def stop_all_services(self) -> Dict[str, bool]:
        """Stop all services"""
        results = {}
        
        # Stop in reverse dependency order
        sorted_services = list(reversed(self._resolve_dependencies()))
        
        for service_id in sorted_services:
            print(f"\n--- Stopping {self.services[service_id].name} ---")
            results[service_id] = self._stop_service(service_id)
        
        return results
    
    def _resolve_dependencies(self) -> List[str]:
        """Resolve service dependencies and return startup order"""
        visited = set()
        temp_visited = set()
        result = []
        
        def visit(service_id):
            if service_id in temp_visited:
                raise ValueError(f"Circular dependency detected involving {service_id}")
            if service_id in visited:
                return
            
            temp_visited.add(service_id)
            dependencies = self.config['services'][service_id].get('dependencies', [])
            for dep in dependencies:
                visit(dep)
            
            temp_visited.remove(service_id)
            visited.add(service_id)
            result.append(service_id)
        
        for service_id in self.config['services']:
            if service_id not in visited:
                visit(service_id)
        
        return result
    
    def get_service_status(self) -> Dict[str, dict]:
        """Get status of all services"""
        status = {}
        for service_id, service_status in self.services.items():
            status[service_id] = {
                'name': service_status.name,
                'running': service_status.running,
                'pid': service_status.pid,
                'port': service_status.port,
                'healthy': self._is_service_healthy(service_id) if service_status.running else False,
                'restart_count': service_status.restart_count,
                'error_message': service_status.error_message
            }
        return status
    
    def start_monitoring(self):
        """Start the health monitoring thread"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            return
        
        self.running = True
        self.monitoring_thread = threading.Thread(target=self._monitor_services, daemon=True)
        self.monitoring_thread.start()
        print("Service monitoring started")
    
    def stop_monitoring(self):
        """Stop the health monitoring thread"""
        self.running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        print("Service monitoring stopped")
    
    def _monitor_services(self):
        """Monitor services and restart if needed"""
        # Services that should NOT be auto-restarted (managed manually)
        no_auto_restart = ['main_app']  # 8082 is managed manually via admin panel
        
        # Track when services were last started (for grace period)
        service_start_times = {}
        grace_period = self.config['service_manager'].get('startup_grace_period', 15)
        
        while self.running:
            try:
                for service_id, service_status in self.services.items():
                    if service_status.running:
                        # Check if service is still in grace period after startup
                        if service_id in service_start_times:
                            time_since_start = time.time() - service_start_times[service_id]
                            if time_since_start < grace_period:
                                # Service is still in grace period, skip health check
                                continue
                            else:
                                # Grace period expired, remove from tracking
                                del service_start_times[service_id]
                        
                        if not self._is_service_healthy(service_id):
                            # Skip auto-restart for services in no_auto_restart list
                            if service_id in no_auto_restart:
                                print(f"INFO: {service_status.name} is not healthy, but auto-restart is disabled (managed manually)")
                                continue
                            
                            print(f"WARNING: {service_status.name} is not healthy, attempting restart")
                            service_status.restart_count += 1
                            
                            if service_status.restart_count <= self.config['service_manager']['restart_attempts']:
                                self._stop_service(service_id)
                                time.sleep(self.config['service_manager']['restart_delay'])
                                if self._start_service(service_id):
                                    # Service started successfully, record start time for grace period
                                    service_start_times[service_id] = time.time()
                                    # Reset restart count on successful start
                                    service_status.restart_count = 0
                            else:
                                print(f"ERROR: {service_status.name} exceeded restart attempts")
                                service_status.running = False
                        else:
                            # Service is healthy, reset restart count
                            if service_status.restart_count > 0:
                                service_status.restart_count = 0
                                print(f"INFO: {service_status.name} is now healthy, resetting restart count")
                
                time.sleep(self.config['service_manager']['health_check_interval'])
            except Exception as e:
                print(f"ERROR in monitoring thread: {e}")
                time.sleep(5)

# Flask API for Admin Panel
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize ServiceManager with error handling
try:
    service_manager = ServiceManager()
except Exception as e:
    print(f"ERROR: Failed to initialize ServiceManager: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

@app.route('/api/services/status', methods=['GET'])
def get_status():
    """Get status of all services"""
    return jsonify({
        'success': True,
        'services': service_manager.get_service_status()
    })

@app.route('/api/services/start-all', methods=['POST'])
def start_all():
    """Start all services"""
    print("=== Starting SYNEREX Services ===")
    results = service_manager.start_all_services()
    
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    
    return jsonify({
        'success': success_count == total_count,
        'message': f"Started {success_count}/{total_count} services successfully",
        'results': results,
        'services': service_manager.get_service_status()
    })

@app.route('/api/services/stop-all', methods=['POST'])
def stop_all():
    """Stop all services"""
    print("=== Stopping SYNEREX Services ===")
    results = service_manager.stop_all_services()
    
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    
    return jsonify({
        'success': success_count == total_count,
        'message': f"Stopped {success_count}/{total_count} services successfully",
        'results': results,
        'services': service_manager.get_service_status()
    })

@app.route('/api/services/stop-other-services', methods=['POST'])
def stop_other_services():
    """Stop all services except the main app (for Admin Panel use)"""
    print("=== Stopping Other SYNEREX Services (excluding Main App) ===")
    
    # Stop all services except main_app
    results = {}
    for service_id in service_manager.services:
        if service_id != 'main_app':
            print(f"\n--- Stopping {service_manager.services[service_id].name} ---")
            results[service_id] = service_manager._stop_service(service_id)
    
    success_count = sum(1 for success in results.values() if success)
    total_count = len(results)
    
    return jsonify({
        'success': success_count == total_count,
        'message': f"Stopped {success_count}/{total_count} other services successfully",
        'results': results,
        'services': service_manager.get_service_status()
    })

@app.route('/api/services/start/<service_id>', methods=['POST'])
def start_service(service_id):
    """Start a specific service"""
    if service_id not in service_manager.services:
        return jsonify({'success': False, 'message': 'Service not found'}), 404
    
    success = service_manager._start_service(service_id)
    return jsonify({
        'success': success,
        'message': f"Service {service_id} {'started' if success else 'failed to start'}"
    })

@app.route('/api/services/stop/<service_id>', methods=['POST'])
def stop_service(service_id):
    """Stop a specific service"""
    if service_id not in service_manager.services:
        return jsonify({'success': False, 'message': 'Service not found'}), 404
    
    success = service_manager._stop_service(service_id)
    return jsonify({
        'success': success,
        'message': f"Service {service_id} {'stopped' if success else 'failed to stop'}"
    })

@app.route('/api/services/restart/<service_id>', methods=['POST'])
def restart_service(service_id):
    """Restart a specific service"""
    print(f"=== Restarting {service_id} ===")
    
    if service_id not in service_manager.services:
        return jsonify({
            'success': False,
            'message': f'Service {service_id} not found'
        }), 404
    
    # Stop the service first
    stop_result = service_manager._stop_service(service_id)
    if not stop_result:
        return jsonify({
            'success': False,
            'message': f'Failed to stop {service_id}'
        }), 500
    
    # Wait a moment for the service to stop
    time.sleep(2)
    
    # Start the service
    start_result = service_manager._start_service(service_id)
    if start_result:
        return jsonify({
            'success': True,
            'message': f'{service_id} restarted successfully',
            'service': service_manager.get_service_status()[service_id]
        })
    else:
        return jsonify({
            'success': False,
            'message': f'Failed to start {service_id} after stopping'
        }), 500

@app.route('/api/services/restart-self', methods=['POST'])
def restart_self():
    """Restart the Service Manager itself using external process"""
    import subprocess
    import sys
    from pathlib import Path
    
    try:
        # Get project root and daemon script path
        project_root = Path(__file__).parent
        daemon_script = project_root / "service_manager_daemon.py"
        python_exe = sys.executable
        
        # Create a simple restart script that will restart the Service Manager
        restart_script_content = f'''import subprocess
import time
import sys
import os
from pathlib import Path

project_root = Path(__file__).parent
daemon_script = project_root / "service_manager_daemon.py"
python_exe = r"{python_exe}"

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
    print(f"Error restarting Service Manager: {{e}}")
'''
        
        # Write temporary restart script
        temp_script = project_root / "temp_restart_sm.py"
        with open(temp_script, 'w') as f:
            f.write(restart_script_content)
        
        # Spawn external process to restart Service Manager
        creation_flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        subprocess.Popen(
            [python_exe, str(temp_script)],
            cwd=str(project_root),
            creationflags=creation_flags
        )
        
        # Give the restart script a moment to start
        time.sleep(1)
        
        # Stop this Service Manager process (it will be restarted by external script)
        # Use a delayed shutdown to allow the response to be sent
        def delayed_shutdown():
            time.sleep(2)
            service_manager.stop_monitoring()
            service_manager.stop_all_services()
            sys.exit(0)
        
        import threading
        shutdown_thread = threading.Thread(target=delayed_shutdown, daemon=True)
        shutdown_thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Service Manager restart initiated. It will restart in a few seconds.'
        })
    except Exception as e:
        import traceback
        print(f"Error in restart-self: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Failed to initiate restart: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check for service manager"""
    return jsonify({
        'status': 'healthy',
        'service_manager': 'running',
        'services_monitored': len(service_manager.services)
    })

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    print("\nShutting down service manager...")
    service_manager.stop_monitoring()
    service_manager.stop_all_services()
    sys.exit(0)

if __name__ == '__main__':
    try:
        # Set up signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start monitoring
        try:
            service_manager.start_monitoring()
        except Exception as e:
            print(f"ERROR: Failed to start monitoring: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        
        # Start Flask API
        port = service_manager.config['service_manager']['port']
        print(f"Starting Service Manager API on port {port}")
        print(f"Health check: http://localhost:{port}/health")
        print(f"API docs: http://localhost:{port}/api/services/status")
        
        # Check if port is available with retry logic
        import socket
        port_available = False
        max_retries = 5
        retry_delay = 3
        
        for attempt in range(max_retries):
            try:
                test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                test_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                test_sock.bind(('localhost', port))
                test_sock.close()
                port_available = True
                print(f"Port {port} is available")
                break
            except OSError:
                if attempt < max_retries - 1:
                    print(f"Port {port} still in use, waiting {retry_delay} seconds (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(retry_delay)
                else:
                    print(f"ERROR: Port {port} is still in use after {max_retries} attempts.")
                    print("Please manually stop any process using port 9000 and try again.")
                    sys.exit(1)
        
        try:
            # Windows-compatible Flask configuration with SO_REUSEADDR
            # Set SO_REUSEADDR at the socket level before Flask binds
            import socket as sock_module
            from socket import SOL_SOCKET, SO_REUSEADDR
            
            # Monkey-patch socket to enable SO_REUSEADDR by default
            original_socket = sock_module.socket
            def socket_with_reuse(*args, **kwargs):
                sock = original_socket(*args, **kwargs)
                sock.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
                return sock
            sock_module.socket = socket_with_reuse
            
            # Now Flask will use the socket with SO_REUSEADDR
            app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
        except OSError as e:
            if "Address already in use" in str(e) or "address is already in use" in str(e).lower():
                print(f"ERROR: Port {port} is already in use. Another instance may be running.")
            else:
                print(f"ERROR: Failed to start Flask server: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        except Exception as e:
            print(f"ERROR: Unexpected error starting Flask server: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        service_manager.stop_monitoring()
        service_manager.stop_all_services()
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: Fatal error in Service Manager: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
