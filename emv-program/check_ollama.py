#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ollama Diagnostic Script for SYNEREX
Checks each item on the installation checklist
"""

import requests
import subprocess
import sys
import json
import os
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    try:
        os.system('chcp 65001 >nul 2>&1')
    except:
        pass

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def print_check(item, status, details=""):
    try:
        symbol = "[OK]" if status else "[FAIL]"
        print(f"{symbol} {item}")
        if details:
            print(f"   {details}")
    except UnicodeEncodeError:
        # Fallback for encoding issues
        symbol = "[OK]" if status else "[FAIL]"
        print(f"{symbol} {item}")
        if details:
            print(f"   {details}")

def check_ollama_installed():
    """Check if Ollama command is available"""
    print_header("1. Checking if Ollama is Installed")
    try:
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print_check("Ollama is installed", True, result.stdout.strip())
            return True
        else:
            print_check("Ollama is installed", False, "Command failed")
            return False
    except FileNotFoundError:
        print_check("Ollama is installed", False, "Ollama command not found. Please install from https://ollama.ai/download")
        return False
    except Exception as e:
        print_check("Ollama is installed", False, f"Error: {e}")
        return False

def check_ollama_running():
    """Check if Ollama service is running on port 11434"""
    print_header("2. Checking if Ollama Service is Running")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            model_names = [m.get('name', 'unknown') for m in models]
            print_check("Ollama service is running", True, f"Port 11434 is accessible")
            if model_names:
                print(f"   Available models: {', '.join(model_names)}")
            return True
        else:
            print_check("Ollama service is running", False, f"HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_check("Ollama service is running", False, "Connection refused - Ollama is not running")
        print("   Solution: Start Ollama from Start menu or run 'ollama serve'")
        return False
    except Exception as e:
        print_check("Ollama service is running", False, f"Error: {e}")
        return False

def check_model_available():
    """Check if llama3.2:1b model is available"""
    print_header("3. Checking if Model 'llama3.2:1b' is Available")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            model_names = [m.get('name', '') for m in models]
            
            if 'llama3.2:1b' in model_names:
                print_check("Model 'llama3.2:1b' is available", True)
                return True
            else:
                print_check("Model 'llama3.2:1b' is available", False, f"Model not found. Available: {', '.join(model_names) if model_names else 'none'}")
                print("   Solution: Run 'ollama pull llama3.2:1b'")
                return False
        else:
            print_check("Model 'llama3.2:1b' is available", False, "Cannot check - Ollama not running")
            return False
    except Exception as e:
        print_check("Model 'llama3.2:1b' is available", False, f"Error: {e}")
        return False

def test_ollama_directly():
    """Test Ollama with a direct API call"""
    print_header("4. Testing Ollama Directly")
    try:
        payload = {
            "model": "llama3.2:1b",
            "prompt": "Say 'Hello' if you can read this.",
            "stream": False
        }
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            print_check("Ollama responds to API calls", True, f"Response: {response_text[:50]}...")
            return True
        else:
            print_check("Ollama responds to API calls", False, f"HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_check("Ollama responds to API calls", False, "Connection refused - Ollama not running")
        return False
    except requests.exceptions.Timeout:
        print_check("Ollama responds to API calls", False, "Request timed out")
        return False
    except Exception as e:
        print_check("Ollama responds to API calls", False, f"Error: {e}")
        return False

def check_backend_service():
    """Check if SYNEREX backend service (8090) is running"""
    print_header("5. Checking SYNEREX Backend Service (Port 8090)")
    try:
        response = requests.get("http://localhost:8090/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            ollama_status = data.get('ollama_status', 'unknown')
            model = data.get('model', 'unknown')
            kb_stats = data.get('knowledge_base', {})
            
            print_check("Backend service is running", True, f"Port 8090 is accessible")
            print(f"   Model configured: {model}")
            print(f"   Ollama status: {ollama_status}")
            print(f"   Knowledge base: {sum(kb_stats.values())} items loaded")
            
            if ollama_status == "healthy":
                print_check("Backend can connect to Ollama", True)
                return True
            else:
                print_check("Backend can connect to Ollama", False, f"Status: {ollama_status}")
                return False
        else:
            print_check("Backend service is running", False, f"HTTP {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_check("Backend service is running", False, "Connection refused - Service not running")
        print("   Solution: Start services using start_services.bat")
        return False
    except Exception as e:
        print_check("Backend service is running", False, f"Error: {e}")
        return False

def test_full_ai_pipeline():
    """Test the full AI pipeline through the backend"""
    print_header("6. Testing Full AI Pipeline")
    try:
        payload = {
            "question": "Hello, can you help me with power quality analysis?",
            "project_context": {},
            "conversation_history": []
        }
        response = requests.post(
            "http://localhost:8090/api/ai/chat",
            json=payload,
            timeout=60
        )
        if response.status_code == 200:
            data = response.json()
            ai_response = data.get('response', '')
            print_check("Full AI pipeline works", True, f"Got response: {ai_response[:100]}...")
            return True
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_msg = error_data.get('error', response.text[:100])
            print_check("Full AI pipeline works", False, f"HTTP {response.status_code}: {error_msg}")
            return False
    except requests.exceptions.ConnectionError:
        print_check("Full AI pipeline works", False, "Backend service not running")
        return False
    except requests.exceptions.Timeout:
        print_check("Full AI pipeline works", False, "Request timed out - Ollama may be slow or not responding")
        return False
    except Exception as e:
        print_check("Full AI pipeline works", False, f"Error: {e}")
        return False

def check_logs():
    """Check recent logs for errors"""
    print_header("7. Checking Recent Logs")
    log_file = Path("logs/ollama_ai_backend.log")
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Check last 20 lines
                recent_lines = lines[-20:] if len(lines) > 20 else lines
                
                # Look for connection errors
                has_error = any("connection error" in line.lower() or "failed" in line.lower() for line in recent_lines)
                has_success = any("connection successful" in line.lower() or "ollama response received" in line.lower() for line in recent_lines)
                
                if has_success:
                    print_check("Logs show successful connections", True)
                elif has_error:
                    print_check("Logs show connection errors", False, "See logs/ollama_ai_backend.log for details")
                else:
                    print_check("Logs checked", True, "No recent errors found")
                
                # Show last few lines
                print("\n   Last 5 log lines:")
                for line in recent_lines[-5:]:
                    print(f"   {line.strip()}")
        except Exception as e:
            print_check("Logs checked", False, f"Error reading logs: {e}")
    else:
        print_check("Logs checked", False, "Log file not found")

def main():
    print("\n" + "="*60)
    print("  SYNEREX Ollama Diagnostic Tool")
    print("="*60)
    
    results = {
        "ollama_installed": check_ollama_installed(),
        "ollama_running": check_ollama_running(),
        "model_available": check_model_available(),
        "ollama_responds": test_ollama_directly(),
        "backend_running": check_backend_service(),
        "full_pipeline": test_full_ai_pipeline(),
    }
    
    check_logs()
    
    # Summary
    print_header("SUMMARY")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print(f"Passed: {passed}/{total} checks")
    
    if all(results.values()):
        print("\n[SUCCESS] ALL CHECKS PASSED! Ollama is fully configured and working.")
    else:
        print("\n[WARNING] SOME CHECKS FAILED. Please address the issues above.")
        print("\nRecommended actions:")
        if not results["ollama_installed"]:
            print("  1. Install Ollama from https://ollama.ai/download")
        if not results["ollama_running"]:
            print("  2. Start Ollama service (check Task Manager or Start menu)")
        if not results["model_available"]:
            print("  3. Run: ollama pull llama3.2:1b")
        if not results["backend_running"]:
            print("  4. Start SYNEREX services using start_services.bat")

if __name__ == "__main__":
    main()

