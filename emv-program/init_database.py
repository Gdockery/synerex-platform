#!/usr/bin/env python3
import sys
import os
sys.path.append('8082')

from main_hardened_ready_fixed import init_database

try:
    init_database()
    print("Database initialized successfully")
except Exception as e:
    print(f"Error initializing database: {e}")

