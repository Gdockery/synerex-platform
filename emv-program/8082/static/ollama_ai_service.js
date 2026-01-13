/**
 * Ollama AI Service Integration for SYNEREX
 * Connects frontend to the local Ollama AI backend with RAG
 */

class OllamaAIService {
    constructor() {
        this.baseUrl = 'http://localhost:8090';
        this.conversationHistory = [];
        this.isConnected = false;
        this.initialized = false;
        this.userLocation = null;
        this.locationPermissionAsked = false;
        
        // Initialize connection asynchronously
        this.initialize();
    }
    
    showSimpleStatus(message) {
        // Add status message directly to chat messages
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // Remove any existing status message
            this.hideSimpleStatus();
            
            // Create new status message
            const statusDiv = document.createElement('div');
            statusDiv.className = 'ai-message status-message';
            statusDiv.id = 'currentStatusMessage';
            statusDiv.innerHTML = `<strong>SynerexAI:</strong> ${message}`;
            statusDiv.style.fontStyle = 'italic';
            statusDiv.style.opacity = '0.8';
            
            chatMessages.appendChild(statusDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        console.log(`📢 Status: ${message}`);
    }
    
    hideSimpleStatus() {
        // Remove status message from chat
        const statusEl = document.getElementById('currentStatusMessage');
        if (statusEl) {
            statusEl.remove();
        }
    }
    
    async initialize() {
        try {
            // Silently test connection - don't spam console with logs
            const connected = await this.testConnection();
            this.initialized = true;
            // Only log if service is available
            if (connected) {
                console.log('✅ Ollama AI Service available');
            }
            // Silently handle missing service - it's optional
        } catch (error) {
            // Silently handle initialization failure - service is optional
            this.initialized = true; // Mark as initialized even if failed
            this.isConnected = false;
        }
    }
    
    async testConnection() {
        try {
            // Add timeout to prevent hanging on connection refused
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.isConnected = true;
                console.log('✅ Ollama AI Service connected:', data.model);
                
                // Update UI indicator if it exists
                const statusIndicator = document.getElementById('ai-service-status');
                if (statusIndicator) {
                    statusIndicator.textContent = 'Connected';
                    statusIndicator.className = 'status-connected';
                }
                
                // Log Ollama status if available
                if (data.ollama_status) {
                    if (data.ollama_status === 'healthy') {
                        console.log('✅ Ollama (port 11434) is running');
                    } else {
                        console.warn('⚠️ Ollama (port 11434) status:', data.ollama_status);
                    }
                }
                
                return true;
            } else {
                this.isConnected = false;
                
                // Update UI indicator
                const statusIndicator = document.getElementById('ai-service-status');
                if (statusIndicator) {
                    statusIndicator.textContent = 'Unhealthy';
                    statusIndicator.className = 'status-disconnected';
                }
                
                // Silently handle unhealthy service
                return false;
            }
        } catch (error) {
            this.isConnected = false;
            
            // Update UI indicator
            const statusIndicator = document.getElementById('ai-service-status');
            if (statusIndicator) {
                statusIndicator.textContent = 'Disconnected';
                statusIndicator.className = 'status-disconnected';
            }
            
            // Log connection errors for debugging
            if (error.name === 'AbortError') {
                console.warn('⚠️ Ollama AI Service connection timeout (service may be starting)');
            } else {
                console.warn('⚠️ Ollama AI Service not available:', error.message);
            }
            
            return false;
        }
    }
    
