#!/usr/bin/env python3
"""
External Service Restart Script
This script runs as a separate process and can restart 8082 without killing itself
"""

import os
import sys
import time
import subprocess
from pathlib import Path

def restart_services():
    """Restart all SYNEREX services in the correct order"""
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir
    restart_log = project_root / "logs" / "restart_services.log"
    restart_lock = project_root / "logs" / "restart_services.lock"
    
    # Ensure logs directory exists
    restart_log.parent.mkdir(exist_ok=True)
    
    # Check if another restart is already in progress
    if restart_lock.exists():
        try:
            # Check if the lock file is stale (older than 2 minutes)
            lock_age = time.time() - restart_lock.stat().st_mtime
            
            # Check if the process that created the lock is still running
            lock_pid = None
            try:
                with open(restart_lock, 'r') as f:
                    lock_pid_str = f.read().strip()
                    if lock_pid_str.isdigit():
                        lock_pid = int(lock_pid_str)
            except:
                pass
            
            process_running = False
            if lock_pid:
                try:
                    import psutil
                    process_running = psutil.pid_exists(lock_pid)
                except:
                    # If psutil not available, just check if process exists via os
                    try:
                        os.kill(lock_pid, 0)  # Check if process exists (doesn't kill it)
                        process_running = True
                    except (OSError, ProcessLookupError):
                        process_running = False
            
            # Remove lock if stale OR if process is not running
            if lock_age > 120 or (lock_pid and not process_running):  # 2 minutes
                restart_lock.unlink()
                print(f"Removed stale restart lock file (age: {lock_age:.1f}s, process running: {process_running})")
            else:
                # Another restart is in progress, exit
                print(f"Another restart is already in progress (lock age: {lock_age:.1f}s, PID: {lock_pid}). Exiting.")
                return
        except Exception as e:
            # Lock file might be locked, try to remove it anyway
            try:
                restart_lock.unlink()
                print(f"Removed restart lock file due to error: {e}")
            except:
                pass
    
    # Create lock file
    try:
        with open(restart_lock, 'w') as f:
            f.write(str(os.getpid()))
    except:
        pass
    
    try:
        with open(restart_log, 'w', encoding='utf-8') as log_file:
            log_file.write("=== SYNEREX Services Restart (External Process) ===\n")
            log_file.write(f"Project root: {project_root}\n")
            log_file.write(f"Process PID: {os.getpid()}\n\n")
            log_file.flush()
            
            def check_service_health(port, endpoint="/health", timeout=10):
                """Check if a service is healthy using curl"""
                try:
                    if port == 8082:
                        url = "http://127.0.0.1:8082/api/health"
                    else:
                        url = f"http://127.0.0.1:{port}{endpoint}"
                    result = subprocess.run(
                        ['curl.exe', '-s', '-f', '--max-time', str(timeout), url],
                        capture_output=True,
                        timeout=timeout + 2
                    )
                    return result.returncode == 0
                except:
                    return False
            
            # Step 1: Verify 9000 and 8082 are healthy FIRST
            log_file.write("Step 1: Verifying core services (9000 and 8082) are healthy...\n")
            log_file.flush()
            
            sm_healthy = check_service_health(9000, timeout=3)
            main_healthy = check_service_health(8082, "/api/health", timeout=10)
            
            if sm_healthy:
                log_file.write("  [OK] Service Manager (9000) is healthy\n")
            else:
                log_file.write("  [WARNING] Service Manager (9000) is not healthy\n")
            
            if main_healthy:
                log_file.write("  [OK] Main App (8082) is healthy\n")
            else:
                log_file.write("  [WARNING] Main App (8082) is not healthy\n")
            
            log_file.write("\n")
            log_file.flush()
            
            # Step 2: Stop all existing services EXCEPT Service Manager (9000) - SIMPLE VERSION
            log_file.write("Step 2: Stopping all services (except Service Manager 9000)...\n")
            log_file.write("  Note: Main App (8082) will be stopped and restarted in Step 4\n")
            log_file.flush()
            
            # Simple approach: Just stop processes on ports using PowerShell (like manual restart)
            # Exclude 8082 from Step 2 since Step 4 will handle it
            ports_to_stop = [8083, 8084, 8086, 8090, 8200, 8202, 8203]
            stopped_count = 0
            for port in ports_to_stop:
                try:
                    # Use proper PowerShell escaping - variable to avoid f-string issues
                    ps_command = f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"
                    result = subprocess.run(
                        ['powershell', '-Command', ps_command],
                        capture_output=True,
                        timeout=5,  # Increased timeout
                        text=True
                    )
                    # Check if command succeeded (returncode 0) or if port was already free (returncode 1 with empty stderr)
                    if result.returncode == 0:
                        stopped_count += 1
                        log_file.write(f"  Stopped port {port}\n")
                    elif result.returncode == 1 and not result.stderr:
                        # Port was already free (no process found)
                        stopped_count += 1
                        log_file.write(f"  Port {port} already stopped\n")
                    else:
                        log_file.write(f"  [WARNING] Port {port} stop returned code {result.returncode}\n")
                    log_file.flush()
                except subprocess.TimeoutExpired:
                    log_file.write(f"  [WARNING] Timeout stopping port {port} - continuing\n")
                    log_file.flush()
                except Exception as e:
                    log_file.write(f"  [INFO] Port {port} error: {e}\n")
                    log_file.flush()
            
            time.sleep(3)  # Wait for ports to be released
            log_file.write(f"[OK] Stopped services on {stopped_count} ports\n\n")
            log_file.flush()
            
            # Step 3: Ensure Service Manager (9000) is running
            log_file.write("Step 3: Ensuring Service Manager (9000) is running...\n")
            log_file.flush()
            
            if not check_service_health(9000, timeout=3):
                log_file.write("  Starting Service Manager (9000)...\n")
                log_file.flush()
                service_manager_script = project_root / "service_manager_daemon.py"
                if service_manager_script.exists():
                    python_exe = sys.executable
                    creation_flags = 0
                    if sys.platform == 'win32':
                        creation_flags = subprocess.CREATE_NO_WINDOW
                    
                    try:
                        # Redirect output to log files (like manual process)
                        # Use append mode to preserve previous logs for debugging
                        log_stdout = open(project_root / "logs" / "service_manager.log", 'a', encoding='utf-8')
                        log_stderr = open(project_root / "logs" / "service_manager_error.log", 'a', encoding='utf-8')
                        
                        sm_process = subprocess.Popen(
                            [python_exe, "service_manager_daemon.py"],
                            cwd=project_root,
                            stdout=log_stdout,
                            stderr=log_stderr,
                            creationflags=creation_flags
                        )
                        log_file.write(f"  Started Service Manager (PID: {sm_process.pid})\n")
                        log_file.flush()
                        
                        # CRITICAL: Wait a moment and check if process is still alive
                        time.sleep(2)
                        if sm_process.poll() is not None:
                            # Process already exited - check error log
                            log_file.write(f"  [ERROR] Service Manager process exited immediately with code {sm_process.returncode}\n")
                            log_file.write("  [ERROR] Check logs/service_manager_error.log for details\n")
                            log_file.flush()
                            # Try to read error log
                            try:
                                with open(project_root / "logs" / "service_manager_error.log", 'r', encoding='utf-8') as err_log:
                                    error_lines = err_log.readlines()
                                    if error_lines:
                                        # Show last 5 lines of error
                                        last_errors = error_lines[-5:] if len(error_lines) > 5 else error_lines
                                        log_file.write(f"  [ERROR] Last errors:\n")
                                        for line in last_errors:
                                            log_file.write(f"    {line}")
                                        log_file.flush()
                            except Exception as read_err:
                                log_file.write(f"  [ERROR] Could not read error log: {read_err}\n")
                                log_file.flush()
                        else:
                            log_file.write(f"  [OK] Service Manager process is running (PID: {sm_process.pid})\n")
                            log_file.flush()
                        
                        # Wait for Service Manager to be healthy
                        sm_ready = False
                        for attempt in range(20):
                            time.sleep(3)
                            # Check if process is still alive
                            if sm_process.poll() is not None:
                                log_file.write(f"  [ERROR] Service Manager process died during startup (exit code: {sm_process.returncode})\n")
                                log_file.write("  [ERROR] Check logs/service_manager_error.log for crash details\n")
                                log_file.flush()
                                break
                            if check_service_health(9000, timeout=3):
                                log_file.write(f"  [OK] Service Manager is healthy (attempt {attempt + 1})\n")
                                log_file.flush()
                                sm_ready = True
                                break
                        
                        if not sm_ready:
                            log_file.write("  [WARNING] Service Manager failed to start after 60 seconds\n")
                            log_file.write("  [WARNING] Continuing anyway - 8082 restart may fail\n")
                            log_file.flush()
                        # Don't close log files - let the process keep them open
                    except Exception as e:
                        log_file.write(f"  [ERROR] Failed to start Service Manager: {e}\n")
                        import traceback
                        log_file.write(f"  [ERROR] Traceback: {traceback.format_exc()}\n")
                        log_file.write("  [WARNING] Continuing anyway - 8082 restart may fail\n")
                        log_file.flush()
                else:
                    log_file.write(f"  [WARNING] Service Manager script not found: {service_manager_script}\n")
                    log_file.flush()
            else:
                log_file.write("  [OK] Service Manager is already running\n")
                log_file.flush()
            
            log_file.write("\n")
            log_file.flush()
            
            # Step 4: Restart Main App (8082) - Simple approach (matches manual restart)
            log_file.write("Step 4: Restarting Main App (8082)...\n")
            log_file.flush()
            
            # Stop 8082 - simple PowerShell approach (exactly like manual restart)
            log_file.write("  Stopping Main App (8082)...\n")
            log_file.flush()
            try:
                ps_command = "Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
                result = subprocess.run(
                    ['powershell', '-Command', ps_command],
                    capture_output=True,
                    timeout=5,
                    text=True
                )
                if result.returncode == 0:
                    log_file.write("  [OK] Stopped Main App (8082)\n")
                elif result.returncode == 1 and not result.stderr:
                    log_file.write("  [INFO] Main App (8082) was not running\n")
                else:
                    log_file.write(f"  [INFO] Main App (8082) stop returned code {result.returncode}\n")
                log_file.flush()
            except Exception as e:
                log_file.write(f"  [INFO] Main App (8082) stop error: {e}\n")
                log_file.flush()
            
            time.sleep(3)  # Wait for port to be released
            
            # Start 8082 - simple approach with log redirection
            log_file.write("  Starting Main App (8082)...\n")
            log_file.flush()
            
            main_app_script = project_root / "8082" / "main_hardened_ready_refactored.py"
            if main_app_script.exists():
                python_exe = sys.executable
                creation_flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
                
                try:
                    # Redirect to log files like other services
                    log_stdout = open(project_root / "logs" / "main_app.log", 'a')
                    log_stderr = open(project_root / "logs" / "main_app_error.log", 'a')
                    
                    main_process = subprocess.Popen(
                        [python_exe, "main_hardened_ready_refactored.py"],
                        cwd=project_root / "8082",
                        stdout=log_stdout,
                        stderr=log_stderr,
                        creationflags=creation_flags
                    )
                    
                    log_file.write(f"  [OK] Started Main App (PID: {main_process.pid})\n")
                    log_file.flush()
                    
                    # Wait and verify 8082 is actually healthy (like manual restart does)
                    log_file.write("  Waiting for Main App to become healthy...\n")
                    log_file.flush()
                    
                    main_healthy = False
                    for attempt in range(20):  # 20 attempts * 3 seconds = 60 seconds max
                        time.sleep(3)
                        
                        # Check if process died
                        if main_process.poll() is not None:
                            log_file.write(f"  [ERROR] Main App process died (exit code: {main_process.returncode})\n")
                            log_file.write("  [ERROR] Check logs/main_app_error.log for details\n")
                            log_file.flush()
                            break
                        
                        # Check if 8082 is actually healthy
                        if check_service_health(8082, "/api/health", timeout=10):
                            log_file.write(f"  [OK] Main App is healthy (attempt {attempt + 1})\n")
                            log_file.flush()
                            main_healthy = True
                            break
                        else:
                            log_file.write(f"  [WAITING] Main App not ready yet (attempt {attempt + 1}/20)\n")
                            log_file.flush()
                    
                    if not main_healthy:
                        log_file.write("  [ERROR] Main App failed to become healthy after 60 seconds\n")
                        log_file.write("  [ERROR] Check logs/main_app_error.log for details\n")
                        log_file.flush()
                    
                except Exception as e:
                    log_file.write(f"  [ERROR] Failed to start Main App: {e}\n")
                    import traceback
                    log_file.write(f"  [ERROR] Traceback: {traceback.format_exc()}\n")
                    log_file.flush()
            else:
                log_file.write(f"  [ERROR] Main App script not found: {main_app_script}\n")
                log_file.flush()
            
            log_file.write("\n")
            log_file.flush()
            
            # Step 5: Start remaining services (only after 9000 and 8082 are secure)
            log_file.write("Step 5: Starting remaining services...\n")
            log_file.flush()
            
            # Verify 9000 and 8082 are still healthy before starting others
            # Use retry logic since 8082 might have a brief hiccup
            log_file.write("  Verifying core services are still healthy...\n")
            log_file.flush()
            
            # Check 9000 with retry
            sm_healthy = False
            for retry in range(3):
                if check_service_health(9000, timeout=3):
                    sm_healthy = True
                    break
                if retry < 2:
                    log_file.write(f"  [RETRY] Service Manager (9000) check failed, retrying... ({retry + 1}/3)\n")
                    log_file.flush()
                    time.sleep(2)
            
            if not sm_healthy:
                log_file.write("  [ERROR] Service Manager (9000) is not healthy - aborting other service starts\n")
                log_file.flush()
                return
            
            # Check 8082 with retry (it was just verified in Step 4, so give it a few chances)
            main_healthy = False
            for retry in range(5):  # More retries for 8082 since it was just confirmed healthy
                if check_service_health(8082, "/api/health", timeout=10):
                    main_healthy = True
                    break
                if retry < 4:
                    log_file.write(f"  [RETRY] Main App (8082) check failed, retrying... ({retry + 1}/5)\n")
                    log_file.flush()
                    time.sleep(3)  # Wait a bit longer between retries
            
            if not main_healthy:
                log_file.write("  [ERROR] Main App (8082) is not healthy after retries - aborting other service starts\n")
                log_file.write("  [INFO] This may be a temporary issue. Try restarting again.\n")
                log_file.flush()
                return
            
            log_file.write("  [OK] Core services verified - proceeding with other services\n")
            log_file.flush()
            
            services_to_start = [
                ("8083", "enhanced_pdf_service.py", "PDF Generator", 8083, "pdf_generator"),
                ("8084", "html_report_service.py", "HTML Reports", 8084, "html_reports"),
                ("8085", "weather_service.py", "Weather Service", 8200, "weather_service"),
                ("8085", "utility_rate_service.py", "Utility Rate Service", 8202, "utility_rate_service"),
                ("8085", "utility_incentive_service.py", "Utility Incentive Service", 8203, "utility_incentive_service"),
                ("8086", "chart_service.py", "Chart Service", 8086, "chart_service"),
                ("8082", "ollama_ai_backend.py", "Ollama AI Backend", 8090, "ollama_ai_backend"),
            ]
            
            python_exe = sys.executable
            creation_flags = 0
            if sys.platform == 'win32':
                creation_flags = subprocess.CREATE_NO_WINDOW
            
            started_services = []
            failed_services = []
            
            for service_dir, script_name, service_name, port, log_name in services_to_start:
                script_path = project_root / service_dir / script_name
                if script_path.exists():
                    try:
                        # Redirect output to log files (like manual process)
                        log_stdout = open(project_root / "logs" / f"{log_name}.log", 'w')
                        log_stderr = open(project_root / "logs" / f"{log_name}_error.log", 'w')
                        
                        process = subprocess.Popen(
                            [python_exe, script_name],
                            cwd=project_root / service_dir,
                            stdout=log_stdout,
                            stderr=log_stderr,
                            creationflags=creation_flags
                        )
                        log_file.write(f"  Started {service_name} (PID: {process.pid})\n")
                        log_file.flush()
                        
                        # Wait a bit for service to start
                        time.sleep(5)
                        
                    except Exception as e:
                        log_file.write(f"  [ERROR] Failed to start {service_name}: {e}\n")
                        log_file.flush()
                        failed_services.append(service_name)
                else:
                    log_file.write(f"  [WARNING] Script not found: {script_path}\n")
                    log_file.flush()
                    failed_services.append(service_name)
            
            # Wait longer before checking health (like manual process - 15 seconds)
            log_file.write("\n  Waiting 15 seconds for services to initialize...\n")
            log_file.flush()
            time.sleep(15)
            
            # Now check health of all services
            log_file.write("  Verifying service health...\n")
            log_file.flush()
            for service_dir, script_name, service_name, port, log_name in services_to_start:
                if service_name not in failed_services:
                    if check_service_health(port, timeout=3):
                        log_file.write(f"  [OK] {service_name} is healthy\n")
                        log_file.flush()
                        started_services.append(service_name)
                    else:
                        log_file.write(f"  [WARNING] {service_name} started but health check failed\n")
                        log_file.flush()
                        started_services.append(service_name)  # Still count as started
            
            log_file.write(f"\n[SUMMARY] Started {len(started_services)}/{len(services_to_start)} services\n")
            if started_services:
                log_file.write(f"  Started: {', '.join(started_services)}\n")
            if failed_services:
                log_file.write(f"  Failed: {', '.join(failed_services)}\n")
            log_file.write("SYNEREX OneForm Services Restart Complete!\n")
            log_file.flush()
            
    except Exception as e:
        import traceback
        error_msg = f"ERROR: Failed to restart services: {e}\n{traceback.format_exc()}"
        print(error_msg)
        try:
            with open(restart_log, 'a', encoding='utf-8') as log_file:
                log_file.write(f"\n{error_msg}\n")
        except:
            pass
    finally:
        # Always remove lock file when done (even if script crashes)
        try:
            if restart_lock.exists():
                restart_lock.unlink()
                print("Lock file removed")
        except Exception as e:
            print(f"Warning: Could not remove lock file: {e}")
            # Try one more time with a short delay
            try:
                time.sleep(0.5)
                if restart_lock.exists():
                    restart_lock.unlink()
                    print("Lock file removed on retry")
            except:
                pass

if __name__ == '__main__':
    restart_services()

