/**
 * SYNEREX AI Knowledge Base
 * Comprehensive knowledge database incorporating all User Guides
 * This allows SynerexAI to answer questions without users needing to search guides
 */

class SynerexAIKnowledgeBase {
    constructor() {
        this.knowledgeBase = this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        return {
            // System Overview and Capabilities
            systemOverview: {
                title: "SYNEREX Power Analysis System",
                version: "3.1",
                description: "Engineering-grade power analysis system with 100% standards compliance",
                capabilities: [
                    "Power quality analysis and harmonic filtering",
                    "Energy efficiency optimization and savings calculations",
                    "Weather normalization and baseline adjustments",
                    "Utility rate analysis and cost optimization",
                    "XECO equipment recommendations and installation guidance",
                    "Standards compliance verification (IEEE 519, ASHRAE 14, IPMVP)",
                    "Professional engineering review and audit trails",
                    "Comprehensive reporting and documentation"
                ],
                standardsCompliance: [
                    "IEEE 519-2014/2022 - Harmonic limits and power quality",
                    "ASHRAE Guideline 14-2014 - Statistical validation and M&V",
                    "NEMA MG1-2016 - Phase balance and motor efficiency",
                    "IEC 61000 Series - EMC and power quality standards",
                    "ANSI C12.1/C12.20 - Meter accuracy classes",
                    "IPMVP Volume I - Measurement and verification protocol",
                    "ISO 19011:2018 - Audit guidelines and professional review"
                ]
            },

            // User Guide Knowledge
            userGuide: {
                gettingStarted: {
                    title: "Getting Started with SYNEREX",
                    steps: [
                        "1. Access the main dashboard at http://localhost:8082",
                        "2. Create a new project or select existing project",
                        "3. Fill out the project form with facility details",
                        "4. Upload CSV meter data files",
                        "5. Configure analysis parameters",
                        "6. Run the analysis and review results",
                        "7. Generate reports and documentation"
                    ],
                    dataRequirements: [
                        "Facility information (name, location, type)",
                        "Contact information (name, email, phone)",
                        "Utility information (utility name, account number)",
                        "Equipment description and specifications",
                        "CSV meter data files (before/after periods)",
                        "Temperature and weather data (optional)"
                    ]
                },
                dataUpload: {
                    title: "Data Upload and Processing",
                    csvRequirements: [
                        "Format: CSV files with timestamp and power data",
                        "Columns: Date/Time, kW, kVA, Power Factor, Voltage, Current",
                        "Frequency: 15-minute or hourly intervals recommended",
                        "Duration: Minimum 14 days, recommended 30+ days",
                        "Quality: 95%+ data completeness required"
                    ],
                    supportedFormats: [
                        "CSV files with standard power quality data",
                        "Excel files (.xlsx) with meter data",
                        "Text files with delimited data",
                        "SCADA system exports",
                        "Utility meter data exports"
                    ]
                },
                analysisParameters: {
                    title: "Analysis Parameter Configuration",
                    parameters: [
                        "Equipment type (chiller, motor, lighting, etc.)",
                        "Target power factor (default: 0.95)",
                        "Base temperature for weather normalization (default: 18.3°C)",
                        "Statistical confidence level (default: 95%)",
                        "Harmonic analysis limits (IEEE 519 compliance)",
                        "Phase balance requirements (NEMA MG1 standards)"
                    ],
                    recommendations: [
                        "Use default parameters for standard analysis",
                        "Adjust target power factor based on utility requirements",
                        "Set appropriate base temperature for climate zone",
                        "Enable all compliance checks for audit readiness"
                    ]
                }
            },

            // Admin Guide Knowledge
            adminGuide: {
                systemManagement: {
                    title: "System Administration",
                    services: [
                        "Main Application (Port 8082) - Core analysis system",
                        "PDF Generator (Port 8083) - Report generation",
                        "HTML Report Service (Port 8084) - Web-based reports",
                        "Chart Service (Port 8086) - Data visualization",
                        "Weather Service (Port 8200) - Weather data integration"
                    ],
                    management: [
                        "Start/Stop/Restart services via Admin Panel",
                        "Monitor service health and status",
                        "View system logs and diagnostics",
                        "Update User Guides and documentation",
                        "Manage user access and permissions"
                    ]
                },
                troubleshooting: {
                    title: "Troubleshooting Common Issues",
                    commonProblems: [
                        "Service not responding - Check service status and restart",
                        "Data upload failures - Verify CSV format and data quality",
                        "Analysis errors - Check data completeness and parameters",
                        "Report generation issues - Ensure all services are running",
                        "Weather data unavailable - Check weather service connection"
                    ],
                    solutions: [
                        "Use Admin Panel to restart services",
                        "Verify CSV file format and data quality",
                        "Check system logs for error messages",
                        "Ensure all required services are running",
                        "Contact system administrator for persistent issues"
                    ]
                }
            },

            // Engineering Guide Knowledge
            engineeringGuide: {
                technicalSpecifications: {
                    title: "Engineering Technical Specifications",
                    calculations: [
                        "Power Factor Correction: Required kVAR = kW × (tan(φ1) - tan(φ2))",
                        "Harmonic Analysis: THD = √(Σ(h=2 to 50) (Ih/I1)²) × 100%",
                        "Energy Savings: Baseline - Post-retrofit with weather normalization",
                        "ROI Calculations: Simple payback, NPV, IRR, SIR",
                        "Statistical Validation: CVRMSE, NMBE, R² with proper degrees of freedom"
                    ],
                    standards: [
                        "IEEE 519-2014/2022: Harmonic limits based on ISC/IL ratio",
                        "ASHRAE Guideline 14: Statistical validation with CVRMSE < 15%",
                        "NEMA MG1: Voltage unbalance limit < 1%",
                        "IEC 61000-4-30: Class A instrument accuracy ±0.5%",
                        "IPMVP: Statistical significance p < 0.05"
                    ]
                },
                equipmentSpecifications: {
                    title: "Equipment Specifications and Requirements",
                    xecoProducts: [
                        "XECO-HF Series: Harmonic filtering for VFDs and LED lighting",
                        "XECO-PF Series: Power factor correction for industrial loads",
                        "XECO-ES Series: Energy storage for peak shaving",
                        "XECO-SM Series: Smart monitoring and control systems"
                    ],
                    installationRequirements: [
                        "Electrical clearance: 3 feet front, 1 foot sides",
                        "Ventilation: Adequate airflow for heat dissipation",
                        "Grounding: Proper grounding and bonding required",
                        "Permits: Electrical permits required before installation",
                        "Codes: NEC and local electrical code compliance"
                    ]
                }
            },

            // Standards Guide Knowledge
            standardsGuide: {
                complianceRequirements: {
                    title: "Standards Compliance Requirements",
                    ieee519: [
                        "Voltage THD limit: 5% at PCC",
                        "Current THD limit: 15% at PCC",
                        "Individual harmonic limits based on ISC/IL ratio",
                        "PCC location identification required",
                        "Harmonic analysis for 50th harmonic"
                    ],
                    ashrae14: [
                        "Data completeness: ≥95%",
                        "Outlier detection: ≤5%",
                        "Relative precision: <50%",
                        "Statistical significance: p < 0.05",
                        "Weather normalization for cooling equipment"
                    ],
                    ipmvp: [
                        "Option A: Retrofit isolation methodology",
                        "Statistical significance testing",
                        "Baseline energy modeling",
                        "Measurement and verification protocol",
                        "Savings attribution and validation"
                    ]
                },
                auditRequirements: {
                    title: "Audit and Documentation Requirements",
                    documentation: [
                        "Complete calculation methodology documentation",
                        "Standards compliance verification reports",
                        "Professional engineering review and signature",
                        "Audit trail for all calculations and decisions",
                        "Utility submission ready documentation"
                    ],
                    verification: [
                        "Automated compliance checking during analysis",
                        "Real-time validation of standards requirements",
                        "Professional engineering review process",
                        "Audit trail logging for all calculations",
                        "Quality assurance and control procedures"
                    ]
                }
            },

            // SynerexAI Guide Knowledge
            synerexAIGuide: {
                aiCapabilities: {
                    title: "SynerexAI Capabilities and Features",
                    capabilities: [
                        "Project-specific energy analysis guidance",
                        "XECO equipment recommendations and sizing",
                        "Utility rate optimization and cost analysis",
                        "Installation guidance and code compliance",
                        "Form completion assistance and data requirements",
                        "Troubleshooting and technical support",
                        "Standards compliance verification",
                        "ROI calculations and financial analysis"
                    ],
                    usage: [
                        "Ask specific questions about your project",
                        "Request equipment recommendations",
                        "Get utility rate optimization advice",
                        "Receive installation guidance",
                        "Obtain troubleshooting assistance",
                        "Access standards compliance information"
                    ]
                },
                bestPractices: {
                    title: "Best Practices for Using SynerexAI",
                    tips: [
                        "Be specific about your facility and equipment",
                        "Provide location information for utility rates",
                        "Ask about specific standards or requirements",
                        "Request detailed explanations for complex topics",
                        "Use for both technical and business questions"
                    ]
                }
            },

            // Laymen Guide Knowledge
            laymenGuide: {
                businessBenefits: {
                    title: "Business Benefits and ROI",
                    benefits: [
                        "Energy cost savings through efficiency improvements",
                        "Reduced utility bills and demand charges",
                        "Improved power quality and equipment reliability",
                        "Compliance with utility and regulatory requirements",
                        "Professional documentation for incentive programs"
                    ],
                    roi: [
                        "Simple payback: Initial cost ÷ Annual savings",
                        "Net present value (NPV) calculations",
                        "Internal rate of return (IRR) analysis",
                        "Savings-to-investment ratio (SIR)",
                        "Life cycle cost analysis"
                    ]
                },
                reportInterpretation: {
                    title: "Understanding Your Energy Analysis Report",
                    keyMetrics: [
                        "Energy savings (kWh and percentage)",
                        "Demand reduction (kW and percentage)",
                        "Cost savings (annual and total)",
                        "Power quality improvements",
                        "Equipment efficiency gains"
                    ],
                    recommendations: [
                        "Review executive summary for key findings",
                        "Check compliance status for all standards",
                        "Verify savings calculations and assumptions",
                        "Understand recommended next steps",
                        "Use for utility incentive applications"
                    ]
                }
            },

            // Common Questions and Answers
            faq: {
                general: [
                    {
                        question: "What data do I need for SYNEREX analysis?",
                        answer: "You need facility information, contact details, utility information, equipment specifications, and CSV meter data files with timestamp and power data (kW, kVA, power factor, voltage, current)."
                    },
                    {
                        question: "How long should my data collection period be?",
                        answer: "Minimum 14 days, but 30+ days is recommended for better statistical accuracy. The system requires 95%+ data completeness for reliable results."
                    },
                    {
                        question: "What file formats are supported?",
                        answer: "CSV files are primary, but Excel (.xlsx) and text files are also supported. Data should include timestamp and power quality measurements."
                    }
                ],
                technical: [
                    {
                        question: "What standards does SYNEREX comply with?",
                        answer: "SYNEREX complies with IEEE 519, ASHRAE Guideline 14, NEMA MG1, IEC 61000 Series, ANSI C12.1/C12.20, IPMVP, and ISO 19011 - achieving 100% standards compliance."
                    },
                    {
                        question: "How accurate are the calculations?",
                        answer: "SYNEREX provides ±0.5% measurement accuracy (IEC 61000-4-30 Class A), ±0.1% calculation precision, and 95%+ data completeness for utility-grade accuracy."
                    },
                    {
                        question: "What is weather normalization?",
                        answer: "Weather normalization removes temperature effects on cooling equipment to show true energy savings independent of weather conditions, following ASHRAE Guideline 14 methodology."
                    }
                ],
                business: [
                    {
                        question: "How do I calculate ROI for energy projects?",
                        answer: "SYNEREX provides multiple ROI calculations: simple payback (initial cost ÷ annual savings), NPV, IRR, and SIR. Use the financial analysis section of your report."
                    },
                    {
                        question: "Can I use this for utility incentive programs?",
                        answer: "Yes, SYNEREX generates utility-grade documentation suitable for incentive program applications, including all required compliance verification and professional engineering review."
                    },
                    {
                        question: "What equipment does SYNEREX recommend?",
                        answer: "SYNEREX recommends XECO equipment including harmonic filters (HF series), power factor correction (PF series), energy storage (ES series), and smart monitoring (SM series) based on your specific needs."
                    }
                ]
            }
        };
    }

