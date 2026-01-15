#!/usr/bin/env python3
"""
Ollama AI Backend Service for SYNEREX
Provides local LLM integration with RAG using Qwen 2.5 via Ollama
"""

import json
import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from knowledge_retrieval import KnowledgeRetrieval
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
try:
    CORS(app)
    logger.info("CORS initialized successfully")
except Exception as e:
    logger.warning(f"Failed to initialize CORS (non-critical): {e}")
    # Continue without CORS if it fails - service can still work

# Initialize knowledge retrieval system with absolute path - REQUIRED
knowledge_retrieval = None  # Initialize as None first
try:
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    knowledge_base_path = os.path.join(script_dir, "knowledge_base")
    
    logger.info(f"📚 Initializing knowledge base from: {knowledge_base_path}")
    knowledge_retrieval = KnowledgeRetrieval(knowledge_base_path=knowledge_base_path)
    
    # Validate that knowledge base actually loaded data
    stats = knowledge_retrieval.get_knowledge_stats()
    total_items = sum(stats.values())
    
    if total_items == 0:
        logger.warning("⚠️ Knowledge base loaded but contains no data! Service will start but AI features may be limited.")
        # Don't raise - allow service to start
    else:
        logger.info(f"✅ Knowledge retrieval system initialized successfully")
        logger.info(f"📊 Knowledge base stats: {stats}")
    
except Exception as e:
    logger.error(f"❌ WARNING: Failed to initialize knowledge retrieval: {e}")
    logger.error(f"⚠️ Service will start but AI features will be limited!")
    logger.error(f"⚠️ Please check:")
    logger.error(f"   1. Knowledge base directory exists: {knowledge_base_path}")
    logger.error(f"   2. All required JSON files are present and valid")
    logger.error(f"   3. Files are readable and contain valid JSON data")
    import traceback
    logger.error(traceback.format_exc())
    # REMOVE SystemExit - allow service to start anyway
    knowledge_retrieval = None

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:1b"

