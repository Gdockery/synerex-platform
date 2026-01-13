#!/usr/bin/env python3
"""
XECO Website Integration for SynerexAI
Integrates xecoenergy.com products and installation guides
"""

import requests
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import re
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class XECOProduct:
    """XECO Product from website"""
    name: str
    model: str
    category: str
    description: str
    specifications: Dict[str, Any]
    installation_guide_url: str
    datasheet_url: str
    applications: List[str]
    features: List[str]

@dataclass
class XECOInstallationGuide:
    """XECO Installation Guide"""
    product_model: str
    title: str
    steps: List[str]
    requirements: List[str]
    tools_needed: List[str]
    safety_notes: List[str]
    troubleshooting: List[str]

class XECOWebsiteIntegration:
    """
    XECO Website Integration System
    Fetches and processes XECO products and installation guides from xecoenergy.com
    """
    
    def __init__(self):
        self.base_url = "https://xecoenergy.com"
        self.products_url = f"{self.base_url}/products"
        self.installation_guides_url = f"{self.base_url}/installation-guides"
        self.knowledge_base_path = "knowledge_base/xeco_website"
        self.ensure_directories()
    
    def ensure_directories(self):
        """Create necessary directories"""
        import os
        os.makedirs(self.knowledge_base_path, exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/products", exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/installation_guides", exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/datasheets", exist_ok=True)
    
    def fetch_xeco_products(self) -> List[XECOProduct]:
        """Fetch XECO products from website"""
        products = []
        
        try:
            # Fetch main products page
            response = requests.get(self.products_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find product listings (adjust selectors based on actual website structure)
            product_elements = soup.find_all(['div', 'article'], class_=re.compile(r'product|item'))
            
            for element in product_elements:
                try:
                    product = self._extract_product_info(element)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.warning(f"Error extracting product: {e}")
                    continue
            
            logger.info(f"Fetched {len(products)} XECO products from website")
            return products
            
        except requests.RequestException as e:
            logger.error(f"Error fetching XECO products: {e}")
            return self._get_fallback_products()
    
    def _extract_product_info(self, element) -> Optional[XECOProduct]:
        """Extract product information from HTML element"""
        try:
            # Extract product name
            name_element = element.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name|product'))
            name = name_element.get_text(strip=True) if name_element else "Unknown Product"
            
            # Extract model number
            model_element = element.find(['span', 'div'], class_=re.compile(r'model|sku|part'))
            model = model_element.get_text(strip=True) if model_element else name
            
            # Extract description
            desc_element = element.find(['p', 'div'], class_=re.compile(r'description|summary|content'))
            description = desc_element.get_text(strip=True) if desc_element else ""
            
            # Extract category
            category_element = element.find(['span', 'div'], class_=re.compile(r'category|type|class'))
            category = category_element.get_text(strip=True) if category_element else "General"
            
            # Extract links
            links = element.find_all('a', href=True)
            installation_guide_url = ""
            datasheet_url = ""
            
            for link in links:
                href = link.get('href', '')
                if 'installation' in href.lower() or 'guide' in href.lower():
                    installation_guide_url = href if href.startswith('http') else f"{self.base_url}{href}"
                elif 'datasheet' in href.lower() or 'spec' in href.lower():
                    datasheet_url = href if href.startswith('http') else f"{self.base_url}{href}"
            
            # Extract specifications (if available in structured format)
            specs = self._extract_specifications(element)
            
            # Extract applications and features
            applications = self._extract_applications(element)
            features = self._extract_features(element)
            
            return XECOProduct(
                name=name,
                model=model,
                category=category,
                description=description,
                specifications=specs,
                installation_guide_url=installation_guide_url,
                datasheet_url=datasheet_url,
                applications=applications,
                features=features
            )
            
        except Exception as e:
            logger.error(f"Error extracting product info: {e}")
            return None
    
    def _extract_specifications(self, element) -> Dict[str, Any]:
        """Extract product specifications"""
        specs = {}
        
        # Look for specification tables or lists
        spec_tables = element.find_all(['table', 'ul', 'ol'], class_=re.compile(r'spec|specification'))
        
        for spec_container in spec_tables:
            rows = spec_container.find_all(['tr', 'li'])
            for row in rows:
                cells = row.find_all(['td', 'th', 'span'])
                if len(cells) >= 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    specs[key] = value
        
        return specs
    
    def _extract_applications(self, element) -> List[str]:
        """Extract product applications"""
        applications = []
        
        # Look for application-related content
        app_elements = element.find_all(['span', 'div', 'li'], class_=re.compile(r'application|use|purpose'))
        
        for app_element in app_elements:
            text = app_element.get_text(strip=True)
            if text and len(text) > 3:
                applications.append(text)
        
        return applications[:5]  # Limit to 5 applications
    
    def _extract_features(self, element) -> List[str]:
        """Extract product features"""
        features = []
        
        # Look for feature-related content
        feature_elements = element.find_all(['span', 'div', 'li'], class_=re.compile(r'feature|benefit|advantage'))
        
        for feature_element in feature_elements:
            text = feature_element.get_text(strip=True)
            if text and len(text) > 3:
                features.append(text)
        
        return features[:5]  # Limit to 5 features
    
    def _get_fallback_products(self) -> List[XECOProduct]:
        """Fallback products if website is unavailable"""
        return [
            XECOProduct(
                name="XECO Harmonic Filter",
                model="XECO-HF",
                category="Power Quality",
                description="Advanced harmonic filtering solution for industrial applications",
                specifications={
                    "voltage_rating": "480V, 600V, 1000V",
                    "current_rating": "50A to 2000A",
                    "frequency": "50/60 Hz",
                    "harmonic_filtering": "5th, 7th, 11th, 13th harmonics"
                },
                installation_guide_url="",
                datasheet_url="",
                applications=["Industrial facilities", "Commercial buildings", "Data centers"],
                features=["Advanced filtering", "High efficiency", "Easy installation"]
            ),
            XECOProduct(
                name="XECO Power Factor Correction",
                model="XECO-PFC",
                category="Power Quality",
                description="Automatic power factor correction system",
                specifications={
                    "voltage_rating": "480V, 600V",
                    "current_rating": "25A to 1000A",
                    "power_factor": "0.95+",
                    "control": "Automatic switching"
                },
                installation_guide_url="",
                datasheet_url="",
                applications=["Industrial facilities", "Commercial buildings"],
                features=["Automatic control", "High efficiency", "Compact design"]
            )
        ]
    
    def fetch_installation_guides(self, products: List[XECOProduct]) -> List[XECOInstallationGuide]:
        """Fetch installation guides for XECO products"""
        guides = []
        
        for product in products:
            if product.installation_guide_url:
                try:
                    guide = self._fetch_installation_guide(product)
                    if guide:
                        guides.append(guide)
                except Exception as e:
                    logger.warning(f"Error fetching installation guide for {product.model}: {e}")
                    continue
        
        # Create fallback guides for products without URLs
        for product in products:
            if not product.installation_guide_url:
                guide = self._create_fallback_guide(product)
                guides.append(guide)
        
        logger.info(f"Created {len(guides)} installation guides")
        return guides
    
    def _fetch_installation_guide(self, product: XECOProduct) -> Optional[XECOInstallationGuide]:
        """Fetch installation guide for a specific product"""
        try:
            response = requests.get(product.installation_guide_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract installation steps
            steps = self._extract_installation_steps(soup)
            
            # Extract requirements
            requirements = self._extract_requirements(soup)
            
            # Extract tools needed
            tools = self._extract_tools_needed(soup)
            
            # Extract safety notes
            safety_notes = self._extract_safety_notes(soup)
            
            # Extract troubleshooting
            troubleshooting = self._extract_troubleshooting(soup)
            
            return XECOInstallationGuide(
                product_model=product.model,
                title=f"{product.name} Installation Guide",
                steps=steps,
                requirements=requirements,
                tools_needed=tools,
                safety_notes=safety_notes,
                troubleshooting=troubleshooting
            )
            
        except Exception as e:
            logger.error(f"Error fetching installation guide for {product.model}: {e}")
            return None
    
    def _extract_installation_steps(self, soup) -> List[str]:
        """Extract installation steps from HTML"""
        steps = []
        
        # Look for numbered lists or step-by-step content
        step_elements = soup.find_all(['ol', 'ul'], class_=re.compile(r'step|instruction|procedure'))
        
        for step_list in step_elements:
            step_items = step_list.find_all('li')
            for item in step_items:
                step_text = item.get_text(strip=True)
                if step_text and len(step_text) > 10:
                    steps.append(step_text)
        
        return steps[:10]  # Limit to 10 steps
    
    def _extract_requirements(self, soup) -> List[str]:
        """Extract installation requirements"""
        requirements = []
        
        # Look for requirements sections
        req_elements = soup.find_all(['div', 'section'], class_=re.compile(r'requirement|prerequisite|specification'))
        
        for req_element in req_elements:
            req_items = req_element.find_all(['li', 'p'])
            for item in req_items:
                req_text = item.get_text(strip=True)
                if req_text and len(req_text) > 5:
                    requirements.append(req_text)
        
        return requirements[:8]  # Limit to 8 requirements
    
    def _extract_tools_needed(self, soup) -> List[str]:
        """Extract tools needed for installation"""
        tools = []
        
        # Look for tools sections
        tool_elements = soup.find_all(['div', 'section'], class_=re.compile(r'tool|equipment|material'))
        
        for tool_element in tool_elements:
            tool_items = tool_element.find_all(['li', 'span'])
            for item in tool_items:
                tool_text = item.get_text(strip=True)
                if tool_text and len(tool_text) > 3:
                    tools.append(tool_text)
        
        return tools[:6]  # Limit to 6 tools
    
    def _extract_safety_notes(self, soup) -> List[str]:
        """Extract safety notes"""
        safety_notes = []
        
        # Look for safety sections
        safety_elements = soup.find_all(['div', 'section'], class_=re.compile(r'safety|warning|caution|danger'))
        
        for safety_element in safety_elements:
            safety_items = safety_element.find_all(['li', 'p', 'div'])
            for item in safety_items:
                safety_text = item.get_text(strip=True)
                if safety_text and len(safety_text) > 10:
                    safety_notes.append(safety_text)
        
        return safety_notes[:5]  # Limit to 5 safety notes
    
    def _extract_troubleshooting(self, soup) -> List[str]:
        """Extract troubleshooting information"""
        troubleshooting = []
        
        # Look for troubleshooting sections
        trouble_elements = soup.find_all(['div', 'section'], class_=re.compile(r'troubleshoot|problem|issue|faq'))
        
        for trouble_element in trouble_elements:
            trouble_items = trouble_element.find_all(['li', 'p'])
            for item in trouble_items:
                trouble_text = item.get_text(strip=True)
                if trouble_text and len(trouble_text) > 10:
                    troubleshooting.append(trouble_text)
        
        return troubleshooting[:6]  # Limit to 6 troubleshooting items
    
    def _create_fallback_guide(self, product: XECOProduct) -> XECOInstallationGuide:
        """Create fallback installation guide"""
        return XECOInstallationGuide(
            product_model=product.model,
            title=f"{product.name} Installation Guide",
            steps=[
                "Review installation requirements and specifications",
                "Ensure proper electrical connections and grounding",
                "Follow manufacturer's wiring diagrams",
                "Test all connections before energizing",
                "Verify proper operation and settings",
                "Document installation and commissioning"
            ],
            requirements=[
                "Qualified electrician required",
                "Proper electrical permits",
                "Adequate ventilation and clearance",
                "Correct voltage and current ratings"
            ],
            tools_needed=[
                "Multimeter",
                "Wire strippers",
                "Screwdrivers",
                "Electrical tape",
                "Safety equipment"
            ],
            safety_notes=[
                "De-energize all circuits before installation",
                "Follow lockout/tagout procedures",
                "Use appropriate PPE",
                "Verify voltage ratings before connection"
            ],
            troubleshooting=[
                "Check all electrical connections",
                "Verify proper grounding",
                "Test voltage and current levels",
                "Check for loose connections",
                "Verify proper operation settings"
            ]
        )
    
    def save_knowledge_base(self, products: List[XECOProduct], guides: List[XECOInstallationGuide]):
        """Save XECO knowledge base to files"""
        
        # Save products
        products_data = []
        for product in products:
            products_data.append({
                "name": product.name,
                "model": product.model,
                "category": product.category,
                "description": product.description,
                "specifications": product.specifications,
                "installation_guide_url": product.installation_guide_url,
                "datasheet_url": product.datasheet_url,
                "applications": product.applications,
                "features": product.features
            })
        
        with open(f"{self.knowledge_base_path}/products/xeco_products.json", "w") as f:
            json.dump(products_data, f, indent=2)
        
        # Save installation guides
        guides_data = []
        for guide in guides:
            guides_data.append({
                "product_model": guide.product_model,
                "title": guide.title,
                "steps": guide.steps,
                "requirements": guide.requirements,
                "tools_needed": guide.tools_needed,
                "safety_notes": guide.safety_notes,
                "troubleshooting": guide.troubleshooting
            })
        
        with open(f"{self.knowledge_base_path}/installation_guides/xeco_installation_guides.json", "w") as f:
            json.dump(guides_data, f, indent=2)
        
        # Create knowledge base index
        index_data = {
            "created_date": datetime.now().isoformat(),
            "source": "xecoenergy.com",
            "products_count": len(products),
            "guides_count": len(guides),
            "last_updated": datetime.now().isoformat()
        }
        
        with open(f"{self.knowledge_base_path}/xeco_knowledge_index.json", "w") as f:
            json.dump(index_data, f, indent=2)
        
        logger.info(f"Saved XECO knowledge base: {len(products)} products, {len(guides)} guides")
    
    def integrate_with_synerex_ai(self):
        """Integrate XECO website knowledge with SynerexAI"""
        
        # Fetch products and guides
        products = self.fetch_xeco_products()
        guides = self.fetch_installation_guides(products)
        
        # Save to knowledge base
        self.save_knowledge_base(products, guides)
        
        # Create enhanced XECO knowledge system
        self._create_enhanced_xeco_system(products, guides)
        
        logger.info("XECO website integration complete")
        return products, guides
    
    def _create_enhanced_xeco_system(self, products: List[XECOProduct], guides: List[XECOInstallationGuide]):
        """Create enhanced XECO knowledge system for SynerexAI"""
        
        enhanced_system = f'''"""
Enhanced XECO Knowledge System for SynerexAI
Integrates xecoenergy.com products and installation guides
"""

import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class EnhancedXECOKnowledgeSystem:
    """
    Enhanced XECO Knowledge System
    Provides comprehensive XECO product information and installation guidance
    """
    
    def __init__(self):
        self.products = self._load_xeco_products()
        self.installation_guides = self._load_installation_guides()
        self.knowledge_base = self._build_knowledge_base()
    
    def _load_xeco_products(self) -> List[Dict[str, Any]]:
        """Load XECO products from knowledge base"""
        try:
            with open("knowledge_base/xeco_website/products/xeco_products.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("XECO products not found, using fallback")
            return []
    
    def _load_installation_guides(self) -> List[Dict[str, Any]]:
        """Load installation guides from knowledge base"""
        try:
            with open("knowledge_base/xeco_website/installation_guides/xeco_installation_guides.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Installation guides not found, using fallback")
            return []
    
    def _build_knowledge_base(self) -> Dict[str, Any]:
        """Build comprehensive knowledge base"""
        return {{
            "products": self.products,
            "installation_guides": self.installation_guides,
            "total_products": len(self.products),
            "total_guides": len(self.installation_guides)
        }}
    
    def get_product_info(self, product_model: str) -> Optional[Dict[str, Any]]:
        """Get detailed product information"""
        for product in self.products:
            if product.get("model", "").lower() == product_model.lower():
                return product
        return None
    
    def get_installation_guide(self, product_model: str) -> Optional[Dict[str, Any]]:
        """Get installation guide for product"""
        for guide in self.installation_guides:
            if guide.get("product_model", "").lower() == product_model.lower():
                return guide
        return None
    
    def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search products by query"""
        results = []
        query_lower = query.lower()
        
        for product in self.products:
            if (query_lower in product.get("name", "").lower() or
                query_lower in product.get("description", "").lower() or
                query_lower in product.get("category", "").lower()):
                results.append(product)
        
        return results
    
    def get_products_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get products by category"""
        results = []
        category_lower = category.lower()
        
        for product in self.products:
            if category_lower in product.get("category", "").lower():
                results.append(product)
        
        return results
    
    def get_installation_requirements(self, product_model: str) -> List[str]:
        """Get installation requirements for product"""
        guide = self.get_installation_guide(product_model)
        if guide:
            return guide.get("requirements", [])
        return []
    
    def get_installation_steps(self, product_model: str) -> List[str]:
        """Get installation steps for product"""
        guide = self.get_installation_guide(product_model)
        if guide:
            return guide.get("steps", [])
        return []
    
    def get_troubleshooting_guide(self, product_model: str) -> List[str]:
        """Get troubleshooting guide for product"""
        guide = self.get_installation_guide(product_model)
        if guide:
            return guide.get("troubleshooting", [])
        return []
    
    def generate_product_response(self, user_question: str, product_model: str = None) -> str:
        """Generate comprehensive product response"""
        if product_model:
            product = self.get_product_info(product_model)
            if product:
                response = f"XECO Product: {{product['name']}} ({{product['model']}})\\n"
                response += f"Category: {{product['category']}}\\n"
                response += f"Description: {{product['description']}}\\n\\n"
                
                if product.get('specifications'):
                    response += "Specifications:\\n"
                    for spec, value in product['specifications'].items():
                        response += f"- {{spec}}: {{value}}\\n"
                
                if product.get('applications'):
                    response += "\\nApplications:\\n"
                    for app in product['applications']:
                        response += f"- {{app}}\\n"
                
                if product.get('features'):
                    response += "\\nFeatures:\\n"
                    for feature in product['features']:
                        response += f"- {{feature}}\\n"
                
                return response
        
        # Search products if no specific model
        products = self.search_products(user_question)
        if products:
            response = "XECO Products matching your query:\\n\\n"
            for product in products[:3]:  # Limit to 3 results
                response += f"- {{product['name']}} ({{product['model']}})\\n"
                response += f"  {{product['description']}}\\n\\n"
            return response
        
        return "No XECO products found matching your query. Please try a different search term."
    
    def generate_installation_response(self, product_model: str) -> str:
        """Generate installation guidance response"""
        guide = self.get_installation_guide(product_model)
        if not guide:
            return f"No installation guide found for {{product_model}}"
        
        response = f"Installation Guide for {{guide['title']}}\\n\\n"
        
        if guide.get('requirements'):
            response += "Requirements:\\n"
            for req in guide['requirements']:
                response += f"- {{req}}\\n"
            response += "\\n"
        
        if guide.get('tools_needed'):
            response += "Tools Needed:\\n"
            for tool in guide['tools_needed']:
                response += f"- {{tool}}\\n"
            response += "\\n"
        
        if guide.get('steps'):
            response += "Installation Steps:\\n"
            for i, step in enumerate(guide['steps'], 1):
                response += f"{{i}}. {{step}}\\n"
            response += "\\n"
        
        if guide.get('safety_notes'):
            response += "Safety Notes:\\n"
            for note in guide['safety_notes']:
                response += f"- {{note}}\\n"
            response += "\\n"
        
        if guide.get('troubleshooting'):
            response += "Troubleshooting:\\n"
            for trouble in guide['troubleshooting']:
                response += f"- {{trouble}}\\n"
        
        return response

# Enhanced XECO knowledge system instance
xeco_knowledge_system = EnhancedXECOKnowledgeSystem()

def get_xeco_product_info(product_model: str) -> Optional[Dict[str, Any]]:
    """Get XECO product information"""
    return xeco_knowledge_system.get_product_info(product_model)

def get_xeco_installation_guide(product_model: str) -> Optional[Dict[str, Any]]:
    """Get XECO installation guide"""
    return xeco_knowledge_system.get_installation_guide(product_model)

def search_xeco_products(query: str) -> List[Dict[str, Any]]:
    """Search XECO products"""
    return xeco_knowledge_system.search_products(query)

def generate_xeco_response(user_question: str, product_model: str = None) -> str:
    """Generate XECO response for SynerexAI"""
    return xeco_knowledge_system.generate_product_response(user_question, product_model)

def generate_xeco_installation_response(product_model: str) -> str:
    """Generate XECO installation response for SynerexAI"""
    return xeco_knowledge_system.generate_installation_response(product_model)
'''
        
        # Save enhanced system
        with open("xeco_website_knowledge_system.py", "w") as f:
            f.write(enhanced_system)
        
        logger.info("Enhanced XECO knowledge system created")

def main():
    """Main integration function"""
    print("=== XECO Website Integration for SynerexAI ===")
    print("Integrating xecoenergy.com products and installation guides...")
    print()
    
    # Create integration instance
    integrator = XECOWebsiteIntegration()
    
    # Integrate XECO website knowledge
    products, guides = integrator.integrate_with_synerex_ai()
    
    print("=== Integration Complete ===")
    print(f"Products integrated: {len(products)}")
    print(f"Installation guides: {len(guides)}")
    print()
    print("Files created:")
    print("- knowledge_base/xeco_website/ (XECO knowledge base)")
    print("- xeco_website_knowledge_system.py (Enhanced system)")
    print()
    print("Next steps:")
    print("1. Test XECO product queries with SynerexAI")
    print("2. Validate installation guide responses")
    print("3. Update SynerexAI to use enhanced XECO knowledge")
    print("4. Set up regular website updates")

if __name__ == "__main__":
    main()