    /**
     * Search knowledge base for relevant information
     */
    searchKnowledge(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        // Search through all knowledge categories
        Object.keys(this.knowledgeBase).forEach(category => {
            const categoryData = this.knowledgeBase[category];
            
            if (typeof categoryData === 'object') {
                Object.keys(categoryData).forEach(subcategory => {
                    const subcategoryData = categoryData[subcategory];
                    
                    if (this.containsRelevantInfo(subcategoryData, lowerQuery)) {
                        results.push({
                            category: category,
                            subcategory: subcategory,
                            data: subcategoryData
                        });
                    }
                });
            }
        });

        return results;
    }

    /**
     * Check if data contains relevant information for query
     */
    containsRelevantInfo(data, query) {
        if (typeof data === 'string') {
            return data.toLowerCase().includes(query);
        } else if (Array.isArray(data)) {
            return data.some(item => 
                typeof item === 'string' ? 
                item.toLowerCase().includes(query) : 
                this.containsRelevantInfo(item, query)
            );
        } else if (typeof data === 'object') {
            return Object.values(data).some(value => 
                this.containsRelevantInfo(value, query)
            );
        }
        return false;
    }

    /**
     * Get comprehensive answer based on query
     */
    getComprehensiveAnswer(query) {
        const searchResults = this.searchKnowledge(query);
        
        if (searchResults.length === 0) {
            return this.getDefaultResponse();
        }

        let answer = "Based on the SYNEREX User Guides knowledge base:\n\n";
        
        searchResults.forEach(result => {
            answer += `**${result.category} - ${result.subcategory}:**\n`;
            
            if (typeof result.data === 'string') {
                answer += `${result.data}\n\n`;
            } else if (Array.isArray(result.data)) {
                result.data.forEach(item => {
                    if (typeof item === 'string') {
                        answer += `• ${item}\n`;
                    } else if (typeof item === 'object' && item.question && item.answer) {
                        answer += `**Q: ${item.question}**\nA: ${item.answer}\n\n`;
                    }
                });
                answer += "\n";
            } else if (typeof result.data === 'object') {
                Object.entries(result.data).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        answer += `• **${key}**: ${value}\n`;
                    } else if (Array.isArray(value)) {
                        answer += `• **${key}**:\n`;
                        value.forEach(item => answer += `  - ${item}\n`);
                    }
                });
                answer += "\n";
            }
        });

        return answer;
    }

    /**
     * Get default response when no specific information found
     */
    getDefaultResponse() {
        return `I can help you with SYNEREX system questions! Here are the main areas I can assist with:

**📊 System Capabilities:**
• Power quality analysis and harmonic filtering
• Energy efficiency optimization and savings calculations
• Weather normalization and baseline adjustments
• Utility rate analysis and cost optimization

**⚡ XECO Equipment:**
• Product recommendations and sizing
• Installation requirements and electrical codes
• Technical specifications and performance data
• Troubleshooting and maintenance guidance

**📋 User Assistance:**
• Form completion and data requirements
• System navigation and feature usage
• Report generation and analysis interpretation
• Standards compliance verification

**🔧 Technical Support:**
• Troubleshooting common issues
• Data upload and processing guidance
• Analysis parameter configuration
• System administration and management

What specific area would you like help with?`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SynerexAIKnowledgeBase;
}

// Make available globally
window.SynerexAIKnowledgeBase = SynerexAIKnowledgeBase;