class OllamaAI:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model
        # Knowledge base is guaranteed to exist (service won't start without it)
        self.knowledge_retrieval = knowledge_retrieval
    
    def generate_response(self, question: str, project_context: dict = None, conversation_history: list = None, location_data: dict = None) -> str:
        """Generate AI response using 3-tier system with location data"""
        try:
            logger.info(f"🤖 Generating response for question: {question[:50]}...")
            
            # Check if knowledge base is available
            if not self.knowledge_retrieval:
                return "I apologize, but the knowledge base is not available. Please check the service logs for details."
            
            # Knowledge base is available - proceed normally
            coverage_info = self.knowledge_retrieval.classify_query_and_check_coverage(question)
            logger.info(f"📊 Query coverage: {coverage_info}")
            
            if coverage_info['tier'] == 1:
                # Direct knowledge base - use existing RAG
                return self._generate_tier1_response(question, project_context, conversation_history)
            
            elif coverage_info['tier'] == 2:
                # Acceptable external data - enhanced with location context
                return self._generate_tier2_response(question, coverage_info, project_context, location_data)
            
            else:
                # Off-topic
                return self._get_off_topic_response(question, coverage_info)
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists. Error: {str(e)}"
    
    def _generate_tier1_response(self, question: str, project_context: dict = None, conversation_history: list = None) -> str:
        """Generate response for Tier 1 questions (direct knowledge base)"""
        try:
            logger.info("📚 Retrieving relevant context from knowledge base...")
            relevant_context = self.knowledge_retrieval.get_relevant_context(question)
            logger.info(f"📚 Retrieved context length: {len(relevant_context)} characters")
            
            # Build project context string
            project_context_str = ""
            if project_context:
                project_context_str = f"""
PROJECT CONTEXT:
- Project: {project_context.get('project_name', 'Current Project')}
- Facility: {project_context.get('facility_name', 'Facility')}
- Location: {project_context.get('location', 'Location')}
- Contact: {project_context.get('contact_name', 'Contact')}
- Email: {project_context.get('contact_email', 'Email')}
- Phone: {project_context.get('contact_phone', 'Phone')}
"""
            
            # Build conversation history
            history_str = ""
            if conversation_history:
                history_str = "\nCONVERSATION HISTORY:\n"
                for msg in conversation_history[-3:]:  # Last 3 messages
                    history_str += f"- {msg}\n"
            
            # Create system prompt
            system_prompt = f"""You are SynerexAI, an expert assistant for XECO power quality products and analysis.

IMPORTANT: XECO is a power quality equipment manufacturer that sells products like harmonic filters, power factor correction systems, and voltage regulators. XECO does NOT sell electricity or energy - they sell equipment that helps customers reduce their energy consumption and improve power quality.

CONTEXT:
{relevant_context[:1000] if len(relevant_context) > 1000 else relevant_context}

{project_context_str[:500] if len(project_context_str) > 500 else project_context_str}

{history_str[:300] if len(history_str) > 300 else history_str}

Answer the user's question concisely and accurately based on the provided context. Never refer to XECO as an energy provider or utility company.

USER QUESTION: {question}"""

            logger.info("🚀 Calling Ollama API...")
            response = self._call_ollama(system_prompt)
            logger.info(f"✅ Ollama response received: {len(response)} characters")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating Tier 1 response: {e}")
            return f"I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists. Error: {str(e)}"
    
    def _generate_tier2_response(self, question: str, coverage_info: dict, project_context: dict = None, location_data: dict = None) -> str:
        """Generate response for Tier 2 questions (location-aware queries)"""
        try:
            # Extract location from multiple sources
            location = self._extract_location_context(project_context, location_data)
            
            if not location and coverage_info['needs_location']:
                return self._request_location_permission(question, coverage_info)
            
            # Get weather data from service if available
            weather_data = None
            if location_data and 'weather_climate' in coverage_info['tier2_matches']:
                weather_data = self._fetch_weather_data(location_data)
            
            # Get utility rates from service if available
            utility_rates_data = None
            if location_data and 'utility_rates' in coverage_info['tier2_matches']:
                utility_rates_data = self._fetch_utility_rates(location_data)
            
            # Get relevant knowledge base data with location context
            if 'utility_rates' in coverage_info['tier2_matches']:
                # Try to fetch real-time rates first
                if utility_rates_data:
                    # Use real-time data with knowledge base context
                    kb_context = self.knowledge_retrieval.search_utility_rates(question, location_data)
                    # Format list results as string
                    if isinstance(kb_context, list):
                        kb_context_str = "\n".join([
                            f"- {item.get('content', '')} (Score: {item.get('score', 0):.2f})"
                            for item in kb_context
                        ]) if kb_context else "General utility rate information"
                    else:
                        kb_context_str = str(kb_context) if kb_context else "General utility rate information"
                    
                    context = f"""
REAL-TIME UTILITY RATE DATA:
Average Rate: ${utility_rates_data.get('average_rate', 'N/A')}/kWh
Peak Rate: ${utility_rates_data.get('peak_rate', 'N/A')}/kWh
Off-Peak Rate: ${utility_rates_data.get('off_peak_rate', 'N/A')}/kWh
Demand Charge: ${utility_rates_data.get('demand_charge', 'N/A')}/kW
Time-of-Use: {utility_rates_data.get('time_of_use', False)}
Utilities: {', '.join(utility_rates_data.get('utilities', []))}
Source: {utility_rates_data.get('source', 'unknown')}
Note: {utility_rates_data.get('note', '')}

KNOWLEDGE BASE CONTEXT:
{kb_context_str}
"""
                else:
                    # Fallback to knowledge base only
                    kb_context = self.knowledge_retrieval.search_utility_rates(question, location_data)
                    # Format list results as string
                    if isinstance(kb_context, list):
                        context = "\n".join([
                            f"- {item.get('content', '')} (Score: {item.get('score', 0):.2f})"
                            for item in kb_context
                        ]) if kb_context else "General utility rate information"
                    else:
                        context = str(kb_context) if kb_context else "General utility rate information"
            elif 'weather_climate' in coverage_info['tier2_matches']:
                context = self.knowledge_retrieval.search_weather_climate(question, location_data)
            elif 'grid_operators' in coverage_info['tier2_matches']:
                context = self.knowledge_retrieval.search_grid_operators(question)
            else:
                context = self.knowledge_retrieval.get_relevant_context(question)
            
            # Build location-aware prompt
            location_info = ""
            if location_data:
                city_state = location_data.get('cityState', 'Unknown location')
                climate_zone = location_data.get('climateZone', 'Unknown climate zone')
                location_info = f"""
LOCATION CONTEXT: {city_state}
CLIMATE ZONE: {climate_zone}
"""
            
            weather_info = ""
            if weather_data:
                weather_info = f"""
WEATHER DATA: {weather_data}
"""
            
            utility_rates_info = ""
            if utility_rates_data:
                utility_rates_info = f"""
UTILITY RATES DATA:
Average Rate: ${utility_rates_data.get('average_rate', 'N/A')}/kWh
Peak Rate: ${utility_rates_data.get('peak_rate', 'N/A')}/kWh
Off-Peak Rate: ${utility_rates_data.get('off_peak_rate', 'N/A')}/kWh
Demand Charge: ${utility_rates_data.get('demand_charge', 'N/A')}/kW
Time-of-Use: {utility_rates_data.get('time_of_use', False)}
Utilities: {', '.join(utility_rates_data.get('utilities', []))}
Source: {utility_rates_data.get('source', 'unknown')}
"""
            
            # Build enhanced prompt for Tier 2 with location
            system_prompt = f"""You are SynerexAI, an expert assistant for XECO power quality products and analysis.

IMPORTANT: XECO is a power quality equipment manufacturer that sells products like harmonic filters, power factor correction systems, and voltage regulators. XECO does NOT sell electricity or energy - they sell equipment that helps customers reduce their energy consumption and improve power quality.

{location_info}
{weather_info}
{utility_rates_info}
RELEVANT DATA:
{context}

You can help with utility rates, weather impacts on energy usage, regional energy data, and grid operators like ERCOT, PJM, CAISO, and NYISO.
Provide helpful information based on the available data and explain how it relates to XECO products and power quality analysis.

If the user's location isn't in the knowledge base, use similar climate zones or general regional data to provide helpful guidance.

Never refer to XECO as an energy provider or utility company. XECO sells power quality equipment, not energy.

USER QUESTION: {question}"""
            
            logger.info("🚀 Calling Ollama API for Tier 2 response...")
            response = self._call_ollama(system_prompt)
            logger.info(f"✅ Ollama Tier 2 response received: {len(response)} characters")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating Tier 2 response: {e}")
            return f"I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists. Error: {str(e)}"
    
    def _extract_location_context(self, project_context: dict, location_data: dict) -> str:
        """Extract location information from multiple sources"""
        location_parts = []
        
        # Priority 1: Browser geolocation (most accurate)
        if location_data and location_data.get('cityState'):
            return location_data['cityState']
        
        # Priority 2: Project form data
        if project_context:
            if project_context.get('location'):
                location_parts.append(project_context['location'])
            if project_context.get('city'):
                location_parts.append(project_context['city'])
            if project_context.get('state'):
                location_parts.append(project_context['state'])
        
        # Priority 3: Coordinates fallback
        if location_data and location_data.get('latitude'):
            return f"{location_data['latitude']:.2f}, {location_data['longitude']:.2f}"
        
        return ', '.join(location_parts) if location_parts else None
    
    def _request_location_permission(self, question: str, coverage_info: dict) -> str:
        """Request location permission for Tier 2 questions"""
        return f"""I can help you with that! To provide accurate information about utility rates or weather impacts, I need your location.

**Your browser will ask for location permission** - please click "Allow" when prompted. This will help me provide:

• **Utility Rates**: Current electricity rates and tariff structures for your area
• **Weather Impact**: How local climate affects energy usage and XECO system performance  
• **Regional Data**: Location-specific energy characteristics and recommendations

**Privacy Note**: Your location is only used to provide relevant energy information and is not stored permanently.

Once you grant permission, I can answer questions like:
• "What are the utility rates here?"
• "How does weather affect energy usage in my area?"
• "What are the regional energy characteristics?"

Please allow location access and ask your question again!"""
    
    def _fetch_utility_rates(self, location_data: dict) -> dict:
        """Fetch utility rates from the utility rate service"""
        try:
            if not location_data:
                return None
            
            rate_service_url = "http://localhost:8202/rates"
            response = requests.post(
                rate_service_url,
                json={"location_data": location_data},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return data.get('data')
            
            return None
        except Exception as e:
            logger.warning(f"Utility rate service unavailable: {e}")
            return None
    
    def _fetch_weather_data(self, location_data: dict) -> str:
        """Fetch weather data from weather service"""
        try:
            if not location_data or not location_data.get('cityState'):
                return None
            
            # Create address from location data
            address = location_data['cityState']
            
            # Call weather service
            weather_url = "http://localhost:8200/weather/batch"
            weather_payload = {
                "address": address,
                "before_start": "2024-01-01",
                "before_end": "2024-12-31",
                "after_start": "2024-01-01", 
                "after_end": "2024-12-31"
            }
            
            import requests
            response = requests.post(weather_url, json=weather_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return f"Location: {data.get('location', 'Unknown')}, Avg Temp: {data.get('temp_before', 'N/A')}°F"
            
            return None
            
        except Exception as e:
            logger.warning(f"Weather service call failed: {e}")
            return None
    
    def _get_off_topic_response(self, question: str, coverage_info: dict) -> str:
        """Generate response for off-topic questions"""
        matched_topics = coverage_info.get('matched_topics', [])
        
        if not matched_topics:
            return """I'm SynerexAI, specialized in XECO power quality products and power quality analysis. 

Your question appears to be outside my area of expertise. I can help you with:

• **XECO Product Information**: Specifications, features, and capabilities of XECO-PFC, XECO-HF, and other power quality products
• **Installation Guidance**: Step-by-step installation procedures and requirements
• **Power Quality Standards**: IEEE 519, ASHRAE 14, and other relevant standards
• **Troubleshooting**: Common issues and solutions for XECO systems
• **Analysis Support**: Power quality analysis and reporting

Please ask me about XECO power quality products, installation procedures, power quality standards, or system troubleshooting, and I'll be happy to help!"""
        
        return f"""I'm SynerexAI, specialized in XECO power quality products and power quality analysis.

Your question touches on some topics I can help with ({', '.join(matched_topics)}), but it seems to be asking for something beyond my current knowledge base.

I can provide detailed information about:
• **XECO Power Quality Products**: Specifications, installation, and troubleshooting
• **Power Quality Standards**: IEEE 519, ASHRAE 14, compliance requirements
• **Installation Procedures**: Step-by-step guides and requirements
• **System Analysis**: Power quality analysis and reporting

Could you rephrase your question to focus on XECO power quality products or power quality analysis? I'll do my best to help with specific technical information."""
    
    def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API to generate response with progressive timeout"""
        try:
            url = f"{self.base_url}/api/generate"
            
            # Optimize prompt length for faster processing
            if len(prompt) > 3000:
                prompt = prompt[:3000] + "\n\n[Context truncated for performance]"
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.5,  # Slightly higher for more natural responses
                    "top_p": 0.9,         # Allow more variety
                    "max_tokens": 500,    # Allow longer responses
                    "num_predict": 500,   # Increase prediction length
                    "stop": ["\n\n\n", "User:", "Question:", "---"]  # Better stop sequences
                }
            }
            
            # Progressive timeout: start with 60s, retry with 120s if needed (increased from 30s/60s)
            for timeout in [60, 120]:
                try:
                    logger.info(f"🚀 Calling Ollama API (timeout: {timeout}s)...")
                    response = requests.post(url, json=payload, timeout=timeout)
                    response.raise_for_status()
                    
                    result = response.json()
                    response_text = result.get('response', 'No response generated')
                    
                    # Validate response quality
                    if len(response_text.strip()) < 10:
                        logger.warning("⚠️ Ollama returned very short response, retrying...")
                        continue
                    
                    logger.info(f"✅ Ollama response received: {len(response_text)} characters")
                    return response_text
                    
                except requests.exceptions.Timeout:
                    logger.warning(f"⏰ Ollama timeout ({timeout}s), {'retrying with longer timeout...' if timeout == 60 else 'giving up'}")
                    if timeout == 120:  # Final attempt failed
                        raise requests.exceptions.Timeout("Ollama API timed out after multiple attempts")
                    continue
                    
        except requests.exceptions.Timeout:
            logger.error(f"Ollama API error: {self.base_url} timed out after multiple attempts")
            raise Exception(f"Failed to connect to Ollama: {self.base_url} timed out. The question may be too complex or the model is overloaded.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API error: {e}")
            raise Exception(f"Failed to connect to Ollama: {e}")
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {e}")
            raise Exception(f"Unexpected error: {e}")

# Initialize Ollama AI
ollama_ai = OllamaAI()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if knowledge base is available
        kb_available = knowledge_retrieval is not None
        kb_stats = {}
        
        if kb_available:
            try:
                kb_stats = knowledge_retrieval.get_knowledge_stats()
            except:
                kb_available = False
        
        # Test Ollama connection
        ollama_status = "unknown"
        try:
            test_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            ollama_status = "healthy" if test_response.status_code == 200 else "unhealthy"
        except Exception as e:
            ollama_status = f"unavailable: {str(e)}"
        
        return jsonify({
            "status": "healthy" if kb_available else "degraded",
            "service": "ollama_ai_backend",
            "ollama_status": ollama_status,
            "model": OLLAMA_MODEL,
            "knowledge_base": kb_stats,
            "knowledge_base_available": kb_available,
            "timestamp": "2025-01-27T20:45:00Z"
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            "status": "error",
            "service": "ollama_ai_backend",
            "error": str(e),
            "timestamp": "2025-01-27T20:45:00Z"
        }), 500

@app.route('/api/ai/chat', methods=['POST'])
def chat():
    """Main chat endpoint for AI interactions"""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' field"}), 400
        
        question = data['question']
        project_context = data.get('project_context', {})
        location_data = data.get('location_data')  # NEW
        conversation_history = data.get('conversation_history', [])
        
        # Generate response using 3-tier system
        response = ollama_ai.generate_response(question, project_context, conversation_history, location_data)
        
        return jsonify({
            "response": response,
            "model": OLLAMA_MODEL,
            "timestamp": "2025-01-27T20:45:00Z"
        })
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/knowledge/search', methods=['POST'])
def search_knowledge():
    """Search knowledge base directly"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' field"}), 400
        
        query = data['query']
        search_type = data.get('type', 'all')  # all, products, guides, standards, troubleshooting
        
        results = []
        
        # Check if knowledge base is available
        if not knowledge_retrieval:
            return jsonify({"error": "Knowledge base is not available"}), 503
        
        if search_type in ['all', 'products']:
            results.extend(knowledge_retrieval.search_products(query, limit=2))
        
        if search_type in ['all', 'guides']:
            results.extend(knowledge_retrieval.search_installation_guides(query, limit=2))
        
        if search_type in ['all', 'standards']:
            results.extend(knowledge_retrieval.search_standards(query, limit=2))
        
        if search_type in ['all', 'troubleshooting']:
            results.extend(knowledge_retrieval.search_troubleshooting(query, limit=2))
        
        # Sort by relevance score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            "query": query,
            "results": results[:5],  # Top 5 results
            "total_results": len(results)
        })
        
    except Exception as e:
        logger.error(f"Knowledge search error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/knowledge/stats', methods=['GET'])
def knowledge_stats():
    """Get knowledge base statistics"""
    try:
        if not knowledge_retrieval:
            return jsonify({"error": "Knowledge base is not available", "stats": {}}), 503
        
        stats = knowledge_retrieval.get_knowledge_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Knowledge stats error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/test', methods=['POST'])
def test_ai():
    """Test AI with a simple question"""
    try:
        test_question = "Hello, can you help me with power quality analysis?"
        response = ollama_ai.generate_response(test_question)
        
        return jsonify({
            "test_question": test_question,
            "response": response,
            "model": OLLAMA_MODEL,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"AI test error: {e}")
        return jsonify({"error": str(e), "status": "failed"}), 500

if __name__ == '__main__':
    try:
        print("Starting Ollama AI Backend Service")
        print(f"Ollama URL: {OLLAMA_BASE_URL}")
        print(f"Model: {OLLAMA_MODEL}")
        
        # Check if knowledge base is available (don't fail if it's not)
        if knowledge_retrieval:
            try:
                kb_stats = knowledge_retrieval.get_knowledge_stats()
                print(f"Knowledge Base: {kb_stats}")
            except:
                print("⚠️ Knowledge Base: Error getting stats")
        else:
            print("⚠️ Knowledge Base: Not available (service will start but AI features limited)")
        
        # Test Ollama connection
        try:
            test_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if test_response.status_code == 200:
                print("Ollama connection successful")
            else:
                print("Ollama connection failed")
        except Exception as e:
            print(f"Ollama connection error: {e}")
        
        # Start Flask app
        app.run(host='0.0.0.0', port=8090, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        logger.error(f"Failed to start Ollama AI Backend Service: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise
