"""
XECO Product Knowledge System for SynerexAI
Comprehensive database of XECO products and installation recommendations
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class XECOProduct:
    """XECO Product Information"""
    model: str
    series: str
    category: str
    description: str
    specifications: Dict[str, Any]
    installation_requirements: Dict[str, Any]
    wiring_requirements: Dict[str, Any]
    maintenance_schedule: Dict[str, Any]
    applications: List[str]
    compatible_equipment: List[str]

class XECOProductDatabase:
    """
    Comprehensive XECO Product Knowledge Database
    Contains all XECO products with detailed specifications and installation guidance
    """
    
    def __init__(self):
        self.products = self._initialize_xeco_products()
        self.installation_guides = self._initialize_installation_guides()
        self.troubleshooting_guides = self._initialize_troubleshooting_guides()
    
    def _initialize_xeco_products(self) -> Dict[str, XECOProduct]:
        """Initialize comprehensive XECO product database"""
        return {
            # Power Quality Products
            'xeco_hf_series': XECOProduct(
                model='XECO-HF Series',
                series='Harmonic Filters',
                category='Power Quality',
                description='Advanced harmonic filtering solutions for industrial and commercial applications',
                specifications={
                    'voltage_rating': '480V, 600V, 1000V',
                    'current_rating': '50A to 2000A',
                    'frequency': '50/60 Hz',
                    'harmonic_filtering': '5th, 7th, 11th, 13th harmonics',
                    'efficiency': '>98%',
                    'temperature_range': '-40°C to +70°C',
                    'enclosure_rating': 'NEMA 3R, 4, 4X'
                },
                installation_requirements={
                    'mounting': 'Wall mount or floor mount',
                    'clearance': 'Minimum 3 feet front, 1 foot sides',
                    'electrical_room': 'Indoor installation recommended',
                    'ventilation': 'Natural or forced ventilation required',
                    'foundation': 'Concrete pad for floor mount units',
                    'access': 'Front access for maintenance'
                },
                wiring_requirements={
                    'conductor_size': 'Per NEC ampacity tables',
                    'conduit': 'Rigid or EMT conduit',
                    'grounding': 'Equipment grounding conductor required',
                    'connections': 'Lug connections for main conductors',
                    'control_wiring': '24V DC control circuits',
                    'communication': 'RS485, Modbus RTU, Ethernet'
                },
                maintenance_schedule={
                    'daily': 'Visual inspection for alarms',
                    'monthly': 'Check filter performance',
                    'quarterly': 'Clean air filters, check connections',
                    'annually': 'Complete electrical testing',
                    'as_needed': 'Replace filter elements'
                },
                applications=[
                    'Industrial facilities with VFDs',
                    'Data centers with UPS systems',
                    'Commercial buildings with LED lighting',
                    'Manufacturing plants with variable loads'
                ],
                compatible_equipment=[
                    'Variable Frequency Drives (VFDs)',
                    'Uninterruptible Power Supplies (UPS)',
                    'LED lighting systems',
                    'Computer equipment',
                    'Medical equipment'
                ]
            ),
            
            'xeco_pfc_series': XECOProduct(
                model='XECO-PFC Series',
                series='Power Factor Correction',
                category='Power Quality',
                description='Automatic power factor correction systems for improved energy efficiency',
                specifications={
                    'voltage_rating': '208V, 240V, 480V, 600V',
                    'current_rating': '25A to 1000A',
                    'power_factor': '0.95 to 1.0 correction',
                    'switching': 'Thyristor or contactor switching',
                    'control': 'Microprocessor-based control',
                    'display': 'LCD display with status indicators',
                    'protection': 'Overcurrent and overvoltage protection'
                },
                installation_requirements={
                    'mounting': 'Wall mount or floor mount',
                    'clearance': 'Minimum 2 feet front, 6 inches sides',
                    'electrical_room': 'Indoor installation',
                    'ventilation': 'Natural ventilation adequate',
                    'foundation': 'Level mounting surface',
                    'access': 'Front access for operation'
                },
                wiring_requirements={
                    'conductor_size': 'Per NEC ampacity tables',
                    'conduit': 'Rigid or EMT conduit',
                    'grounding': 'Equipment grounding conductor',
                    'connections': 'Lug connections',
                    'control_wiring': '24V DC control circuits',
                    'communication': 'RS485, Modbus RTU'
                },
                maintenance_schedule={
                    'daily': 'Check power factor readings',
                    'monthly': 'Inspect capacitor banks',
                    'quarterly': 'Test switching operation',
                    'annually': 'Complete electrical testing',
                    'as_needed': 'Replace capacitors if needed'
                },
                applications=[
                    'Industrial facilities',
                    'Commercial buildings',
                    'Hospitals and healthcare',
                    'Educational facilities'
                ],
                compatible_equipment=[
                    'Induction motors',
                    'Transformers',
                    'Fluorescent lighting',
                    'Welding equipment',
                    'Arc furnaces'
                ]
            ),
            
            'xeco_vr_series': XECOProduct(
                model='XECO-VR Series',
                series='Voltage Regulation',
                category='Power Quality',
                description='Automatic voltage regulation systems for stable power supply',
                specifications={
                    'voltage_rating': '120V, 208V, 240V, 480V',
                    'current_rating': '30A to 800A',
                    'regulation': '±1% voltage regulation',
                    'response_time': '<1 cycle',
                    'efficiency': '>97%',
                    'cooling': 'Natural or forced air cooling',
                    'protection': 'Overcurrent, overvoltage, undervoltage'
                },
                installation_requirements={
                    'mounting': 'Wall mount or floor mount',
                    'clearance': 'Minimum 3 feet front, 1 foot sides',
                    'electrical_room': 'Indoor installation',
                    'ventilation': 'Adequate air circulation',
                    'foundation': 'Level mounting surface',
                    'access': 'Front and rear access required'
                },
                wiring_requirements={
                    'conductor_size': 'Per NEC ampacity tables',
                    'conduit': 'Rigid or EMT conduit',
                    'grounding': 'Equipment grounding conductor',
                    'connections': 'Lug connections',
                    'control_wiring': '24V DC control circuits',
                    'communication': 'RS485, Modbus RTU, Ethernet'
                },
                maintenance_schedule={
                    'daily': 'Check voltage readings',
                    'monthly': 'Inspect tap changer operation',
                    'quarterly': 'Test voltage regulation',
                    'annually': 'Complete electrical testing',
                    'as_needed': 'Lubricate tap changer mechanism'
                },
                applications=[
                    'Sensitive electronic equipment',
                    'Medical equipment',
                    'Computer systems',
                    'Laboratory equipment'
                ],
                compatible_equipment=[
                    'UPS systems',
                    'Computer equipment',
                    'Medical devices',
                    'Laboratory instruments',
                    'Telecommunications equipment'
                ]
            ),
            
            # Energy Management Products
            'xeco_em_series': XECOProduct(
                model='XECO-EM Series',
                series='Energy Management',
                category='Energy Management',
                description='Comprehensive energy monitoring and management systems',
                specifications={
                    'voltage_rating': '120V to 600V',
                    'current_rating': '5A to 5000A',
                    'accuracy': '0.2% for energy, 0.1% for power',
                    'communication': 'RS485, Modbus RTU, Ethernet, WiFi',
                    'display': 'Touchscreen LCD display',
                    'data_logging': '1 year of data storage',
                    'alarms': 'Configurable alarm system'
                },
                installation_requirements={
                    'mounting': 'Panel mount or wall mount',
                    'clearance': 'Minimum 2 feet front',
                    'electrical_room': 'Indoor installation',
                    'ventilation': 'Natural ventilation adequate',
                    'foundation': 'Panel mounting required',
                    'access': 'Front access for operation'
                },
                wiring_requirements={
                    'conductor_size': 'Per NEC ampacity tables',
                    'conduit': 'Rigid or EMT conduit',
                    'grounding': 'Equipment grounding conductor',
                    'connections': 'Screw terminals',
                    'control_wiring': '24V DC control circuits',
                    'communication': 'Ethernet cable, RS485 cable'
                },
                maintenance_schedule={
                    'daily': 'Check system status',
                    'monthly': 'Review energy reports',
                    'quarterly': 'Calibrate sensors',
                    'annually': 'Complete system testing',
                    'as_needed': 'Update firmware'
                },
                applications=[
                    'Building energy management',
                    'Industrial energy monitoring',
                    'Utility sub-metering',
                    'Energy auditing'
                ],
                compatible_equipment=[
                    'Power meters',
                    'Current transformers',
                    'Voltage transformers',
                    'Communication networks',
                    'Building automation systems'
                ]
            ),
            
            # Monitoring and Control Products
            'xeco_mc_series': XECOProduct(
                model='XECO-MC Series',
                series='Monitoring and Control',
                category='Monitoring',
                description='Advanced monitoring and control systems for electrical equipment',
                specifications={
                    'voltage_rating': '24V DC to 600V AC',
                    'current_rating': '1A to 1000A',
                    'inputs': '16 analog, 32 digital',
                    'outputs': '8 relay outputs',
                    'communication': 'RS485, Modbus RTU, Ethernet',
                    'display': 'LCD display with keypad',
                    'memory': '1MB data storage'
                },
                installation_requirements={
                    'mounting': 'Panel mount or DIN rail',
                    'clearance': 'Minimum 1 foot front',
                    'electrical_room': 'Indoor installation',
                    'ventilation': 'Natural ventilation adequate',
                    'foundation': 'Panel mounting required',
                    'access': 'Front access for operation'
                },
                wiring_requirements={
                    'conductor_size': 'Per NEC ampacity tables',
                    'conduit': 'Rigid or EMT conduit',
                    'grounding': 'Equipment grounding conductor',
                    'connections': 'Screw terminals',
                    'control_wiring': '24V DC control circuits',
                    'communication': 'RS485 cable, Ethernet cable'
                },
                maintenance_schedule={
                    'daily': 'Check system status',
                    'monthly': 'Review alarm logs',
                    'quarterly': 'Test input/output functions',
                    'annually': 'Complete system testing',
                    'as_needed': 'Update configuration'
                },
                applications=[
                    'Electrical equipment monitoring',
                    'Power system control',
                    'Building automation',
                    'Industrial process control'
                ],
                compatible_equipment=[
                    'Circuit breakers',
                    'Contactors',
                    'Relays',
                    'Sensors',
                    'Actuators'
                ]
            )
        }
    
    def _initialize_installation_guides(self) -> Dict[str, Dict[str, Any]]:
        """Initialize XECO installation guides"""
        return {
            'general_installation': {
                'title': 'General XECO Installation Requirements',
                'requirements': [
                    'All installations must comply with NEC and local codes',
                    'Qualified electrician required for installation',
                    'Proper grounding and bonding required',
                    'Adequate ventilation and clearance maintained',
                    'Electrical permits obtained before installation',
                    'Installation inspected by local authority'
                ],
                'safety_requirements': [
                    'Lockout/tagout procedures followed',
                    'Personal protective equipment worn',
                    'Electrical safety training completed',
                    'Emergency procedures established',
                    'First aid equipment available'
                ]
            },
            'power_quality_installation': {
                'title': 'Power Quality Equipment Installation',
                'requirements': [
                    'Install upstream of protected equipment',
                    'Maintain proper phase sequence',
                    'Ensure adequate current capacity',
                    'Provide proper ventilation',
                    'Install surge protection',
                    'Test before energizing'
                ],
                'testing_procedures': [
                    'Insulation resistance testing',
                    'Continuity testing',
                    'Phase rotation verification',
                    'Voltage and current measurements',
                    'Harmonic analysis',
                    'Power factor measurements'
                ]
            },
            'energy_management_installation': {
                'title': 'Energy Management System Installation',
                'requirements': [
                    'Install current transformers properly',
                    'Connect voltage transformers correctly',
                    'Establish communication network',
                    'Configure system parameters',
                    'Test all functions',
                    'Train operators'
                ],
                'commissioning': [
                    'System startup procedures',
                    'Parameter configuration',
                    'Communication testing',
                    'Data logging verification',
                    'Alarm testing',
                    'Performance verification'
                ]
            }
        }
    
    def _initialize_troubleshooting_guides(self) -> Dict[str, Dict[str, Any]]:
        """Initialize XECO troubleshooting guides"""
        return {
            'common_issues': {
                'title': 'Common XECO Equipment Issues',
                'issues': {
                    'no_power': {
                        'symptom': 'Equipment not powering up',
                        'causes': ['Power supply failure', 'Fuse blown', 'Circuit breaker tripped'],
                        'solutions': ['Check power supply', 'Replace fuse', 'Reset circuit breaker']
                    },
                    'communication_error': {
                        'symptom': 'Communication failure',
                        'causes': ['Wiring issues', 'Address conflicts', 'Protocol mismatch'],
                        'solutions': ['Check wiring', 'Verify addresses', 'Check protocol settings']
                    },
                    'alarm_conditions': {
                        'symptom': 'Equipment alarms',
                        'causes': ['Overcurrent', 'Overvoltage', 'Temperature high'],
                        'solutions': ['Check load', 'Verify voltage', 'Check ventilation']
                    }
                }
            },
            'maintenance_procedures': {
                'title': 'XECO Maintenance Procedures',
                'procedures': {
                    'daily': ['Visual inspection', 'Check alarms', 'Monitor performance'],
                    'weekly': ['Clean equipment', 'Check connections', 'Review logs'],
                    'monthly': ['Test functions', 'Calibrate sensors', 'Update firmware'],
                    'quarterly': ['Complete testing', 'Replace filters', 'Lubricate moving parts'],
                    'annually': ['Full inspection', 'Electrical testing', 'Performance analysis']
                }
            }
        }
    
    def get_product_info(self, product_model: str) -> Optional[XECOProduct]:
        """Get detailed information about a specific XECO product"""
        return self.products.get(product_model.lower())
    
    def get_installation_guide(self, product_model: str) -> Dict[str, Any]:
        """Get installation guide for a specific XECO product"""
        product = self.get_product_info(product_model)
        if not product:
            return {}
        
        return {
            'product': product.model,
            'installation_requirements': product.installation_requirements,
            'wiring_requirements': product.wiring_requirements,
            'general_requirements': self.installation_guides['general_installation'],
            'safety_requirements': self.installation_guides['general_installation']['safety_requirements']
        }
    
    def get_troubleshooting_guide(self, product_model: str, issue: str) -> Dict[str, Any]:
        """Get troubleshooting guide for a specific XECO product and issue"""
        return {
            'product': product_model,
            'issue': issue,
            'common_issues': self.troubleshooting_guides['common_issues'],
            'maintenance_procedures': self.troubleshooting_guides['maintenance_procedures']
        }
    
    def search_products(self, category: str = None, application: str = None) -> List[XECOProduct]:
        """Search XECO products by category or application"""
        results = []
        for product in self.products.values():
            if category and product.category.lower() == category.lower():
                results.append(product)
            elif application and any(app.lower() in application.lower() for app in product.applications):
                results.append(product)
        return results
    
    def get_compatible_equipment(self, product_model: str) -> List[str]:
        """Get list of compatible equipment for a specific XECO product"""
        product = self.get_product_info(product_model)
        return product.compatible_equipment if product else []
    
    def get_maintenance_schedule(self, product_model: str) -> Dict[str, List[str]]:
        """Get maintenance schedule for a specific XECO product"""
        product = self.get_product_info(product_model)
        return product.maintenance_schedule if product else {}

# Global XECO product database instance
xeco_database = XECOProductDatabase()

def get_xeco_product_info(product_model: str) -> Optional[XECOProduct]:
    """Convenience function to get XECO product information"""
    return xeco_database.get_product_info(product_model)

def get_xeco_installation_guide(product_model: str) -> Dict[str, Any]:
    """Convenience function to get XECO installation guide"""
    return xeco_database.get_installation_guide(product_model)

def get_xeco_troubleshooting_guide(product_model: str, issue: str) -> Dict[str, Any]:
    """Convenience function to get XECO troubleshooting guide"""
    return xeco_database.get_troubleshooting_guide(product_model, issue)

def search_xeco_products(category: str = None, application: str = None) -> List[XECOProduct]:
    """Convenience function to search XECO products"""
    return xeco_database.search_products(category, application)
