"""Pricing service for calculating license costs."""
from typing import Dict, Any
from decimal import Decimal

# Pricing configuration (in USD)
# This can be moved to config.py or database in production
PRICING = {
    "emv": {
        "single_report": {
            "base_price": Decimal("4200.00"),
            "per_seat": Decimal("0.00"),
            "per_meter": Decimal("0.00"),
            "annual": Decimal("4200.00"),
            "is_one_time": True,
            "description": "One-time license for a single report",
        },
        "annual": {
            "base_price": Decimal("53000.00"),
            "per_seat": Decimal("0.00"),
            "per_meter": Decimal("0.00"),
            "annual": Decimal("53000.00"),
            "is_one_time": False,
            "description": "Annual license with unlimited reports",
        },
    },
    "tracking": {
        "basic": {
            "base_price": Decimal("495.00"),
            "per_seat": Decimal("0.00"),
            "per_meter": Decimal("750.00"),
            "annual": Decimal("495.00"),
            "max_users": 5,
            "description": "Read Only Version",
        },
        "pro": {
            "base_price": Decimal("950.00"),
            "per_seat": Decimal("0.00"),
            "per_meter": Decimal("795.00"),
            "annual": Decimal("950.00"),
            "max_users": 15,
            "description": "Equipment Scheduling",
        },
        "enterprise": {
            "base_price": Decimal("1495.00"),
            "per_seat": Decimal("0.00"),
            "per_meter": Decimal("750.00"),
            "annual": Decimal("1495.00"),
            "max_users": None,  # Unlimited
            "description": "Full Scheduling/Reporting",
        },
    },
}

def calculate_price(
    program_id: str,
    plan: str,
    term_days: int = 365,
    seat_count: int = 0,
    meter_count: int = 0,
) -> Dict[str, Any]:
    """
    Calculate pricing for a license order.
    
    Args:
        program_id: "emv" or "tracking"
        plan: "baseline"/"basic", "pro", or "enterprise"
        term_days: License term in days (default 365)
        seat_count: Number of seats/users
        meter_count: Number of meters/devices
        
    Returns:
        Dict with pricing breakdown:
        {
            "base_price": "99.00",
            "seat_cost": "0.00",
            "meter_cost": "0.00",
            "subtotal": "99.00",
            "term_multiplier": 1.0,
            "amount_total": "99.00",
            "currency": "USD",
            "breakdown": {...}
        }
    """
    if program_id not in PRICING:
        raise ValueError(f"Unknown program_id: {program_id}")
    
    program_pricing = PRICING[program_id]
    
    # Normalize plan names
    plan_map = {
        "baseline": "baseline",
        "single_report": "single_report",
        "annual": "annual",
        "basic": "basic",
        "pro": "pro",
        "enterprise": "enterprise",
    }
    
    normalized_plan = plan_map.get(plan.lower(), plan.lower())
    
    if normalized_plan not in program_pricing:
        raise ValueError(f"Unknown plan '{plan}' for program '{program_id}'")
    
    pricing = program_pricing[normalized_plan]
    
    # Calculate base price
    base_price = pricing["base_price"]
    
    # Calculate seat cost
    seat_cost = pricing["per_seat"] * seat_count
    
    # Calculate meter cost
    meter_cost = pricing["per_meter"] * meter_count
    
    # Calculate subtotal
    subtotal = base_price + seat_cost + meter_cost
    
    # Calculate term multiplier (prorated for partial years)
    term_multiplier = Decimal(str(term_days)) / Decimal("365")
    
    # Calculate total
    amount_total = subtotal * term_multiplier
    
    return {
        "base_price": str(base_price),
        "seat_cost": str(seat_cost),
        "meter_cost": str(meter_cost),
        "subtotal": str(subtotal),
        "term_multiplier": float(term_multiplier),
        "amount_total": str(amount_total.quantize(Decimal("0.01"))),
        "currency": "USD",
        "breakdown": {
            "program": program_id,
            "plan": normalized_plan,
            "term_days": term_days,
            "seat_count": seat_count,
            "meter_count": meter_count,
            "base_price": str(base_price),
            "per_seat": str(pricing["per_seat"]),
            "per_meter": str(pricing["per_meter"]),
            "seat_total": str(seat_cost),
            "meter_total": str(meter_cost),
        }
    }

def get_pricing_info(program_id: str, plan: str) -> Dict[str, Any]:
    """Get pricing information for a plan (for display purposes)."""
    if program_id not in PRICING:
        return {}
    
    program_pricing = PRICING[program_id]
    plan_map = {
        "baseline": "baseline",
        "basic": "basic",
        "pro": "pro",
        "enterprise": "enterprise",
    }
    
    normalized_plan = plan_map.get(plan.lower(), plan.lower())
    
    if normalized_plan not in program_pricing:
        return {}
    
    pricing = program_pricing[normalized_plan]
    
    return {
        "base_price": str(pricing["base_price"]),
        "annual_price": str(pricing["annual"]),
        "per_seat": str(pricing["per_seat"]),
        "per_meter": str(pricing["per_meter"]),
        "currency": "USD",
    }

