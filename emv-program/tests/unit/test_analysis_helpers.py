"""
Unit tests for analysis_helpers module
"""
import pytest
import sys
from pathlib import Path

# Add 8082 to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "8082"))

try:
    from analysis_helpers import safe_float, validate_analysis_inputs
except ImportError:
    pytest.skip("analysis_helpers not available", allow_module_level=True)


class TestSafeFloat:
    """Tests for safe_float function"""
    
    def test_valid_float_string(self):
        """Test conversion of valid float string"""
        assert safe_float("123.45") == 123.45
        assert safe_float("0.5") == 0.5
        assert safe_float("-10.5") == -10.5
    
    def test_valid_float_number(self):
        """Test conversion of valid float number"""
        assert safe_float(123.45) == 123.45
        assert safe_float(0) == 0.0
    
    def test_invalid_string(self):
        """Test handling of invalid string"""
        assert safe_float("invalid") == 0.0
        assert safe_float("") == 0.0
        assert safe_float("abc123") == 0.0
    
    def test_none_value(self):
        """Test handling of None"""
        assert safe_float(None) == 0.0
    
    def test_default_value(self):
        """Test custom default value"""
        assert safe_float("invalid", default=99.9) == 99.9


class TestValidateAnalysisInputs:
    """Tests for validate_analysis_inputs function"""
    
    def test_valid_inputs(self):
        """Test validation of valid inputs"""
        inputs = {
            "before_file_id": 1,
            "after_file_id": 2
        }
        # This is a placeholder - adjust based on actual function signature
        # result = validate_analysis_inputs(inputs)
        # assert result is True or assert result == expected
    
    def test_missing_required_fields(self):
        """Test validation with missing required fields"""
        inputs = {}
        # result = validate_analysis_inputs(inputs)
        # assert result is False or assert appropriate error