    async getLocationWithPermission() {
        if (this.userLocation) {
            return this.userLocation;
        }
        
        if (!this.locationPermissionAsked) {
            this.locationPermissionAsked = true;
            
            try {
                // Request location permission
                const position = await this.getCurrentPosition();
                this.userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                
                // Reverse geocoding to get city/state
                const cityState = await this.reverseGeocode(this.userLocation.latitude, this.userLocation.longitude);
                this.userLocation.cityState = cityState.fullLocation;
                this.userLocation.city = cityState.city;
                this.userLocation.state = cityState.state;
                this.userLocation.climateZone = cityState.climateZone;
                
                console.log('✅ Location obtained:', this.userLocation.cityState);
                return this.userLocation;
                
            } catch (error) {
                console.log('⚠️ Location access denied or failed:', error.message);
                return null;
            }
        }
        
        return null;
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    async reverseGeocode(lat, lon) {
        try {
            // Use BigDataCloud free reverse geocoding service
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await response.json();
            
            const climateZone = this.determineClimateZone(data.principalSubdivision);
            
            return {
                city: data.city,
                state: data.principalSubdivision,
                country: data.countryName,
                fullLocation: `${data.city}, ${data.principalSubdivision}`,
                climateZone: climateZone
            };
            
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return {
                city: 'Unknown',
                state: 'Unknown', 
                country: 'Unknown',
                fullLocation: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
                climateZone: this.determineClimateZoneByCoordinates(lat, lon)
            };
        }
    }
    
    determineClimateZone(state) {
        const stateZones = {
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
        };
        
        return stateZones[state] || 'zone_5'; // Default to mixed dry
    }
    
    determineClimateZoneByCoordinates(lat, lon) {
        if (lat > 45) return 'zone_7'; // Cold
        if (lat > 35) return 'zone_5'; // Mixed
        if (lat > 25) return 'zone_3'; // Hot dry
        return 'zone_1'; // Very hot
    }
    
    questionNeedsLocation(question) {
        const locationKeywords = [
            'utility', 'rate', 'electricity', 'cost', 'billing', 'tariff', 'charge',
            'weather', 'temperature', 'climate', 'seasonal', 'heating', 'cooling',
            'here', 'local', 'regional', 'area', 'location'
        ];
        
        const questionLower = question.toLowerCase();
        return locationKeywords.some(keyword => questionLower.includes(keyword));
    }
    
    async askAI(question, projectContext = null) {
        // Wait for initialization if not complete
        if (!this.initialized) {
            console.log('⏳ Waiting for Ollama AI Service initialization...');
            await this.initialize();
        }
        
        if (!this.isConnected) {
            const connected = await this.testConnection();
            if (!connected) {
                return this.getFallbackResponse(question);
            }
        }
        
        // Show simple status
        this.showSimpleStatus('SynerexAI is thinking...');
        
        // Check if question needs location
        const needsLocation = this.questionNeedsLocation(question);
        
        // Get location if needed - ONLY use project location, never browser geolocation
        let locationData = null;
        if (needsLocation) {
            // Get location from loaded project ONLY
            locationData = this.getLocationDataFromProject();
            
            if (locationData) {
                this.showSimpleStatus(`Using project location: ${locationData.cityState || locationData.city || locationData.state} - Processing...`);
            } else {
                // No project location available - inform user
                this.showSimpleStatus('⚠️ Project location not found. Please ensure the project has city/state information.');
                console.warn('⚠️ Location required but no project location data found. User should add location to project.');
                // Continue without location - AI can still respond but may be less accurate
            }
        }
        
        // Check if question might be too complex
        const questionLength = question.length;
        const hasComplexWords = /\b(create|generate|make|build|design|develop|implement|program|code|write|document|manual|guide|tutorial|step-by-step|detailed|comprehensive|complete|full|extensive)\b/i.test(question);
        
        if (questionLength > 100 || hasComplexWords) {
            this.showSimpleStatus('Complex question - may take longer...');
        }
        
        try {
            // Prepare request data with location
            const requestData = {
                question: question,
                project_context: projectContext || this.getProjectContext(),
                location_data: locationData,
                conversation_history: this.conversationHistory.slice(-5) // Last 5 messages
            };
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
            
            // Call Ollama AI backend
            const response = await fetch(`${this.baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                signal: controller.signal  // Add timeout signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Clear status
            this.hideSimpleStatus();
            
            // Update conversation history
            this.conversationHistory.push({
                type: 'user',
                message: question,
                timestamp: new Date().toISOString()
            });
            
            this.conversationHistory.push({
                type: 'assistant',
                message: data.response,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                response: data.response,
                model: data.model,
                timestamp: data.timestamp
            };
            
        } catch (error) {
            // Clear status on error
            this.hideSimpleStatus();
            
            console.error('AI request failed:', error);
            
            // Handle abort/timeout errors
            if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('timed out')) {
                return {
                    success: false,
                    response: `I'm having trouble processing your question - the request timed out. This may be because:
• The question is too complex
• Ollama is not running or is overloaded
• The network connection is slow

Try asking a more specific question about:
• **XECO Product Specifications**: "What are the specs for XECO-PFC?"
• **Installation Steps**: "What are the basic installation steps for XECO-HF?"
• **Standards Compliance**: "What IEEE standards apply to power factor correction?"

Please ensure Ollama is running on port 11434 for full AI capabilities.`
                };
            }
            
            // Handle connection errors
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return {
                    success: false,
                    response: `Unable to connect to the AI service. Please check:
• The Ollama AI Backend service (port 8090) is running
• Ollama is installed and running on port 11434
• There are no firewall or network issues

You can check service status in the Admin Panel.`
                };
            }
            
            return this.getFallbackResponse(question);
        }
    }
    
    getProjectContext() {
        // Extract project context from the current form/page
        const context = {};
        
        // Try to get project data from the form
        // Use actual field names from the form
        const projectName = document.querySelector('input[name="project_name"], input[name="projectName"], #projectName')?.value;
        const facilityName = document.querySelector('input[name="facility_name"], input[name="facilityName"]')?.value;
        const facilityAddress = document.querySelector('#facility_address, input[name="facility_address"], input[name="facilityAddress"], textarea[name="facility_address"]')?.value;
        // City field: id="facility_city" but name="location"
        const city = document.querySelector('#facility_city, input[name="location"], input[name="city"], input[name="facility_city"]')?.value;
        // State field: id="facility_state" and name="facility_state"
        const state = document.querySelector('#facility_state, input[name="facility_state"], select[name="facility_state"], input[name="state"], select[name="state"]')?.value;
        // ZIP field: id="facility_zip" and name="facility_zip"
        const zip = document.querySelector('#facility_zip, input[name="facility_zip"], input[name="zip"], input[name="zip_code"], input[name="zipCode"]')?.value;
        const location = document.querySelector('input[name="location"]')?.value;
        const contactName = document.querySelector('input[name="contact_name"], input[name="contactName"]')?.value;
        const contactEmail = document.querySelector('input[name="contact_email"], input[name="contactEmail"]')?.value;
        const contactPhone = document.querySelector('input[name="contact_phone"], input[name="contactPhone"]')?.value;
        
        if (projectName) context.project_name = projectName;
        if (facilityName) context.facility_name = facilityName;
        if (facilityAddress) context.facility_address = facilityAddress;
        if (city) context.city = city;
        if (state) context.state = state;
        if (zip) context.zip = zip;
        if (location) context.location = location;
        if (contactName) context.contact_name = contactName;
        if (contactEmail) context.contact_email = contactEmail;
        if (contactPhone) context.contact_phone = contactPhone;
        
        return context;
    }
    
    // Add method to extract location data for utility rate service
    getLocationDataFromProject() {
        // Try multiple field name variations to match the actual form
        // City field: id="facility_city" but name="location"
        const city = document.querySelector('#facility_city, input[name="location"], input[name="city"], input[name="facility_city"]')?.value;
        // State field: id="facility_state" and name="facility_state"
        const state = document.querySelector('#facility_state, input[name="facility_state"], select[name="facility_state"], input[name="state"], select[name="state"]')?.value;
        // ZIP field: id="facility_zip" and name="facility_zip"
        const zip = document.querySelector('#facility_zip, input[name="facility_zip"], input[name="zip"], input[name="zip_code"], input[name="zipCode"]')?.value;
        // Address field: id="facility_address" and name="facility_address"
        const facilityAddress = document.querySelector('#facility_address, input[name="facility_address"], input[name="facilityAddress"], textarea[name="facility_address"]')?.value;
        
        // Build location data object
        const locationData = {};
        
        if (city) locationData.city = city.trim();
        if (state) locationData.state = state.trim();
        if (zip) locationData.zip = zip.trim();
        
        // Build cityState string if we have city and state
        if (city && state) {
            locationData.cityState = `${city.trim()}, ${state.trim()}`;
        } else if (facilityAddress) {
            // Try to extract city/state from address
            const addressParts = facilityAddress.split(',');
            if (addressParts.length >= 2) {
                const extractedCity = addressParts[addressParts.length - 2]?.trim();
                const stateZip = addressParts[addressParts.length - 1]?.trim();
                const extractedState = stateZip.split(' ')[0]?.trim();
                if (extractedCity) locationData.city = extractedCity;
                if (extractedState) locationData.state = extractedState;
                if (extractedCity && extractedState) {
                    locationData.cityState = `${extractedCity}, ${extractedState}`;
                }
            }
        }
        
        // Determine climate zone if we have state
        if (locationData.state) {
            locationData.climateZone = this.determineClimateZone(locationData.state);
        }
        
        // Debug logging
        if (Object.keys(locationData).length > 0) {
            console.log('✅ Found project location:', locationData);
        } else {
            console.warn('⚠️ No location data found. Checked fields:', {
                city: city || 'not found',
                state: state || 'not found',
                zip: zip || 'not found',
                address: facilityAddress ? 'found (but no city/state extracted)' : 'not found'
            });
        }
        
        return Object.keys(locationData).length > 0 ? locationData : null;
    }
    
    getFallbackResponse(question) {
        // Fallback responses when AI service is unavailable
        const fallbackResponses = {
            'install': 'I can help with installation guidance. Please ensure the Ollama AI service is running for detailed instructions.',
            'specification': 'For detailed product specifications, please check the XECO product documentation or ensure the AI service is available.',
            'troubleshoot': 'Troubleshooting assistance requires the AI service. Please check that Ollama is running on port 8090.',
            'standard': 'Energy standards information is available through the knowledge base. Please ensure the AI service is connected.',
            'default': 'I apologize, but the AI service is currently unavailable. Please check that Ollama is running and try again.'
        };
        
        const questionLower = question.toLowerCase();
        let response = fallbackResponses.default;
        
        if (questionLower.includes('install')) {
            response = fallbackResponses.install;
        } else if (questionLower.includes('specification') || questionLower.includes('spec')) {
            response = fallbackResponses.specification;
        } else if (questionLower.includes('troubleshoot') || questionLower.includes('problem')) {
            response = fallbackResponses.troubleshoot;
        } else if (questionLower.includes('standard') || questionLower.includes('ieee') || questionLower.includes('ashrae')) {
            response = fallbackResponses.standard;
        }
        
        return {
            success: false,
            response: response,
            model: 'fallback',
            timestamp: new Date().toISOString(),
            error: 'AI service unavailable'
        };
    }
    
    async searchKnowledge(query, type = 'all') {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/knowledge/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    type: type
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return {
                success: true,
                results: data.results,
                total: data.total_results
            };
            
        } catch (error) {
            console.error('Knowledge search failed:', error);
            return {
                success: false,
                results: [],
                total: 0,
                error: error.message
            };
        }
    }
    
    async getKnowledgeStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/ai/knowledge/stats`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get knowledge stats:', error);
            return {};
        }
    }
    
    clearHistory() {
        this.conversationHistory = [];
    }
    
    getHistory() {
        return this.conversationHistory;
    }
}

// Global instance
window.ollamaAI = new OllamaAIService();

// Integration with existing SynerexAI system
window.askOllamaAI = async function(question, projectContext) {
    return await window.ollamaAI.askAI(question, projectContext);
};

// Enhanced AI response generation (replaces the fake AI)
window.generateAIResponse = async function(question, projectContext) {
    const result = await window.ollamaAI.askAI(question, projectContext);
    
    if (result.success) {
        return result.response;
    } else {
        // Ensure we return a string, not an object
        const fallbackMsg = typeof result.response === 'string' 
            ? result.response 
            : 'The AI service is currently unavailable. Please ensure Ollama is running on port 11434.';
        
        return `**SynerexAI Response:**\n\n${fallbackMsg}\n\n*Note: The AI service is currently unavailable. Please ensure Ollama is installed and running on port 11434 for full AI capabilities. The backend service (port 8090) is running, but it requires Ollama to generate responses.*`;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OllamaAIService;
}
