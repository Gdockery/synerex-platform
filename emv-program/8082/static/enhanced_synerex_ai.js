/**
 * Enhanced SynerexAI with Project Context Access
 * This module provides intelligent AI responses based on actual project data
 * Now integrated with real Ollama AI backend
 */

class EnhancedSynerexAI {
    constructor() {
        this.projectData = null;
        this.locationData = null;
        this.weatherData = null;
        this.energyContext = null;
        this.knowledgeBase = null;
        this.analysisResults = null;
        this.userPreferences = {};
        this.conversationHistory = [];
        
        // Initialize knowledge base if available
        if (typeof SynerexAIKnowledgeBase !== 'undefined') {
            this.knowledgeBase = new SynerexAIKnowledgeBase();
            console.log('✅ SynerexAI Knowledge Base initialized with User Guides');
        } else {
            console.warn('⚠️ SynerexAI Knowledge Base not available - using basic responses');
        }
        
        // Initialize Ollama AI service if available (optional service)
        // Use the global instance if it exists (created by ollama_ai_service.js)
        // Wait a bit for ollama_ai_service.js to finish loading if needed
        this.ollamaAI = null;
        
        // Try to get the global instance (may not be ready yet if scripts load async)
        if (window.ollamaAI) {
            // Use the global instance that's already initialized
            this.ollamaAI = window.ollamaAI;
            console.log('✅ Using global Ollama AI Service instance');
        } else if (typeof OllamaAIService !== 'undefined') {
            // Wait a moment for global instance to be created
            setTimeout(() => {
                if (window.ollamaAI) {
                    this.ollamaAI = window.ollamaAI;
                    console.log('✅ Using global Ollama AI Service instance (delayed)');
                } else {
                    // Fallback: create new instance if global doesn't exist after delay
                    this.ollamaAI = new OllamaAIService();
                    console.log('✅ Created new Ollama AI Service instance (fallback)');
                }
            }, 100);
        } else {
            // Silently handle missing service - it's optional
            console.warn('⚠️ Ollama AI Service not available');
        }
        
        // Load user preferences
        this.loadUserPreferences();
        
        // Set up analysis results monitoring
        this.setupAnalysisResultsMonitoring();
        
        // Initialize conversation tracking
        this.initializeConversationTracking();
        
        console.log('✅ SynerexAI Enhanced: Core capabilities initialized');
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('synerex_ai_preferences');
            if (saved) {
                this.userPreferences = JSON.parse(saved);
                console.log('✅ User preferences loaded:', this.userPreferences);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user preferences:', error);
            this.userPreferences = {};
        }
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('synerex_ai_preferences', JSON.stringify(this.userPreferences));
            console.log('✅ User preferences saved');
        } catch (error) {
            console.warn('⚠️ Failed to save user preferences:', error);
        }
    }

    /**
     * Set up monitoring for analysis results
     */
    setupAnalysisResultsMonitoring() {
        // Monitor for analysis results in the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.checkForAnalysisResults();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Analysis results monitoring active');
    }

    /**
     * Check for analysis results in the DOM
     */
    checkForAnalysisResults() {
        // Look for analysis results containers
        const resultsContainers = document.querySelectorAll('.analysis-results, .power-analysis-results, .harmonics-results');
        
        if (resultsContainers.length > 0) {
            this.analysisResults = this.extractAnalysisResults(resultsContainers);
            console.log('📊 Analysis results detected:', this.analysisResults);
        }
    }

    /**
     * Extract analysis results from DOM elements
     */
    extractAnalysisResults(containers) {
        const results = {};
        
        containers.forEach((container, index) => {
            const title = container.querySelector('h3, h4, .title')?.textContent || `Results ${index + 1}`;
            const data = {};
            
            // Extract key-value pairs
            const rows = container.querySelectorAll('tr, .data-row');
            rows.forEach(row => {
                const key = row.querySelector('td:first-child, .key')?.textContent?.trim();
                const value = row.querySelector('td:last-child, .value')?.textContent?.trim();
                if (key && value) {
                    data[key] = value;
                }
            });
            
            results[title] = data;
        });
        
        return results;
    }

    /**
     * Initialize conversation tracking
     */
    initializeConversationTracking() {
        // Load conversation history from localStorage
        try {
            const saved = localStorage.getItem('synerex_ai_conversation');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load conversation history:', error);
            this.conversationHistory = [];
        }
        
        console.log('✅ Conversation tracking initialized');
    }

    /**
     * Save conversation history
     */
    saveConversationHistory() {
        try {
            // Keep only last 50 messages
            const recentHistory = this.conversationHistory.slice(-50);
            localStorage.setItem('synerex_ai_conversation', JSON.stringify(recentHistory));
        } catch (error) {
            console.warn('⚠️ Failed to save conversation history:', error);
        }
    }

    /**
     * Extract project data from the current form/page
     */
    extractProjectData() {
        const projectData = {};
        
        // Extract form data
        const form = document.querySelector('form');
        if (form) {
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                if (value && value.trim()) {
                    projectData[key] = value.trim();
                }
            }
        }
        
        // Extract specific project fields
        const fields = [
            'project_name', 'projectName', 'facility_name', 'facilityName',
            'location', 'city', 'state', 'contact_name', 'contactName',
            'contact_email', 'contactEmail', 'contact_phone', 'contactPhone',
            'utility_name', 'utilityName', 'account_number', 'accountNumber'
        ];
        
        fields.forEach(field => {
            const element = document.querySelector(`[name="${field}"], #${field}`);
            if (element && element.value) {
                projectData[field] = element.value.trim();
            }
        });
        
        this.projectData = projectData;
        return projectData;
    }

    /**
     * Extract location data - ONLY use project location from form fields
     * Never uses browser geolocation (project location != user location)
     */
    extractLocationData() {
        const locationData = {};
        
        // FIRST: Try to get location from project form fields (PRIORITY)
        // Use actual field names from the form
        // City field: id="facility_city" but name="location"
        const city = document.querySelector('#facility_city, input[name="location"], input[name="city"], input[name="facility_city"]')?.value;
        // State field: id="facility_state" and name="facility_state"
        const state = document.querySelector('#facility_state, input[name="facility_state"], select[name="facility_state"], input[name="state"], select[name="state"]')?.value;
        // ZIP field: id="facility_zip" and name="facility_zip"
        const zip = document.querySelector('#facility_zip, input[name="facility_zip"], input[name="zip"], input[name="zip_code"], input[name="zipCode"]')?.value;
        // Address field: id="facility_address" and name="facility_address"
        const facilityAddress = document.querySelector('#facility_address, input[name="facility_address"], input[name="facilityAddress"], textarea[name="facility_address"]')?.value;
        
        // If we have project location data, use it
        if (city || state || facilityAddress) {
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
            if (locationData.state && window.ollamaAI && typeof window.ollamaAI.determineClimateZone === 'function') {
                locationData.climateZone = window.ollamaAI.determineClimateZone(locationData.state);
            }
            
            this.locationData = locationData;
            console.log('✅ Using project location:', locationData.cityState || locationData.city || locationData.state);
            return locationData;
        }
        
        // FALLBACK: Only use generic location field if no project location is available
        const locationField = document.querySelector('[name="location"]');
        if (locationField && locationField.value) {
            locationData.location = locationField.value.trim();
            this.locationData = locationData;
            return locationData;
        }
        
        // No location available - return empty (never use browser geolocation)
        this.locationData = locationData;
        if (Object.keys(locationData).length === 0) {
            console.warn('⚠️ No project location data found. Checked fields:', {
                city: city || 'not found',
                state: state || 'not found',
                zip: zip || 'not found',
                address: facilityAddress ? 'found (but no city/state extracted)' : 'not found'
            });
        }
        return locationData;
    }

    /**
     * Generate enhanced AI response using Ollama backend
     */
    async generateEnhancedResponse(question, context = {}) {
        try {
            // Extract current project data
            const projectData = this.extractProjectData();
            
            // PRIORITIZE: Use getLocationDataFromProject from ollama_ai_service if available
            let locationData = null;
            if (window.ollamaAI && typeof window.ollamaAI.getLocationDataFromProject === 'function') {
                locationData = window.ollamaAI.getLocationDataFromProject();
                if (locationData) {
                    console.log('✅ Using project location from ollama_ai_service:', locationData.cityState || locationData.city || locationData.state);
                }
            }
            
            // Fallback to extractLocationData if no project location found
            if (!locationData || Object.keys(locationData).length === 0) {
                locationData = this.extractLocationData();
            }
            
            // Prepare context for AI
            const aiContext = {
                ...context,
                ...projectData,
                ...locationData,
                analysis_results: this.analysisResults,
                user_preferences: this.userPreferences
            };
            
            // Use Ollama AI if available - check global instance first
            let ollamaService = this.ollamaAI || window.ollamaAI;
            
            if (ollamaService) {
                // Ensure service is initialized
                if (!ollamaService.initialized) {
                    await ollamaService.initialize();
                }
                
                // Test connection if not connected (but don't spam retries)
                if (!ollamaService.isConnected) {
                    const connected = await ollamaService.testConnection();
                    if (!connected) {
                        console.warn('⚠️ Ollama AI Service not connected, using fallback');
                        return this.generateFallbackResponse(question, aiContext);
                    }
                }
                
                // Try to get AI response
                try {
                    const result = await ollamaService.askAI(question, aiContext);
                    
                    if (result && result.success) {
                        // Add to conversation history
                        this.conversationHistory.push({
                            type: 'user',
                            message: question,
                            timestamp: new Date().toISOString()
                        });
                        
                        this.conversationHistory.push({
                            type: 'assistant',
                            message: result.response,
                            timestamp: new Date().toISOString()
                        });
                        
                        this.saveConversationHistory();
                        
                        return result.response;
                    } else if (result && result.response) {
                        // Even if not marked as success, return the response if it exists
                        return result.response;
                    }
                } catch (error) {
                    console.error('❌ Error calling Ollama AI:', error);
                    // Fall through to fallback
                }
            }
            
            // Fallback to knowledge base or basic response
            return this.generateFallbackResponse(question, aiContext);
            
        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return this.generateFallbackResponse(question, context);
        }
    }

    /**
     * Generate fallback response when AI service is unavailable
     */
    generateFallbackResponse(question, context) {
        const questionLower = question.toLowerCase();
        
        // Check knowledge base for relevant information
        if (this.knowledgeBase) {
            const kbResponse = this.knowledgeBase.searchKnowledge(question);
            if (kbResponse && kbResponse.length > 0) {
                return `**SynerexAI Response:**\n\n${kbResponse}\n\n*Note: This response is from the knowledge base. For more advanced AI capabilities, please ensure the Ollama service is running.*`;
            }
        }
        
        // Generate contextual response based on question type
        if (questionLower.includes('install')) {
            return this.generateInstallationResponse(question, context);
        } else if (questionLower.includes('specification') || questionLower.includes('spec')) {
            return this.generateSpecificationResponse(question, context);
        } else if (questionLower.includes('troubleshoot') || questionLower.includes('problem')) {
            return this.generateTroubleshootingResponse(question, context);
        } else if (questionLower.includes('standard') || questionLower.includes('ieee') || questionLower.includes('ashrae')) {
            return this.generateStandardsResponse(question, context);
        } else {
            return this.generateGeneralResponse(question, context);
        }
    }

    /**
     * Generate installation-related response
     */
    generateInstallationResponse(question, context) {
        return `**Installation Assistance:**

Based on your question about installation, here are some general guidelines:

1. **Safety First**: Always ensure proper electrical safety procedures
2. **Qualified Personnel**: Use qualified electricians for all installations
3. **Documentation**: Review all installation guides and specifications
4. **Testing**: Perform thorough testing after installation
5. **Compliance**: Ensure compliance with local electrical codes

For specific installation instructions, please refer to the XECO product documentation or contact technical support.

*Note: For detailed AI-powered installation guidance, please ensure the Ollama AI service is running.*`;
    }

    /**
     * Generate specification-related response
     */
    generateSpecificationResponse(question, context) {
        return `**Product Specifications:**

For detailed product specifications, please refer to:

1. **XECO Product Database**: Available in the knowledge base
2. **Technical Datasheets**: Download from XECO website
3. **Installation Guides**: Include detailed specifications
4. **Equipment Database**: Comprehensive technical data

Key specification categories include:
- Voltage and current ratings
- Power factor and efficiency
- Environmental specifications
- Installation requirements
- Compliance standards

*Note: For AI-powered specification analysis, please ensure the Ollama service is running.*`;
    }

    /**
     * Generate troubleshooting response
     */
    generateTroubleshootingResponse(question, context) {
        return `**Troubleshooting Assistance:**

For troubleshooting power quality issues, consider these steps:

1. **Identify Symptoms**: Document specific problems observed
2. **Check Measurements**: Verify voltage, current, and power factor
3. **Review Standards**: Compare against IEEE 519 and other standards
4. **Equipment Status**: Check harmonic filters and power factor correction
5. **Environmental Factors**: Consider temperature, humidity, and load conditions

Common issues include:
- Harmonic distortion
- Power factor problems
- Voltage fluctuations
- Equipment malfunctions

*Note: For AI-powered troubleshooting analysis, please ensure the Ollama service is running.*`;
    }

    /**
     * Generate standards-related response
     */
    generateStandardsResponse(question, context) {
        return `**Energy Standards Information:**

Key standards relevant to power quality analysis:

1. **IEEE 519-2022**: Harmonic Control in Electric Power Systems
2. **ASHRAE 14**: Measurement of Energy and Demand Savings
3. **IEC 61000**: Electromagnetic Compatibility Standards
4. **NEMA Standards**: Motor and equipment specifications

Standards typically cover:
- Harmonic distortion limits
- Power factor requirements
- Voltage and current tolerances
- Equipment performance criteria
- Testing and measurement procedures

*Note: For AI-powered standards analysis, please ensure the Ollama service is running.*`;
    }

    /**
     * Generate general response
     */
    generateGeneralResponse(question, context) {
        return `**SynerexAI Response:**

Thank you for your question. I'm here to help with power quality analysis, XECO product information, and system optimization.

I can assist with:
- Product specifications and installation
- Troubleshooting power quality issues
- Energy standards compliance
- System analysis and recommendations
- Technical documentation

For the most comprehensive AI assistance, please ensure the Ollama AI service is running on port 8090.

*Current Status: Using fallback response mode*`;
    }

    /**
     * Get conversation history
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Clear conversation history
     */
    clearConversationHistory() {
        this.conversationHistory = [];
        this.saveConversationHistory();
        console.log('✅ Conversation history cleared');
    }

    /**
     * Update user preferences
     */
    updateUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        this.saveUserPreferences();
        console.log('✅ User preferences updated:', preferences);
    }
}

// Export class globally so it can be instantiated
window.EnhancedSynerexAI = EnhancedSynerexAI;

// Global instance
window.enhancedAI = new EnhancedSynerexAI();

// Legacy compatibility
window.generateAIResponse = async function(question, projectContext) {
    return await window.enhancedAI.generateEnhancedResponse(question, projectContext);
};

console.log('✅ Enhanced SynerexAI initialized with Ollama integration');
