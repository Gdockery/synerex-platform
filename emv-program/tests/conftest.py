"""
Pytest configuration and shared fixtures for SYNEREX OneForm tests
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "8082"))
sys.path.insert(0, str(project_root / "8083"))
sys.path.insert(0, str(project_root / "8084"))
sys.path.insert(0, str(project_root / "8085"))
sys.path.insert(0, str(project_root / "8086"))

import pytest


@pytest.fixture
def sample_csv_data():
    """Sample CSV data for testing"""
    return """timestamp,kw,kva,kvar,pf,thd,voltage,current
2025-01-01 00:00:00,100.5,120.3,60.2,0.85,5.2,480.0,150.0
2025-01-01 00:01:00,102.1,121.5,61.0,0.84,5.3,479.5,151.2
2025-01-01 00:02:00,98.7,119.8,59.5,0.86,5.1,480.5,149.8"""


@pytest.fixture
def sample_power_quality_data():
    """Sample power quality data structure"""
    return {
        "before": {
            "avgKw": 100.5,
            "avgKva": 120.3,
            "avgKvar": 60.2,
            "avgPf": 0.85,
            "avgTHD": 5.2,
            "voltage": 480.0,
            "current": 150.0
        },
        "after": {
            "avgKw": 95.2,
            "avgKva": 98.5,
            "avgKvar": 30.1,
            "avgPf": 0.97,
            "avgTHD": 1.5,
            "voltage": 485.0,
            "current": 145.0
        }
    }

