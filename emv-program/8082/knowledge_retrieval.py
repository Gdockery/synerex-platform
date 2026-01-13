#!/usr/bin/env python3
"""
Knowledge Retrieval System for SYNEREX AI
Provides RAG (Retrieval-Augmented Generation) functionality for the local LLM
"""

import json
import os
import re
from typing import List, Dict, Any, Tuple
from collections import defaultdict

class KnowledgeRetrieval:
    def __init__(self, knowledge_base_path: str = "knowledge_base"):
        """Initialize the knowledge retrieval system"""
        self.knowledge_base_path = knowledge_base_path
        self.knowledge_index = {}
        self.products_data = []
        self.installation_guides = []
        self.standards_data = []
        self.equipment_data = []
        self.troubleshooting_data = []
        self.utility_rates = []
        self.regional_data = []
        self.location_data = []
        
        # Load all knowledge base data
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Load all knowledge base files into memory - REQUIRED for service operation"""
        errors = []
        warnings = []
        
        # Required files (service won't work without these)
        required_files = {
            'products': os.path.join(self.knowledge_base_path, "xeco_website", "products", "xeco_products.json"),
            'installation_guides': os.path.join(self.knowledge_base_path, "xeco_website", "installation_guides", "xeco_installation_guides.json"),
            'standards': os.path.join(self.knowledge_base_path, "energy_standards", "standards_database.json"),
        }
        
        # Optional but recommended files
        optional_files = {
            'equipment': os.path.join(self.knowledge_base_path, "equipment_specs", "equipment_database.json"),
            'troubleshooting': os.path.join(self.knowledge_base_path, "troubleshooting", "troubleshooting_guides.json"),
            'utility_rates': os.path.join(self.knowledge_base_path, "utility_rates", "rates_database.json"),
            'regional_data': os.path.join(self.knowledge_base_path, "regional_data", "regional_database.json"),
            'location_data': os.path.join(self.knowledge_base_path, "location_energy", "location_energy_index.json"),
        }
        
        # Load required files
        for name, file_path in required_files.items():
            try:
                if not os.path.exists(file_path):
                    errors.append(f"Required file missing: {file_path}")
                    continue
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Validate data is not empty
                if not data or (isinstance(data, list) and len(data) == 0):
                    errors.append(f"Required file is empty: {file_path}")
                    continue
                
                # Store data (ensure it's a list)
                item_count = 0
                if name == 'products':
                    self.products_data = data if isinstance(data, list) else [data]
                    item_count = len(self.products_data)
                elif name == 'installation_guides':
                    self.installation_guides = data if isinstance(data, list) else [data]
                    item_count = len(self.installation_guides)
                elif name == 'standards':
                    self.standards_data = data if isinstance(data, list) else [data]
                    item_count = len(self.standards_data)
                
                print(f"Loaded {name}: {item_count} items")
                
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in {file_path}: {e}")
            except Exception as e:
                errors.append(f"Error loading {file_path}: {e}")
        
        # Load optional files
        for name, file_path in optional_files.items():
            try:
                if not os.path.exists(file_path):
                    warnings.append(f"Optional file missing: {file_path}")
                    continue
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if not data or (isinstance(data, list) and len(data) == 0):
                    warnings.append(f"Optional file is empty: {file_path}")
                    continue
                
                # Store data (ensure it's a list)
                if name == 'equipment':
                    self.equipment_data = data if isinstance(data, list) else [data]
                elif name == 'troubleshooting':
                    self.troubleshooting_data = data if isinstance(data, list) else [data]
                elif name == 'utility_rates':
                    self.utility_rates = data if isinstance(data, list) else [data]
                elif name == 'regional_data':
                    self.regional_data = data if isinstance(data, list) else [data]
                elif name == 'location_data':
                    self.location_data = data if isinstance(data, list) else [data]
                
            except Exception as e:
                warnings.append(f"Error loading optional {file_path}: {e}")
        
        # Report results
        if errors:
            error_msg = "CRITICAL: Knowledge base loading failed:\n" + "\n".join(f"  - {e}" for e in errors)
            print(error_msg)
            raise RuntimeError(error_msg)
        
        if warnings:
            print("WARNING: Knowledge base loaded with warnings:")
            for w in warnings:
                print(f"  - {w}")
        
        # Final validation - ensure we have data
        total_items = (len(self.products_data) + len(self.installation_guides) + 
                       len(self.standards_data))
        
        if total_items == 0:
            raise RuntimeError("Knowledge base loaded but contains no data! All required files are empty.")
        
        print(f"Knowledge base fully loaded: {len(self.products_data)} products, "
              f"{len(self.installation_guides)} guides, {len(self.standards_data)} standards")
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        # Remove common words and extract meaningful terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
        
        # Extract words (alphanumeric sequences)
        words = re.findall(r'\b[a-zA-Z0-9]+\b', text.lower())
        
        # Filter out stop words and short words
        keywords = [word for word in words if len(word) > 2 and word not in stop_words]
        
        return keywords
    
    def _calculate_relevance_score(self, query_keywords: List[str], content: str) -> float:
        """Calculate relevance score between query and content"""
        content_keywords = self._extract_keywords(content)
        
        if not content_keywords:
            return 0.0
        
        # Count keyword matches
        matches = sum(1 for keyword in query_keywords if keyword in content_keywords)
        
        # Calculate score based on match ratio and content length
        match_ratio = matches / len(query_keywords) if query_keywords else 0
        content_factor = min(len(content_keywords) / 100, 1.0)  # Normalize content length
        
        return match_ratio * 0.7 + content_factor * 0.3
    
    def search_products(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search XECO products based on query"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        for product in self.products_data:
            # Create searchable content
            content = f"{product.get('name', '')} {product.get('model', '')} {product.get('description', '')}"
            content += f" {product.get('category', '')}"
            
            # Add specifications to searchable content
            specs = product.get('specifications', {})
            for key, value in specs.items():
                content += f" {key} {value}"
            
            # Add features and applications
            content += f" {' '.join(product.get('features', []))}"
            content += f" {' '.join(product.get('applications', []))}"
            
            score = self._calculate_relevance_score(query_keywords, content)
            
            if score > 0.1:  # Minimum relevance threshold
                results.append({
                    'type': 'product',
                    'data': product,
                    'score': score,
                    'content': content[:200] + "..." if len(content) > 200 else content
                })
        
        # Sort by relevance score and return top results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_installation_guides(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search installation guides based on query"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        for guide in self.installation_guides:
            # Create searchable content
            content = f"{guide.get('title', '')} {guide.get('product_model', '')}"
            content += f" {' '.join(guide.get('steps', []))}"
            content += f" {' '.join(guide.get('requirements', []))}"
            content += f" {' '.join(guide.get('tools_needed', []))}"
            
            score = self._calculate_relevance_score(query_keywords, content)
            
            if score > 0.1:
                results.append({
                    'type': 'installation_guide',
                    'data': guide,
                    'score': score,
                    'content': content[:200] + "..." if len(content) > 200 else content
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_standards(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search energy standards based on query"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        # Handle both list and dict structures
        if isinstance(self.standards_data, dict):
            standards_list = list(self.standards_data.values())
        else:
            standards_list = self.standards_data
        
        for standard in standards_list:
            if isinstance(standard, dict):
                content = f"{standard.get('title', '')} {standard.get('description', '')}"
                
                # Add harmonic limits if available
                harmonic_limits = standard.get('harmonic_limits', {})
                if harmonic_limits:
                    content += f" harmonic limits"
                    for key, value in harmonic_limits.items():
                        if isinstance(value, dict):
                            content += f" {key} {' '.join(str(v) for v in value.values())}"
                        else:
                            content += f" {key} {value}"
                
                # Add requirements if available
                requirements = standard.get('requirements', [])
                if requirements:
                    content += f" {' '.join(requirements)}"
                
                score = self._calculate_relevance_score(query_keywords, content)
                
                if score > 0.1:
                    results.append({
                        'type': 'standard',
                        'data': standard,
                        'score': score,
                        'content': content[:200] + "..." if len(content) > 200 else content
                    })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_troubleshooting(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search troubleshooting guides based on query"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        # Handle both list and dict structures
        if isinstance(self.troubleshooting_data, dict):
            troubleshooting_list = list(self.troubleshooting_data.values())
        else:
            troubleshooting_list = self.troubleshooting_data
        
        for guide in troubleshooting_list:
            if isinstance(guide, dict):
                content = f"{guide.get('title', '')} {guide.get('description', '')}"
                
                # Add symptoms if available
                symptoms = guide.get('symptoms', [])
                if symptoms:
                    content += f" {' '.join(symptoms)}"
                
                # Add solutions if available
                solutions = guide.get('solutions', [])
                if solutions:
                    content += f" {' '.join(solutions)}"
                
                score = self._calculate_relevance_score(query_keywords, content)
                
                if score > 0.1:
                    results.append({
                        'type': 'troubleshooting',
                        'data': guide,
                        'score': score,
                        'content': content[:200] + "..." if len(content) > 200 else content
                    })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def classify_query_and_check_coverage(self, question: str) -> dict:
        """Classify query type and check coverage with 3-tier system"""
        question_lower = question.lower()
        
        # Tier 1: Direct knowledge base topics
        tier1_topics = {
            'xeco_products': ['xeco', 'pfc', 'hf', 'product', 'specification', 'model', 'capacity'],
            'installation': ['install', 'mount', 'wiring', 'connection', 'setup', 'guide', 'manual'],
            'standards': ['ieee', 'ashrae', 'standard', 'compliance', 'code', 'regulation'],
            'troubleshooting': ['problem', 'issue', 'error', 'fix', 'repair', 'troubleshoot'],
            'analysis': ['analysis', 'report', 'data', 'measurement', 'test', 'evaluation']
        }
        
        # Tier 2: Acceptable external data topics
        tier2_topics = {
            'utility_rates': ['utility', 'rate', 'electricity', 'cost', 'billing', 'tariff', 'charge'],
            'weather_climate': ['weather', 'temperature', 'climate', 'seasonal', 'heating', 'cooling'],
            'regional_data': ['regional', 'location', 'area', 'state', 'city', 'here', 'local'],
            'grid_operators': ['ercot', 'pjm', 'caiso', 'nyiso', 'iso', 'grid', 'operator', 'reliability', 'council']
        }
        
        # Check Tier 1 coverage
        tier1_score = 0
        tier1_matches = []
        for topic, keywords in tier1_topics.items():
            matches = sum(1 for keyword in keywords if keyword in question_lower)
            if matches > 0:
                tier1_score += matches
                tier1_matches.append(topic)
        
        # Check Tier 2 coverage  
        tier2_score = 0
        tier2_matches = []
        for topic, keywords in tier2_topics.items():
            matches = sum(1 for keyword in keywords if keyword in question_lower)
            if matches > 0:
                tier2_score += matches
                tier2_matches.append(topic)
        
        # Determine tier
        if tier1_score >= 2 or any(topic in tier1_matches for topic in ['xeco_products', 'installation', 'standards']):
            tier = 1
            is_covered = True
        elif tier2_score >= 1:
            tier = 2
            is_covered = True
        else:
            tier = 3
            is_covered = False
        
        return {
            'tier': tier,
            'is_covered': is_covered,
            'tier1_matches': tier1_matches,
            'tier2_matches': tier2_matches,
            'needs_location': tier == 2 and 'regional_data' in tier2_matches
        }
    
    def get_climate_zone_mapping(self) -> dict:
        """Get ASHRAE climate zone mapping by state"""
        return {
            'Alabama': 'zone_4', 'Alaska': 'zone_8', 'Arizona': 'zone_3', 'Arkansas': 'zone_4',
            'California': 'zone_3', 'Colorado': 'zone_5', 'Connecticut': 'zone_6', 'Delaware': 'zone_4',
            'Florida': 'zone_1', 'Georgia': 'zone_4', 'Hawaii': 'zone_1', 'Idaho': 'zone_5',
            'Illinois': 'zone_5', 'Indiana': 'zone_5', 'Iowa': 'zone_5', 'Kansas': 'zone_4',
            'Kentucky': 'zone_4', 'Louisiana': 'zone_2', 'Maine': 'zone_6', 'Maryland': 'zone_4',
            'Massachusetts': 'zone_6', 'Michigan': 'zone_6', 'Minnesota': 'zone_6', 'Mississippi': 'zone_2',
            'Missouri': 'zone_4', 'Montana': 'zone_7', 'Nebraska': 'zone_5', 'Nevada': 'zone_3',
            'New Hampshire': 'zone_6', 'New Jersey': 'zone_4', 'New Mexico': 'zone_3', 'New York': 'zone_6',
            'North Carolina': 'zone_4', 'North Dakota': 'zone_7', 'Ohio': 'zone_5', 'Oklahoma': 'zone_3',
            'Oregon': 'zone_4', 'Pennsylvania': 'zone_6', 'Rhode Island': 'zone_6', 'South Carolina': 'zone_3',
            'South Dakota': 'zone_6', 'Tennessee': 'zone_4', 'Texas': 'zone_2', 'Utah': 'zone_5',
            'Vermont': 'zone_6', 'Virginia': 'zone_4', 'Washington': 'zone_4', 'West Virginia': 'zone_5',
            'Wisconsin': 'zone_6', 'Wyoming': 'zone_7'
        }
    
    def search_weather_climate(self, query: str, location_data: dict = None, limit: int = 3) -> List[Dict[str, Any]]:
        """Search weather/climate data with smart location matching"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        # If location provided, try to find best match
        if location_data:
            location_city = location_data.get('city', '').lower()
            location_state = location_data.get('state', '').lower()
            climate_zone = location_data.get('climateZone', '')
            
            # Search for exact city match first
            for location_file in os.listdir(os.path.join(self.knowledge_base_path, "location_energy", "climate_data")):
                if location_city in location_file.lower() or location_state in location_file.lower():
                    # Load location-specific data
                    with open(os.path.join(self.knowledge_base_path, "location_energy", "climate_data", location_file), 'r') as f:
                        file_data = json.load(f)
                    
                    content = f"{location_file} {str(file_data)}"
                    score = self._calculate_relevance_score(query_keywords, content)
                    
                    if score > 0.1:
                        results.append({
                            'type': 'weather_climate',
                            'data': file_data,
                            'score': score + 0.5,  # Boost for exact match
                            'content': content[:200] + "..." if len(content) > 200 else content,
                            'match_type': 'exact_location'
                        })
            
            # If no exact match, find climate zone match
            if not results and climate_zone:
                for location_file in os.listdir(os.path.join(self.knowledge_base_path, "location_energy", "climate_data")):
                    with open(os.path.join(self.knowledge_base_path, "location_energy", "climate_data", location_file), 'r') as f:
                        file_data = json.load(f)
                    
                    file_climate_zone = file_data.get('location_analysis', {}).get('climate_zone', '')
                    if file_climate_zone == climate_zone:
                        content = f"{location_file} {str(file_data)}"
                        score = self._calculate_relevance_score(query_keywords, content)
                        
                        if score > 0.1:
                            results.append({
                                'type': 'weather_climate',
                                'data': file_data,
                                'score': score + 0.3,  # Boost for climate zone match
                                'content': content[:200] + "..." if len(content) > 200 else content,
                                'match_type': 'climate_zone'
                            })
        
        # Always include general climate data
        for location_file in os.listdir(os.path.join(self.knowledge_base_path, "location_energy", "climate_data")):
            with open(os.path.join(self.knowledge_base_path, "location_energy", "climate_data", location_file), 'r') as f:
                file_data = json.load(f)
            
            content = f"{location_file} {str(file_data)}"
            score = self._calculate_relevance_score(query_keywords, content)
            
            if score > 0.1:
                results.append({
                    'type': 'weather_climate',
                    'data': file_data,
                    'score': score,
                    'content': content[:200] + "..." if len(content) > 200 else content,
                    'match_type': 'general'
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_utility_rates(self, query: str, location_data: dict = None, limit: int = 3) -> List[Dict[str, Any]]:
        """Search utility rates with location context"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        # Get climate zone for location-specific rates
        climate_zone = None
        if location_data:
            state = location_data.get('state', '')
            climate_zone = self.get_climate_zone_mapping().get(state, 'zone_5')
        
        # Handle both dict and list formats
        if isinstance(self.utility_rates, dict):
            # If it's a dictionary, iterate over items
            rates_to_search = self.utility_rates.items()
        elif isinstance(self.utility_rates, list):
            # If it's a list, iterate over list items
            rates_to_search = enumerate(self.utility_rates)
        else:
            # Empty or unknown format, return empty results
            return []
        
        for rate_type, rate_data in rates_to_search:
            # Handle both dict and list item formats
            if isinstance(rate_data, dict):
                content = f"{rate_type} {rate_data.get('description', '')}"
                
                # Add location-specific data if available
                if climate_zone and 'regional' in rate_data:
                    content += f" regional {climate_zone}"
                
                score = self._calculate_relevance_score(query_keywords, content)
                
                if score > 0.1:
                    results.append({
                        'type': 'utility_rate',
                        'data': rate_data,
                        'score': score,
                        'content': content[:200] + "..." if len(content) > 200 else content,
                        'climate_zone': climate_zone
                    })
            elif isinstance(rate_data, str):
                # If rate_data is a string, use it directly
                score = self._calculate_relevance_score(query_keywords, rate_data)
                if score > 0.1:
                    results.append({
                        'type': 'utility_rate',
                        'data': {'description': rate_data},
                        'score': score,
                        'content': rate_data[:200] + "..." if len(rate_data) > 200 else rate_data,
                        'climate_zone': climate_zone
                    })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_grid_operators(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Search grid operators and regional electricity markets"""
        query_keywords = self._extract_keywords(query)
        results = []
        
        # Grid operator knowledge base
        grid_operators = {
            'ERCOT': {
                'name': 'Electric Reliability Council of Texas',
                'region': 'Texas',
                'description': 'Independent system operator managing the Texas electric grid',
                'purpose': 'Ensures reliable electricity supply and competitive markets in Texas',
                'services': ['Grid reliability', 'Market operations', 'Transmission planning', 'Demand response'],
                'market_type': 'Competitive retail electricity market',
                'peak_demand': 'Over 80,000 MW',
                'renewable_penetration': 'High wind and solar integration'
            },
            'PJM': {
                'name': 'PJM Interconnection',
                'region': 'Mid-Atlantic and parts of Midwest',
                'description': 'Regional transmission organization managing wholesale electricity markets',
                'purpose': 'Coordinates electricity transmission and operates competitive markets',
                'services': ['Transmission planning', 'Market operations', 'Reliability coordination'],
                'market_type': 'Wholesale electricity market',
                'peak_demand': 'Over 150,000 MW',
                'renewable_penetration': 'Growing renewable integration'
            },
            'CAISO': {
                'name': 'California Independent System Operator',
                'region': 'California',
                'description': 'Independent system operator managing California\'s electric grid',
                'purpose': 'Ensures reliable electricity supply and competitive markets in California',
                'services': ['Grid reliability', 'Market operations', 'Renewable integration'],
                'market_type': 'Competitive wholesale market',
                'peak_demand': 'Over 50,000 MW',
                'renewable_penetration': 'High solar and wind integration'
            },
            'NYISO': {
                'name': 'New York Independent System Operator',
                'region': 'New York State',
                'description': 'Independent system operator managing New York\'s electric grid',
                'purpose': 'Ensures reliable electricity supply and competitive markets in New York',
                'services': ['Grid reliability', 'Market operations', 'Transmission planning'],
                'market_type': 'Competitive wholesale market',
                'peak_demand': 'Over 30,000 MW',
                'renewable_penetration': 'Growing renewable integration'
            }
        }
        
        # Search through grid operators
        for operator_code, operator_data in grid_operators.items():
            content = f"{operator_code} {operator_data['name']} {operator_data['description']} {operator_data['purpose']}"
            content += f" {' '.join(operator_data['services'])} {operator_data['market_type']}"
            
            score = self._calculate_relevance_score(query_keywords, content)
            
            if score > 0.1:
                results.append({
                    'type': 'grid_operator',
                    'data': operator_data,
                    'score': score,
                    'content': content[:200] + "..." if len(content) > 200 else content,
                    'operator_code': operator_code
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def get_relevant_context(self, question: str, max_tokens: int = 2000) -> str:
        """Get relevant context for a question using RAG"""
        # Extract keywords from the question
        query_keywords = self._extract_keywords(question)
        
        # Search across all knowledge sources
        all_results = []
        
        # Search products
        all_results.extend(self.search_products(question, limit=2))
        
        # Search installation guides
        all_results.extend(self.search_installation_guides(question, limit=2))
        
        # Search standards
        all_results.extend(self.search_standards(question, limit=2))
        
        # Search troubleshooting
        all_results.extend(self.search_troubleshooting(question, limit=2))
        
        # Search grid operators
        all_results.extend(self.search_grid_operators(question, limit=2))
        
        # Sort all results by relevance
        all_results.sort(key=lambda x: x['score'], reverse=True)
        
        # Build context string
        context_parts = []
        current_tokens = 0
        
        for result in all_results[:5]:  # Top 5 most relevant results
            if result['type'] == 'product':
                product = result['data']
                context = f"**XECO Product: {product.get('name', 'Unknown')} ({product.get('model', 'N/A')})**\n"
                context += f"Description: {product.get('description', 'N/A')}\n"
                
                # Add key specifications
                specs = product.get('specifications', {})
                if specs:
                    context += "Key Specifications:\n"
                    for key, value in list(specs.items())[:5]:  # Top 5 specs
                        context += f"- {key}: {value}\n"
                
                # Add applications
                apps = product.get('applications', [])
                if apps:
                    context += f"Applications: {', '.join(apps[:3])}\n"
                
                context += "\n"
                
            elif result['type'] == 'installation_guide':
                guide = result['data']
                context = f"**Installation Guide: {guide.get('title', 'Unknown')}**\n"
                context += f"Product: {guide.get('product_model', 'N/A')}\n"
                
                steps = guide.get('steps', [])
                if steps:
                    context += "Key Steps:\n"
                    for step in steps[:5]:  # Top 5 steps
                        context += f"- {step}\n"
                
                context += "\n"
                
            elif result['type'] == 'standard':
                standard = result['data']
                context = f"**Energy Standard: {standard.get('name', 'Unknown')}**\n"
                context += f"Description: {standard.get('description', 'N/A')}\n"
                
                requirements = standard.get('requirements', [])
                if requirements:
                    context += "Key Requirements:\n"
                    for req in requirements[:3]:  # Top 3 requirements
                        context += f"- {req}\n"
                
                context += "\n"
                
            elif result['type'] == 'troubleshooting':
                guide = result['data']
                context = f"**Troubleshooting: {guide.get('title', 'Unknown')}**\n"
                context += f"Description: {guide.get('description', 'N/A')}\n"
                
                solutions = guide.get('solutions', [])
                if solutions:
                    context += "Solutions:\n"
                    for solution in solutions[:3]:  # Top 3 solutions
                        context += f"- {solution}\n"
                
                context += "\n"
                
            elif result['type'] == 'grid_operator':
                operator = result['data']
                operator_code = result.get('operator_code', 'Unknown')
                context = f"**Grid Operator: {operator_code} ({operator.get('name', 'Unknown')})**\n"
                context += f"Region: {operator.get('region', 'N/A')}\n"
                context += f"Description: {operator.get('description', 'N/A')}\n"
                context += f"Purpose: {operator.get('purpose', 'N/A')}\n"
                
                services = operator.get('services', [])
                if services:
                    context += f"Services: {', '.join(services[:3])}\n"
                
                context += f"Market Type: {operator.get('market_type', 'N/A')}\n"
                context += f"Peak Demand: {operator.get('peak_demand', 'N/A')}\n"
                context += f"Renewable Integration: {operator.get('renewable_penetration', 'N/A')}\n"
                context += "\n"
            
            # Estimate token count (rough approximation: 1 token ≈ 4 characters)
            estimated_tokens = len(context) // 4
            
            if current_tokens + estimated_tokens > max_tokens:
                break
            
            context_parts.append(context)
            current_tokens += estimated_tokens
        
        return "\n".join(context_parts)
    
    def get_knowledge_stats(self) -> Dict[str, int]:
        """Get statistics about the knowledge base"""
        return {
            'products': len(self.products_data),
            'installation_guides': len(self.installation_guides),
            'standards': len(self.standards_data),
            'equipment': len(self.equipment_data),
            'troubleshooting': len(self.troubleshooting_data),
            'utility_rates': len(self.utility_rates),
            'regional_data': len(self.regional_data),
            'location_data': len(self.location_data)
        }

# Test the knowledge retrieval system
if __name__ == "__main__":
    # Initialize the knowledge retrieval system
    kr = KnowledgeRetrieval()
    
    # Test queries
    test_queries = [
        "How do I install XECO-HF harmonic filter?",
        "What are the specifications for XECO power factor correction?",
        "What are IEEE 519 standards for harmonic distortion?",
        "How to troubleshoot power quality issues?"
    ]
    
    print("🧪 Testing Knowledge Retrieval System")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        context = kr.get_relevant_context(query)
        print(f"📄 Context Length: {len(context)} characters")
        print(f"📝 Context Preview: {context[:200]}...")
        print("-" * 30)
    
    # Show knowledge base stats
    stats = kr.get_knowledge_stats()
    print(f"\n📊 Knowledge Base Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
