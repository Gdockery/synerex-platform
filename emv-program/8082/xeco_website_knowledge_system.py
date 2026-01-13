"""
Enhanced XECO Knowledge System for SynerexAI
Integrates xecoenergy.com products and installation guides
"""

import json
import logging
from typing import Dict, List, Any, Optional

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
        return {
            "products": self.products,
            "installation_guides": self.installation_guides,
            "total_products": len(self.products),
            "total_guides": len(self.installation_guides)
        }
    
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
    
    def generate_product_response(self, user_question: str, product_model: str = None) -> str:
        """Generate comprehensive product response"""
        if product_model:
            product = self.get_product_info(product_model)
            if product:
                response = f"XECO Product: {product['name']} ({product['model']})\n"
                response += f"Category: {product['category']}\n"
                response += f"Description: {product['description']}\n\n"
                
                if product.get('specifications'):
                    response += "Specifications:\n"
                    for spec, value in product['specifications'].items():
                        response += f"- {spec}: {value}\n"
                
                if product.get('applications'):
                    response += "\nApplications:\n"
                    for app in product['applications']:
                        response += f"- {app}\n"
                
                if product.get('features'):
                    response += "\nFeatures:\n"
                    for feature in product['features']:
                        response += f"- {feature}\n"
                
                return response
        
        # Search products if no specific model
        products = self.search_products(user_question)
        if products:
            response = "XECO Products matching your query:\n\n"
            for product in products[:3]:  # Limit to 3 results
                response += f"- {product['name']} ({product['model']})\n"
                response += f"  {product['description']}\n\n"
            return response
        
        return "No XECO products found matching your query. Please try a different search term."
    
    def generate_installation_response(self, product_model: str) -> str:
        """Generate installation guidance response"""
        guide = self.get_installation_guide(product_model)
        if not guide:
            return f"No installation guide found for {product_model}"
        
        response = f"Installation Guide for {guide['title']}\n\n"
        
        if guide.get('requirements'):
            response += "Requirements:\n"
            for req in guide['requirements']:
                response += f"- {req}\n"
            response += "\n"
        
        if guide.get('tools_needed'):
            response += "Tools Needed:\n"
            for tool in guide['tools_needed']:
                response += f"- {tool}\n"
            response += "\n"
        
        if guide.get('steps'):
            response += "Installation Steps:\n"
            for i, step in enumerate(guide['steps'], 1):
                response += f"{i}. {step}\n"
            response += "\n"
        
        if guide.get('safety_notes'):
            response += "Safety Notes:\n"
            for note in guide['safety_notes']:
                response += f"- {note}\n"
            response += "\n"
        
        if guide.get('troubleshooting'):
            response += "Troubleshooting:\n"
            for trouble in guide['troubleshooting']:
                response += f"- {trouble}\n"
        
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
