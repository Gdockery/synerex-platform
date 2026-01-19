// Main Dashboard JavaScript
class MainDashboard {
    constructor() {

        this.currentUser = null;
        this.sessionToken = localStorage.getItem('session_token');
        this.helpStep = 1;
        this.maxHelpSteps = 5;
        
        // Show login form immediately - don't wait for auth check
        this.showLoginSection();
        
        // CRITICAL: Clear all spinners immediately on initialization
        this.clearAllSpinners();
        
        // Then check authentication in background (non-blocking)
        this.initializeEventListeners();
        // Use setTimeout to make auth check non-blocking
        setTimeout(() => {
            this.checkAuthentication();
        }, 100);

    }
    
    initializeEventListeners() {
        // Check if we're on the main dashboard page
        const loginForm = document.getElementById('user-login');
        const registerForm = document.getElementById('user-registration');
        const logoutBtn = document.getElementById('logout-btn');
        
        // Project Management buttons - attach these FIRST before any early return
        // These should always exist on the dashboard page
        const createProject = document.getElementById('create-project');
        if (createProject) createProject.addEventListener('click', () => this.showCreateProject());
        
        const accessProject = document.getElementById('access-project');
        if (accessProject) {
            accessProject.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Access Project button clicked');
                console.log('🔍 Calling showAccessProject()...');
                try {
                    this.showAccessProject();
                } catch (error) {
                    console.error('❌ Error calling showAccessProject:', error);
                    alert('Error: ' + error.message);
                }
            });
            console.log('✅ Access Project button listener attached');
        } else {
            console.error('❌ Access Project button not found!');
        }
        
        const projectTemplates = document.getElementById('project-templates');
        if (projectTemplates) projectTemplates.addEventListener('click', () => this.showProjectTemplates());
        
        // Authentication - Always try to attach listeners, even if elements don't exist yet
        // Retry after a short delay if elements aren't found (they might be created dynamically)
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
            console.log('✅ Login form listener attached');
        } else {
            // Retry after DOM is ready
            setTimeout(() => {
                const retryLoginForm = document.getElementById('user-login');
                if (retryLoginForm) {
                    retryLoginForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.login();
                    });
                    console.log('✅ Login form listener attached on retry');
                }
            }, 500);
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
            console.log('✅ Register form listener attached');
        } else {
            // Retry after DOM is ready
            setTimeout(() => {
                const retryRegisterForm = document.getElementById('user-registration');
                if (retryRegisterForm) {
                    retryRegisterForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.register();
                    });
                    console.log('✅ Register form listener attached on retry');
                }
            }, 500);
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
            console.log('✅ Logout button listener attached');
        }
        
        // Raw Meter File Storage
        const uploadRawData = document.getElementById('upload-raw-data');
        if (uploadRawData) uploadRawData.addEventListener('click', () => this.showUploadInterface());
        
        const viewRawFiles = document.getElementById('view-raw-files');
        if (viewRawFiles) viewRawFiles.addEventListener('click', () => this.showRawFilesList());
        
        const rawDataStats = document.getElementById('raw-data-stats');
        if (rawDataStats) rawDataStats.addEventListener('click', () => this.showRawDataStatistics());
        
        // CSV File Review
        const startClipping = document.getElementById('start-clipping');
        if (startClipping) startClipping.addEventListener('click', () => this.showClippingInterface());
        
        const viewFingerprints = document.getElementById('view-fingerprints');
        if (viewFingerprints) viewFingerprints.addEventListener('click', () => this.showFingerprintsViewer());
        
        const verifyIntegrity = document.getElementById('verify-integrity');
        if (verifyIntegrity) verifyIntegrity.addEventListener('click', () => this.showIntegrityVerification());
        
        // PE Management - attach listeners
        this.attachPEButtonListeners();
        
        // Help System
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) helpBtn.addEventListener('click', () => this.showHelp());
        
        const closeHelp = document.getElementById('close-help');
        if (closeHelp) closeHelp.addEventListener('click', () => this.hideHelp());
        
        const prevStep = document.getElementById('prev-step');
        if (prevStep) prevStep.addEventListener('click', () => this.previousHelpStep());
        
        const nextStep = document.getElementById('next-step');
        if (nextStep) nextStep.addEventListener('click', () => this.nextHelpStep());
        
        // Notification
        const notificationClose = document.getElementById('notification-close');
        if (notificationClose) notificationClose.addEventListener('click', () => this.hideNotification());
        
        // Password validation
        const regPassword = document.getElementById('reg-password');
        if (regPassword) regPassword.addEventListener('input', () => this.validatePassword());
        
        const regConfirmPassword = document.getElementById('reg-confirm-password');
        if (regConfirmPassword) regConfirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        
        // Footer links
        const systemStatus = document.getElementById('system-status');
        if (systemStatus) {
            systemStatus.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSystemStatus();
            });
        }
        
        const auditCompliance = document.getElementById('audit-compliance');
        if (auditCompliance) {
            auditCompliance.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuditCompliance();
            });
        }
        
        const documentation = document.getElementById('documentation');
        if (documentation) {
            documentation.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDocumentation();
            });
        }
    }
    
    async checkAuthentication() {
        console.log('🔐 checkAuthentication() called');
        
        // CRITICAL: Clear spinners immediately before starting auth check
        this.clearAllSpinners();
        
        // Add a fallback timeout to ensure spinners are always cleared (reduced to 3 seconds)
        const fallbackTimeout = setTimeout(() => {
            console.warn('⚠️ Authentication check taking too long, clearing spinners and showing login');
            this.clearAllSpinners();
            this.showLoginSection(); // Show login if auth check hangs
        }, 3000); // 3 second fallback (reduced from 5)
        
        try {
            if (this.sessionToken) {
                try {
                    // Shorter timeout - 2 seconds max
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        console.error('⏱️ Session validation timed out after 2 seconds');
                        controller.abort();
                    }, 2000); // Reduced to 2 seconds
                    
                    const response = await fetch('/api/auth/validate-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_token: this.sessionToken }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    clearTimeout(fallbackTimeout); // Clear fallback when request completes
                    
                    const result = await response.json();
                    if (result.status === 'success') {
                        console.log('✅ Session valid, showing dashboard');
                        this.currentUser = result.user;
                        this.clearAllSpinners(); // Clear spinners before showing dashboard
                        this.showAuthenticatedDashboard();
                        // Load stats in background - don't block
                        this.loadDashboardStats().catch(err => {
                            console.error('Stats load failed (non-critical):', err);
                        });
                    } else {
                        console.log('❌ Session invalid, showing login');
                        this.clearAllSpinners();
                        this.showLoginSection();
                    }
                } catch (error) {
                    clearTimeout(fallbackTimeout); // Clear fallback on error
                    console.error('❌ Session validation error:', error);
                    // Always clear spinners and show login section on any error
                    this.clearAllSpinners();
                    this.showLoginSection();
                }
            } else {
                clearTimeout(fallbackTimeout); // Clear fallback if no token
                console.log('ℹ️ No session token, showing login');
                this.clearAllSpinners();
                this.showLoginSection();
            }
        } finally {
            // Always clear fallback timeout
            clearTimeout(fallbackTimeout);
        }
    }
    
    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('user-role').value;
        
        // Get org_id from form field if it exists, otherwise default to "admin"
        const orgIdInput = document.getElementById('org-id');
        const org_id = orgIdInput ? orgIdInput.value || 'admin' : 'admin';
        
        if (!username || !password || !role) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Clear any existing spinners first
        this.clearAllSpinners();
        
        try {
            console.log('🔐 Login attempt:', { username, role, org_id });
            this.setLoading(true);
            
            // Add timeout controller to prevent infinite spinner
            const controller = new AbortController();
            let timeoutTriggered = false;
            const timeoutId = setTimeout(() => {
                timeoutTriggered = true;
                console.error('⏱️ Login request timed out after 5 seconds');
                controller.abort();
                // Force clear spinner immediately on timeout
                this.clearAllSpinners();
                this.setLoading(false);
                this.showNotification('Login request timed out. Please check if the server is running on port 8082.', 'error');
            }, 5000);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, role, org_id }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (timeoutTriggered) {
                    return; // Already handled by timeout
                }
                
                console.log('📥 Login response status:', response.status, response.statusText);
                
                // Check if response is OK before parsing JSON
                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error('❌ Login failed:', response.status, errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
                }
                
                // Parse JSON response
                const text = await response.text();
                console.log('📦 Login response text:', text.substring(0, 200));
                
                if (!text) {
                    throw new Error('Empty response from server');
                }
                
                let result;
                try {
                    result = JSON.parse(text);
                } catch (parseError) {
                    console.error('❌ JSON parse error:', parseError, 'Response text:', text);
                    throw new Error('Invalid JSON response from server');
                }
                
                console.log('✅ Login result:', result);
                
                if (result.status === 'success') {
                    this.currentUser = result.user;
                    this.sessionToken = result.session_token;
                    localStorage.setItem('session_token', this.sessionToken);
                    this.showAuthenticatedDashboard();
                    this.loadDashboardStats().catch(err => {
                        console.error('Stats load failed (non-critical):', err);
                    });
                    this.showNotification('Login successful!', 'success');
                } else {
                    console.error('❌ Login failed:', result.error);
                    this.showNotification('Login failed: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (timeoutTriggered || fetchError.name === 'AbortError') {
                    // Already handled by timeout
                    return;
                }
                throw fetchError; // Re-throw to outer catch
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            if (error.name !== 'AbortError') {
                this.showNotification('Login failed: ' + error.message, 'error');
            }
        } finally {
            console.log('🔄 Clearing loading state');
            this.clearAllSpinners();
            this.setLoading(false);
        }
    }
    
    async register() {
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const role = document.getElementById('reg-user-role').value;
        const peLicense = document.getElementById('pe-license').value;
        const state = document.getElementById('state').value;
        
        if (!fullName || !email || !username || !password || !confirmPassword || !role) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        // Validate password strength
        const passwordStrength = this.checkPasswordStrength(password);
        if (passwordStrength === 'weak') {
            this.showNotification('Password is too weak. Please use at least 8 characters with numbers and special characters.', 'error');
            return;
        }
        
        try {
            this.setLoading(true);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    full_name: fullName, email, username, password, role, 
                    pe_license_number: peLicense, state 
                })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.showNotification('Registration successful! Please login.', 'success');
                this.clearRegistrationForm();
            } else {
                this.showNotification('Registration failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    showAuthenticatedDashboard() {
        const loginSection = document.getElementById('login-section');
        const mainSections = document.getElementById('main-sections');
        const userInfo = document.getElementById('user-info');
        const currentUserName = document.getElementById('current-user-name');
        
        if (loginSection) loginSection.style.display = 'none';
        if (mainSections) mainSections.style.display = 'block';
        if (userInfo) userInfo.style.display = 'block';
        
        // Update user info
        if (currentUserName && this.currentUser) {
            currentUserName.textContent = 
                `Welcome, ${this.currentUser.full_name} (${this.currentUser.role.toUpperCase()})`;
        }
        
        // Show PE section if user is PE or admin
        if (this.currentUser && (this.currentUser.role === 'pe' || this.currentUser.role === 'administrator')) {
            const peSection = document.getElementById('pe-section');
            if (peSection) {
                peSection.style.display = 'block';
                // Re-attach event listeners for PE buttons in case they weren't found initially
                this.attachPEButtonListeners();
            }
        }
        
        // Show admin button if user is administrator
        if (this.currentUser && this.currentUser.role === 'administrator') {
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) adminBtn.style.display = 'inline-block';
        }
    }
    
    showLoginSection() {
        const loginSection = document.getElementById('login-section');
        const mainSections = document.getElementById('main-sections');
        const userInfo = document.getElementById('user-info');
        
        if (loginSection) loginSection.style.display = 'block';
        if (mainSections) mainSections.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
    
    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('session_token');
        this.showLoginSection();
        this.clearLoginForm();
        this.showNotification('Logged out successfully', 'info');
    }
    
    async loadDashboardStats() {
        console.log('📊 loadDashboardStats() called');
        try {
            // Check if we're on the main dashboard page
            const rawFilesCount = document.getElementById('raw-files-count');
            if (!rawFilesCount) {
                console.log('⚠️ Not on main dashboard page, skipping stats load');
                return;
            }
            
            // Load raw files stats with timeout
            const rawFilesController = new AbortController();
            const rawFilesTimeout = setTimeout(() => {
                console.error('⏱️ Raw files stats request timed out');
                rawFilesController.abort();
            }, 5000);
            
            try {
                const rawFilesResponse = await fetch('/api/dashboard/raw-files-stats', {
                    headers: this.getAuthHeaders(),
                    signal: rawFilesController.signal
                });
                clearTimeout(rawFilesTimeout);
                const rawFilesStats = await rawFilesResponse.json();
                
                if (rawFilesStats.status === 'success') {
                    const rawFilesSize = document.getElementById('raw-files-size');
                    const rawFilesRecent = document.getElementById('raw-files-recent');
                    
                    if (rawFilesCount) {
                        rawFilesCount.textContent = rawFilesStats.total_files;
                        // Make clickable
                        rawFilesCount.style.cursor = 'pointer';
                        rawFilesCount.title = 'Click to view all raw files';
                        rawFilesCount.addEventListener('click', () => {
                            this.showRawFilesListModal();
                        });
                        // Also make parent stat-card clickable
                        const rawFilesCard = rawFilesCount.closest('.stat-card');
                        if (rawFilesCard) {
                            rawFilesCard.style.cursor = 'pointer';
                            rawFilesCard.addEventListener('click', () => {
                                this.showRawFilesListModal();
                            });
                        }
                    }
                    if (rawFilesSize) {
                        rawFilesSize.textContent = rawFilesStats.total_size;
                        // Make clickable
                        rawFilesSize.style.cursor = 'pointer';
                        rawFilesSize.title = 'Click to view storage breakdown';
                        rawFilesSize.addEventListener('click', () => {
                            this.showStorageBreakdown();
                        });
                        // Also make parent stat-card clickable
                        const sizeCard = rawFilesSize.closest('.stat-card');
                        if (sizeCard) {
                            sizeCard.style.cursor = 'pointer';
                            sizeCard.addEventListener('click', () => {
                                this.showStorageBreakdown();
                            });
                        }
                    }
                    if (rawFilesRecent) {
                        rawFilesRecent.textContent = rawFilesStats.recent_uploads;
                        // Make clickable
                        rawFilesRecent.style.cursor = 'pointer';
                        rawFilesRecent.title = 'Click to view recent uploads';
                        rawFilesRecent.addEventListener('click', () => {
                            this.showRecentUploads();
                        });
                        // Also make parent stat-card clickable
                        const recentCard = rawFilesRecent.closest('.stat-card');
                        if (recentCard) {
                            recentCard.style.cursor = 'pointer';
                            recentCard.addEventListener('click', () => {
                                this.showRecentUploads();
                            });
                        }
                    }
                }
            } catch (error) {
                clearTimeout(rawFilesTimeout);
                console.error('❌ Error loading raw files stats:', error);
            }
            
            // Load clipping stats with timeout
            const clippingController = new AbortController();
            const clippingTimeout = setTimeout(() => {
                // Suppress timeout error - stats are non-critical
                clippingController.abort();
            }, 5000);
            
            try {
                const clippingResponse = await fetch('/api/dashboard/clipping-stats', {
                    headers: this.getAuthHeaders(),
                    signal: clippingController.signal
                });
                clearTimeout(clippingTimeout);
                const clippingStats = await clippingResponse.json();
                
                if (clippingStats.status === 'success') {
                    const clippedFilesCount = document.getElementById('clipped-files-count');
                    const modificationsCount = document.getElementById('modifications-count');
                    const integrityStatus = document.getElementById('integrity-status');
                    
                    if (clippedFilesCount) {
                        clippedFilesCount.textContent = clippingStats.clipped_files || 0;
                        // Make clickable
                        clippedFilesCount.style.cursor = 'pointer';
                        clippedFilesCount.title = 'Click to view clipped files list';
                        clippedFilesCount.addEventListener('click', () => {
                            this.showClippedFilesList();
                        });
                        // Also make parent stat-card clickable
                        const clippedCard = clippedFilesCount.closest('.stat-card');
                        if (clippedCard) {
                            clippedCard.style.cursor = 'pointer';
                            clippedCard.addEventListener('click', () => {
                                this.showClippedFilesList();
                            });
                        }
                    }
                    if (modificationsCount) {
                        modificationsCount.textContent = clippingStats.modifications || 0;
                        // Make clickable
                        modificationsCount.style.cursor = 'pointer';
                        modificationsCount.title = 'Click to view modifications history';
                        modificationsCount.addEventListener('click', () => {
                            this.showModificationsHistory();
                        });
                        // Also make parent stat-card clickable
                        const modificationsCard = modificationsCount.closest('.stat-card');
                        if (modificationsCard) {
                            modificationsCard.style.cursor = 'pointer';
                            modificationsCard.addEventListener('click', () => {
                                this.showModificationsHistory();
                            });
                        }
                    }
                    if (integrityStatus) {
                        integrityStatus.textContent = clippingStats.integrity_status || '100%';
                        // Make clickable
                        integrityStatus.style.cursor = 'pointer';
                        integrityStatus.title = 'Click to view detailed integrity status';
                        integrityStatus.addEventListener('click', () => {
                            this.showIntegrityStatusDetails();
                        });
                        // Also make parent stat-card clickable
                        const integrityCard = integrityStatus.closest('.stat-card');
                        if (integrityCard) {
                            integrityCard.style.cursor = 'pointer';
                            integrityCard.addEventListener('click', () => {
                                this.showIntegrityStatusDetails();
                            });
                        }
                    }
                }
            } catch (error) {
                clearTimeout(clippingTimeout);
                // Suppress timeout errors - stats are non-critical
                if (error.name !== 'AbortError') {
                    console.debug('Error loading clipping stats (non-critical):', error);
                }
            }
            
            // Load project stats with timeout
            const projectController = new AbortController();
            const projectTimeout = setTimeout(() => {
                // Suppress timeout error - stats are non-critical
                projectController.abort();
            }, 5000);
            
            try {
                const projectResponse = await fetch('/api/dashboard/project-stats', {
                    headers: this.getAuthHeaders(),
                    signal: projectController.signal
                });
                clearTimeout(projectTimeout);
                const projectStats = await projectResponse.json();
                
                if (projectStats.status === 'success') {
                    const activeProjectsCount = document.getElementById('active-projects-count');
                    const completedProjectsCount = document.getElementById('completed-projects-count');
                    const projectFilesCount = document.getElementById('project-files-count');
                    
                    if (activeProjectsCount) activeProjectsCount.textContent = projectStats.active_projects;
                    if (completedProjectsCount) completedProjectsCount.textContent = projectStats.completed_projects;
                    if (projectFilesCount) projectFilesCount.textContent = projectStats.project_files;
                }
            } catch (error) {
                clearTimeout(projectTimeout);
                // Suppress timeout errors - stats are non-critical
                if (error.name !== 'AbortError') {
                    console.debug('Error loading project stats (non-critical):', error);
                }
            }
            
            // Load PE stats if applicable with timeout
            if (this.currentUser && (this.currentUser.role === 'pe' || this.currentUser.role === 'administrator')) {
                const peController = new AbortController();
                const peTimeout = setTimeout(() => {
                    // Suppress timeout error - stats are non-critical
                    peController.abort();
                }, 5000);
                
                try {
                    const peResponse = await fetch('/api/dashboard/pe-stats', {
                        headers: this.getAuthHeaders(),
                        signal: peController.signal
                    });
                    clearTimeout(peTimeout);
                    
                    if (!peResponse.ok) {
                        throw new Error(`HTTP error! status: ${peResponse.status}`);
                    }
                    
                    const peStats = await peResponse.json();
                    
                    if (peStats.status === 'success') {
                        const registeredPeCount = document.getElementById('registered-pe-count');
                        const activePeCount = document.getElementById('active-pe-count');
                        const peOversightLevel = document.getElementById('pe-oversight-level');
                        
                        if (registeredPeCount) {
                            registeredPeCount.textContent = peStats.registered_pes || 0;
                            // Make clickable
                            registeredPeCount.style.cursor = 'pointer';
                            registeredPeCount.title = 'Click to view registered PEs';
                            registeredPeCount.addEventListener('click', () => {
                                window.location.href = '/pe-dashboard#registered';
                            });
                            // Also make parent stat-card clickable
                            const registeredCard = registeredPeCount.closest('.stat-card');
                            if (registeredCard) {
                                registeredCard.style.cursor = 'pointer';
                                registeredCard.addEventListener('click', () => {
                                    window.location.href = '/pe-dashboard#registered';
                                });
                            }
                        }
                        if (activePeCount) {
                            activePeCount.textContent = peStats.active_pes || 0;
                            // Make clickable
                            activePeCount.style.cursor = 'pointer';
                            activePeCount.title = 'Click to view active PEs';
                            activePeCount.addEventListener('click', () => {
                                window.location.href = '/pe-dashboard#active';
                            });
                            // Also make parent stat-card clickable
                            const activeCard = activePeCount.closest('.stat-card');
                            if (activeCard) {
                                activeCard.style.cursor = 'pointer';
                                activeCard.addEventListener('click', () => {
                                    window.location.href = '/pe-dashboard#active';
                                });
                            }
                        }
                        if (peOversightLevel) {
                            peOversightLevel.textContent = peStats.oversight_level || '0%';
                            // Make clickable
                            peOversightLevel.style.cursor = 'pointer';
                            peOversightLevel.title = 'Click to view oversight details';
                            peOversightLevel.addEventListener('click', () => {
                                window.location.href = '/pe-dashboard#oversight';
                            });
                            // Also make parent stat-card clickable
                            const oversightCard = peOversightLevel.closest('.stat-card');
                            if (oversightCard) {
                                oversightCard.style.cursor = 'pointer';
                                oversightCard.addEventListener('click', () => {
                                    window.location.href = '/pe-dashboard#oversight';
                                });
                            }
                        }
                    } else {
                        console.warn('PE stats API returned error:', peStats.error);
                    }
                } catch (error) {
                    clearTimeout(peTimeout);
                    // Suppress timeout errors - stats are non-critical
                    if (error.name !== 'AbortError') {
                        console.debug('Error loading PE stats (non-critical):', error);
                    }
                    // Don't show error notification as this is not critical
                }
            }
        } catch (error) {
            console.error('❌ Error in loadDashboardStats:', error);
            // Don't show error notification - stats are optional
        } finally {
            console.log('✅ loadDashboardStats() completed');
        }
    }
    
    // Navigation methods
    async showUploadInterface() {
        this.showNotification('Opening file upload interface...', 'info');
        
        try {
            // Create a file upload modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                            <h2 style="margin: 0;">📤 Upload Raw Data Files</h2>
                        </div>
                        <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="upload-section">
                            <form id="upload-form" enctype="multipart/form-data">
                                <div class="form-group">
                                    <label for="file-input">Select CSV files to upload:</label>
                                    <input type="file" id="file-input" name="file" multiple accept=".csv,.xlsx,.xls" required>
                                    <small style="color: #666; display: block; margin-top: 5px;">
                                        Supported formats: CSV, Excel (.xlsx, .xls). You can select multiple files.
                                    </small>
                                </div>
                                <div class="form-group">
                                    <label for="upload-description">Description (optional):</label>
                                    <textarea id="upload-description" name="description" rows="2" placeholder="Describe the data being uploaded"></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Cancel</button>
                                    <button type="submit" class="btn-primary">Upload Files</button>
                                </div>
                            </form>
                        </div>
                        <div id="upload-progress" style="display: none; margin-top: 20px;">
                            <div style="background: #f0f0f0; border-radius: 5px; padding: 10px;">
                                <div id="progress-bar" style="background: #007bff; height: 20px; border-radius: 3px; width: 0%; transition: width 0.3s;"></div>
                            </div>
                            <p id="progress-text" style="margin: 10px 0 0 0; text-align: center;">Uploading...</p>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.classList.add('modal-open');
            
            // Handle form submission
            document.getElementById('upload-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Show progress
                document.getElementById('upload-progress').style.display = 'block';
                document.getElementById('progress-bar').style.width = '10%';
                document.getElementById('progress-text').textContent = 'Preparing upload...';
                
                try {
                    // Add user ID to form data (you might want to get this from session)
                    formData.append('uploaded_by', 'current_user');
                    
                    const response = await fetch('/api/raw-meter-data/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    document.getElementById('progress-bar').style.width = '50%';
                    document.getElementById('progress-text').textContent = 'Processing files...';
                    
                    const result = await response.json();
                    
                    document.getElementById('progress-bar').style.width = '100%';
                    
                    if (response.ok) {
                        const uploadedCount = result.uploaded_count || 1;
                        document.getElementById('progress-text').textContent = `Upload successful! ${uploadedCount} file(s) uploaded.`;
                        this.showNotification(`${uploadedCount} file(s) uploaded successfully!`, 'success');
                        setTimeout(() => {
                            modal.remove();
                            document.body.classList.remove('modal-open');
                        }, 1500);
                    } else {
                        document.getElementById('progress-text').textContent = 'Upload failed: ' + result.error;
                        this.showNotification('Upload failed: ' + result.error, 'error');
                    }
                } catch (error) {
                    document.getElementById('progress-text').textContent = 'Upload failed: ' + error.message;
                    this.showNotification('Upload failed: ' + error.message, 'error');
                }
            });
            
        } catch (error) {
            this.showNotification('Error opening upload interface: ' + error.message, 'error');
        }
    }
    
    async showUploadInterfaceOld() {
        this.showNotification('Loading CSV files with fingerprints...', 'info');
        
        try {
            // Get files that have fingerprints (processed files)
            const response = await fetch('/api/csv/fingerprints');
            const data = await response.json();
            
            if (data.status === 'success' && data.fingerprints && data.fingerprints.length > 0) {
                // Convert fingerprint data to file format expected by modal
                const processedFiles = data.fingerprints.map(file => ({
                    id: file.id,
                    file_name: file.file_name,
                    file_size: file.file_size,
                    fingerprint: file.fingerprint,
                    created_at: file.created_at,
                    type: file.type,
                    status: 'Ready for Analysis',
                    processed: true,
                    has_fingerprint: true
                }));
                
                this.showFileSelectionModal(processedFiles);
            } else {
                this.showNotification('No CSV files with fingerprints found. Please upload and process files first.', 'warning');
                // Fallback to upload interface if no files exist
                setTimeout(() => {
                    window.location.href = '/upload-interface';
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading files with fingerprints:', error);
            this.showNotification('Error loading files. Redirecting to upload interface...', 'error');
            setTimeout(() => {
                window.location.href = '/upload-interface';
            }, 2000);
        }
    }
    
    async showFileSelectionModal(fileType = null) {
        // If called with fileType, load files with fingerprints for form selection
        if (fileType) {
            try {
                this.showNotification('Loading CSV files...', 'info');
                
                // Use the faster original files endpoint with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch('/api/original-files', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                const data = await response.json();
                
                if (data.status === 'success' && data.files && data.files.length > 0) {
                    // Filter for files that have fingerprints (processed files)
                    const processedFiles = data.files.filter(file => file.fingerprint && file.fingerprint.trim() !== '');
                    
                    if (processedFiles.length > 0) {
                        // Mark as having fingerprints
                        processedFiles.forEach(file => {
                            file.has_fingerprint = true;
                            file.status = 'Ready for Analysis';
                            file.processed = true;
                        });
                        
                        this.showFileSelectionModalWithFiles(processedFiles, fileType);
                    } else {
                        this.showNotification('No CSV files with fingerprints found. Please upload and process files first.', 'warning');
                    }
                } else {
                    this.showNotification('No CSV files found. Please upload files first.', 'warning');
                }
            } catch (error) {
                console.error('Error loading files:', error);
                if (error.name === 'AbortError') {
                    this.showNotification('Request timed out. Please try again.', 'error');
                } else {
                    this.showNotification('Error loading files. Please try again.', 'error');
                }
            }
            return;
        }
        
        // Original method for navigation
        this.showFileSelectionModalWithFiles(files);
    }
    
    showFileSelectionModalWithFiles(files, fileType = null) {
        // Create modal HTML
        const modalHtml = `
            <div id="file-selection-modal" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            ">
                <div class="modal-content" style="
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #343a40;">Select ${fileType ? (fileType === 'before' ? 'Before' : 'After') : 'Processed'} CSV File</h2>
                        <button onclick="if(typeof closeAllModals==='function'){closeAllModals();}else{this.closest('.modal-overlay')?.remove();}" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #6c757d;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">×</button>
                    </div>
                    
                    <p style="color: #6c757d; margin-bottom: 20px;">
                        ${fileType ? 
                            `Choose a CSV file with fingerprints for the ${fileType === 'before' ? 'baseline (before)' : 'post-retrofit (after)'} data:` :
                            'Choose a CSV file that has been processed with ranges set:'
                        }
                    </p>
                    
                    <div class="files-list" style="
                        display: grid;
                        gap: 15px;
                        max-height: 400px;
                        overflow-y: auto;
                    ">
                        ${files.map(file => `
                            <div class="file-item" onclick="${fileType ? `selectFileForForm(${file.id}, '${file.file_name}', '${fileType}')` : `selectFile(${file.id}, '${file.file_name}')`}" style="
                                border: 2px solid #e9ecef;
                                border-radius: 8px;
                                padding: 15px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                background: #f8f9fa;
                            " onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#e3f2fd';" 
                               onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='#f8f9fa';">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #343a40; margin-bottom: 5px;">
                                            ${file.file_name}
                                        </div>
                                        <div style="color: #6c757d; font-size: 0.9em;">
                                            Size: ${this.formatFileSize(file.file_size)} | 
                                            Uploaded: ${new Date(file.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style="
                                        background: ${file.has_fingerprint ? '#28a745' : '#17a2b8'};
                                        color: white;
                                        padding: 4px 8px;
                                        border-radius: 4px;
                                        font-size: 0.8em;
                                        font-weight: 600;
                                        margin-left: 10px;
                                    ">
                                        ${file.has_fingerprint ? '✓ Has Fingerprint' : '✓ Range Set'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="if(typeof closeAllModals==='function'){closeAllModals();}else{this.closest('.modal-overlay')?.remove();}" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">Cancel</button>
                        <button onclick="window.location.href='/upload-interface'" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Upload New File</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        // Remove any existing modals first (prevents black boxes)
        if (typeof closeAllModals === 'function') {
            closeAllModals();
        } else {
            // Fallback cleanup
            const existingModals = document.querySelectorAll('.modal-overlay, #file-selection-modal');
            existingModals.forEach(m => m.remove());
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add global function for file selection
        window.selectFile = (fileId, fileName) => {
            // Store the selected file information for the legacy interface
            sessionStorage.setItem('selectedFileId', fileId);
            sessionStorage.setItem('selectedFileName', fileName);
            
            this.showNotification(`Selected: ${fileName}`, 'success');
            // Close modal using cleanup function
            if (typeof closeAllModals === 'function') {
                closeAllModals();
            } else {
                const modal = document.getElementById('file-selection-modal');
                if (modal) modal.remove();
            }
            
            // Show a dialog to let user choose if this is "before" or "after" file
            this.showFileTypeSelectionDialog(fileId, fileName);
        };
        
        // Show dialog to select if this is a "before" or "after" file
        this.showFileTypeSelectionDialog = function(fileId, fileName) {
            const dialogHtml = `
                <div id="file-type-dialog" class="modal-overlay" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1001;
                ">
                    <div class="modal-content" style="
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 500px;
                        width: 90%;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    ">
                        <h3 style="margin: 0 0 20px 0; color: #343a40;">File Selection</h3>
                        <p style="color: #6c757d; margin-bottom: 30px;">
                            You selected: <strong>${fileName}</strong><br>
                            Is this your "Before" file (baseline) or "After" file (post-retrofit)?
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                            <button onclick="selectFileType('before', ${fileId}, '${fileName}')" style="
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            "> Before File (Baseline)</button>
                            <button onclick="selectFileType('after', ${fileId}, '${fileName}')" style="
                                background: #007bff;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            "> After File (Post-Retrofit)</button>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="if(typeof closeAllModals==='function'){closeAllModals();}else{this.closest('.modal-overlay')?.remove();}" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', dialogHtml);
        };
        
        // Handle file type selection (before or after)
        window.selectFileType = (fileType, fileId, fileName) => {
            // Store the file selection based on type
            if (fileType === 'before') {
                sessionStorage.setItem('selectedBeforeFileId', fileId);
                sessionStorage.setItem('selectedBeforeFileName', fileName);
                this.showNotification(`Before file selected: ${fileName}`, 'success');
            } else {
                sessionStorage.setItem('selectedAfterFileId', fileId);
                sessionStorage.setItem('selectedAfterFileName', fileName);
                this.showNotification(`After file selected: ${fileName}`, 'success');
            }
            
            // Close dialog
            document.getElementById('file-type-dialog').remove();
            
            // Check if both files are now selected
            const beforeFileId = sessionStorage.getItem('selectedBeforeFileId');
            const afterFileId = sessionStorage.getItem('selectedAfterFileId');
            
            if (beforeFileId && afterFileId) {
                // Both files selected, redirect to legacy interface
                this.showNotification('Both files selected! Redirecting to analysis...', 'success');
                setTimeout(() => {
                    window.location.href = '/legacy';
                }, 1500);
            } else {
                // Still need another file, show selection modal again
                setTimeout(() => {
                    this.showUploadInterface();
                }, 1000);
            }
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showRawFilesList() {
        this.showNotification('Redirecting to raw files list...', 'info');
        setTimeout(() => {
            window.location.href = '/raw-files-list';
        }, 1000);
    }
    
    async showRawFilesListModal() {
        this.showNotification('Loading raw files list...', 'info');
        
        try {
            const response = await fetch('/api/dashboard/raw-files-stats', {
                headers: this.getAuthHeaders()
            });
            const stats = await response.json();
            
            // Get list of raw files
            const filesResponse = await fetch('/api/original-files', {
                headers: this.getAuthHeaders()
            });
            const filesData = await filesResponse.json();
            
            const files = filesData.files || filesData || [];
            
            this.displayRawFilesListModal(files, stats.total_files || 0);
        } catch (error) {
            this.showNotification('Error loading raw files: ' + error.message, 'error');
        }
    }
    
    displayRawFilesListModal(files, totalCount) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;">Raw Files List</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;"> Summary</h3>
                        <div style="font-size: 1.2em; font-weight: bold; color: #1976d2;">Total Raw Files: ${totalCount}</div>
                    </div>
                    ${files.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <thead style="background: #343a40; color: white;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left;">File Name</th>
                                        <th style="padding: 12px; text-align: left;">Size</th>
                                        <th style="padding: 12px; text-align: left;">Uploaded</th>
                                        <th style="padding: 12px; text-align: left;">Status</th>
                                        <th style="padding: 12px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${files.slice(0, 50).map(file => `
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 12px;">
                                                <div style="font-weight: 600; color: #495057;">${file.file_name || file.name || 'Unknown'}</div>
                                            </td>
                                            <td style="padding: 12px; color: #6c757d;">${this.formatFileSize(file.file_size || file.size || 0)}</td>
                                            <td style="padding: 12px; color: #6c757d; font-size: 0.9em;">${new Date(file.created_at || file.upload_date || Date.now()).toLocaleDateString()}</td>
                                            <td style="padding: 12px;">
                                                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #e8f5e8; color: #2e7d32;">
                                                    ${file.fingerprint ? ' Verified' : ' Pending'}
                                                </span>
                                            </td>
                                            <td style="padding: 12px;">
                                                <button onclick="window.location.href='/raw-files-list'" 
                                                        style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ${files.length > 50 ? `<div style="margin-top: 15px; text-align: center; color: #6c757d;">Showing first 50 of ${files.length} files. <a href="/raw-files-list" style="color: #007bff;">View all files</a></div>` : ''}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;"></div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Raw Files</h3>
                            <p style="color: #6c757d;">No raw files have been uploaded yet. Use "Upload Raw Data" to add files.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                    <button class="btn btn-secondary" onclick="window.location.href='/raw-files-list'" style="margin-left: 10px;">View Full List</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    async showStorageBreakdown() {
        this.showNotification('Loading storage breakdown...', 'info');
        
        try {
            const response = await fetch('/api/dashboard/raw-files-stats', {
                headers: this.getAuthHeaders()
            });
            const stats = await response.json();
            
            // Get files for size breakdown
            const filesResponse = await fetch('/api/original-files', {
                headers: this.getAuthHeaders()
            });
            const filesData = await filesResponse.json();
            const files = filesData.files || filesData || [];
            
            // Calculate size breakdown
            const totalBytes = files.reduce((sum, file) => sum + (file.file_size || file.size || 0), 0);
            const averageSize = files.length > 0 ? totalBytes / files.length : 0;
            const largestFile = files.length > 0 ? files.reduce((largest, file) => 
                (file.file_size || file.size || 0) > (largest.file_size || largest.size || 0) ? file : largest
            , files[0]) : null;
            
            this.displayStorageBreakdown(stats, totalBytes, averageSize, largestFile, files.length);
        } catch (error) {
            this.showNotification('Error loading storage breakdown: ' + error.message, 'error');
        }
    }
    
    displayStorageBreakdown(stats, totalBytes, averageSize, largestFile, fileCount) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> Storage Breakdown</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;"> Storage Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #1976d2;">${stats.total_size || this.formatFileSize(totalBytes)}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Storage</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #2e7d32;">${fileCount}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Files</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #f57c00;">${this.formatFileSize(averageSize)}</div>
                                <div style="color: #666; font-size: 0.9em;">Average File Size</div>
                            </div>
                        </div>
                    </div>
                    
                    ${largestFile ? `
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: #f57c00;">📦 Largest File</h4>
                            <div style="color: #495057;">
                                <p style="margin: 5px 0;"><strong>File:</strong> ${largestFile.file_name || largestFile.name || 'Unknown'}</p>
                                <p style="margin: 5px 0;"><strong>Size:</strong> ${this.formatFileSize(largestFile.file_size || largestFile.size || 0)}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="margin: 0 0 15px 0;"> Storage Information</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #495057;">
                            <li style="margin-bottom: 8px;">All raw files are stored securely with cryptographic fingerprinting</li>
                            <li style="margin-bottom: 8px;">Files are automatically verified for integrity upon upload</li>
                            <li style="margin-bottom: 8px;">Storage usage is tracked for audit and compliance purposes</li>
                            <li style="margin-bottom: 8px;">Files can be managed through the Raw Files List interface</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                    <button class="btn btn-secondary" onclick="window.location.href='/raw-files-list'" style="margin-left: 10px;">Manage Files</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    async showRecentUploads() {
        this.showNotification('Loading recent uploads...', 'info');
        
        try {
            const response = await fetch('/api/dashboard/raw-files-stats', {
                headers: this.getAuthHeaders()
            });
            const stats = await response.json();
            
            // Get list of raw files
            const filesResponse = await fetch('/api/original-files', {
                headers: this.getAuthHeaders()
            });
            const filesData = await filesResponse.json();
            const files = filesData.files || filesData || [];
            
            // Filter for recent uploads (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentFiles = files
                .filter(file => {
                    const uploadDate = new Date(file.created_at || file.upload_date || 0);
                    return uploadDate >= sevenDaysAgo;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.created_at || a.upload_date || 0);
                    const dateB = new Date(b.created_at || b.upload_date || 0);
                    return dateB - dateA; // Most recent first
                })
                .slice(0, 20); // Show top 20 most recent
            
            this.displayRecentUploads(recentFiles, stats.recent_uploads || 0);
        } catch (error) {
            this.showNotification('Error loading recent uploads: ' + error.message, 'error');
        }
    }
    
    displayRecentUploads(files, totalRecent) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;">🕒 Recent Uploads (Last 7 Days)</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #2e7d32;"> Summary</h3>
                        <div style="font-size: 1.2em; font-weight: bold; color: #2e7d32;">Total Recent Uploads: ${totalRecent}</div>
                    </div>
                    ${files.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <thead style="background: #343a40; color: white;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left;">File Name</th>
                                        <th style="padding: 12px; text-align: left;">Size</th>
                                        <th style="padding: 12px; text-align: left;">Uploaded</th>
                                        <th style="padding: 12px; text-align: left;">Time Ago</th>
                                        <th style="padding: 12px; text-align: left;">Status</th>
                                        <th style="padding: 12px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${files.map(file => {
                                        const uploadDate = new Date(file.created_at || file.upload_date || Date.now());
                                        const timeAgo = this.getTimeAgo(uploadDate);
                                        return `
                                            <tr style="border-bottom: 1px solid #dee2e6;">
                                                <td style="padding: 12px;">
                                                    <div style="font-weight: 600; color: #495057;">${file.file_name || file.name || 'Unknown'}</div>
                                                </td>
                                                <td style="padding: 12px; color: #6c757d;">${this.formatFileSize(file.file_size || file.size || 0)}</td>
                                                <td style="padding: 12px; color: #6c757d; font-size: 0.9em;">${uploadDate.toLocaleString()}</td>
                                                <td style="padding: 12px; color: #6c757d; font-size: 0.9em;">${timeAgo}</td>
                                                <td style="padding: 12px;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #e8f5e8; color: #2e7d32;">
                                                        ${file.fingerprint ? ' Verified' : ' Pending'}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px;">
                                                    <button onclick="window.location.href='/raw-files-list'" 
                                                            style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;">🕒</div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Recent Uploads</h3>
                            <p style="color: #6c757d;">No files have been uploaded in the last 7 days.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                    <button class="btn btn-secondary" onclick="window.location.href='/raw-files-list'" style="margin-left: 10px;">View All Files</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }
    
    async showRawDataStatistics() {
        this.showNotification('Loading raw data statistics...', 'info');
        
        try {
            const response = await fetch('/api/dashboard/raw-files-stats');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displayRawDataStatistics(data);
            } else {
                this.showNotification('Error loading statistics: ' + data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error loading statistics: ' + error.message, 'error');
        }
    }
    
    displayRawDataStatistics(data) {
        // Parse the total size from the API response (format: "2.5 MB")
        const totalSizeText = data.total_size || "0 MB";
        const totalSizeMatch = totalSizeText.match(/(\d+\.?\d*)\s*MB/);
        const totalSizeMB = totalSizeMatch ? parseFloat(totalSizeMatch[1]) : 0;
        const totalSizeBytes = totalSizeMB * 1024 * 1024;
        
        // Calculate average size
        const totalFiles = data.total_files || 0;
        const averageSizeBytes = totalFiles > 0 ? totalSizeBytes / totalFiles : 0;
        
        // Create a modal to display the statistics
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> Raw Meter Data Statistics</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="stat-card" style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #1976d2;">Total Files</h3>
                            <div style="font-size: 2em; font-weight: bold; color: #1976d2;">${totalFiles}</div>
                        </div>
                        <div class="stat-card" style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #388e3c;">Total Size</h3>
                            <div style="font-size: 2em; font-weight: bold; color: #388e3c;">${totalSizeText}</div>
                        </div>
                        <div class="stat-card" style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #f57c00;">Average Size</h3>
                            <div style="font-size: 2em; font-weight: bold; color: #f57c00;">${this.formatFileSize(averageSizeBytes)}</div>
                        </div>
                        <div class="stat-card" style="background: #fce4ec; padding: 20px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #c2185b;">Recent Uploads</h3>
                            <div style="font-size: 2em; font-weight: bold; color: #c2185b;">${data.recent_uploads || 0}</div>
                            <div style="color: #666; font-size: 0.8em; margin-top: 5px;">Last 7 days</div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0;"> Storage Overview</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${totalFiles}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Files</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8;">${totalSizeText}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Storage</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #ffc107;">${data.recent_uploads || 0}</div>
                                <div style="color: #666; font-size: 0.9em;">Recent Uploads</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #e1f5fe; padding: 20px; border-radius: 8px;">
                        <h3 style="margin: 0 0 15px 0;">📅 Activity Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #0277bd;">${data.recent_uploads || 0}</div>
                                <div style="color: #666; font-size: 0.9em;">Uploaded This Week</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #6f42c1;">${totalFiles - (data.recent_uploads || 0)}</div>
                                <div style="color: #666; font-size: 0.9em;">Older Files</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #20c997;">${totalFiles > 0 ? '100%' : '0%'}</div>
                                <div style="color: #666; font-size: 0.9em;">Data Coverage</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="flex-shrink: 0; padding: 20px; border-top: 1px solid #dee2e6; background: #f8f9fa;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showClippingInterface() {
        this.showNotification('Redirecting to clipping interface...', 'info');
        setTimeout(() => {
            window.location.href = '/clipping-interface';
        }, 1000);
    }
    
    async showFingerprintsViewer() {
        this.showNotification('Loading fingerprints viewer...', 'info');
        
        try {
            const response = await fetch('/api/csv/fingerprints');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displayFingerprintsViewer(data);
            } else {
                this.showNotification('Error loading fingerprints: ' + data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error loading fingerprints: ' + error.message, 'error');
        }
    }
    
    displayFingerprintsViewer(data) {
        const fingerprints = data.fingerprints || [];
        const totalCount = data.total_count || 0;

        // Create a modal to display the fingerprints
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> CSV File Fingerprints</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;"> Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${totalCount}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Files</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #388e3c;">${fingerprints.filter(f => f.type === 'raw_meter_data').length}</div>
                                <div style="color: #666; font-size: 0.9em;">Raw Meter Files</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${fingerprints.filter(f => f.type === 'project_file').length}</div>
                                <div style="color: #666; font-size: 0.9em;">Project Files</div>
                            </div>
                        </div>
                    </div>
                    
                    ${fingerprints.length > 0 ? `
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <h3 style="margin: 0 0 15px 0;"> File Integrity Fingerprints</h3>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <thead style="background: #343a40; color: white;">
                                        <tr>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">File Name</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Type</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Size</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Fingerprint</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Created</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${fingerprints.map(fp => `
                                            <tr style="border-bottom: 1px solid #dee2e6;">
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="font-weight: 600; color: #495057;">${fp.file_name}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; 
                                                        background: ${fp.type === 'raw_meter_data' ? '#e3f2fd' : '#fff3e0'}; 
                                                        color: ${fp.type === 'raw_meter_data' ? '#1976d2' : '#f57c00'};">
                                                        ${fp.type === 'raw_meter_data' ? 'Raw Data' : 'Project File'}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d;">${this.formatFileSize(fp.file_size || 0)}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="font-family: 'Courier New', monospace; font-size: 0.8em; color: #495057; 
                                                        background: #f8f9fa; padding: 4px 8px; border-radius: 4px; word-break: break-all;">
                                                        ${fp.fingerprint ? fp.fingerprint.substring(0, 32) + '...' : 'No fingerprint'}
                                                    </div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d; font-size: 0.9em;">${new Date(fp.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <button onclick="showFullFingerprint('${fp.id}', '${fp.fingerprint}', '${fp.file_name}')" 
                                                            style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                        View Full
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;"></div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Fingerprints Found</h3>
                            <p style="color: #6c757d;">No CSV files with fingerprints are currently available.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add the showFullFingerprint function to the global scope
        window.showFullFingerprint = (id, fingerprint, fileName) => {

            const fullModal = document.createElement('div');
            fullModal.className = 'modal';
            fullModal.style.display = 'block';
            fullModal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2> Full Fingerprint: ${fileName}</h2>
                        <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0;">File Information</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <strong>File ID:</strong> ${id}
                                </div>
                                <div>
                                    <strong>File Name:</strong> ${fileName}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                            <h3 style="margin: 0 0 15px 0;"> Cryptographic Fingerprint</h3>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                                <div style="font-family: 'Courier New', monospace; font-size: 0.9em; color: #495057; word-break: break-all; line-height: 1.4;">
                                    ${fingerprint || 'No fingerprint available'}
                                </div>
                            </div>
                            <div style="margin-top: 15px; padding: 10px; background: #e1f5fe; border-radius: 6px; border-left: 4px solid #0277bd;">
                                <strong>ℹ️ About Fingerprints:</strong> This cryptographic hash ensures file integrity and prevents tampering. 
                                Any modification to the file will result in a different fingerprint.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${fingerprint}'); this.textContent='Copied!'">Copy Fingerprint</button>
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(fullModal);
            
            // Close modal when clicking outside
            fullModal.addEventListener('click', (e) => {
                if (e.target === fullModal) {
                    fullModal.remove();
                }
            });
        };
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    async showIntegrityVerification() {
        this.showNotification('Starting integrity verification...', 'info');
        
        // First, get the list of files to show them in "Unverified" state
        try {
            const filesResponse = await fetch('/api/csv/integrity/verify-all');
            const filesData = await filesResponse.json();
            
            if (filesData.status === 'success') {
                // Show the report with all files in "Unverified" status initially
                this.displayIntegrityVerificationWithUnverifiedStatus(filesData);
                
                // Now start the actual verification process
                await this.performIntegrityVerification();
            } else {
                this.showNotification('Error loading files: ' + filesData.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error loading files: ' + error.message, 'error');
        }
    }
    
    async performIntegrityVerification() {
        // Show loading modal with "Verifying..." status for all files
        this.showVerificationLoadingModal();
        
        try {
            const response = await fetch('/api/csv/integrity/verify-all');
            const data = await response.json();
            
            // Remove loading modal
            this.removeVerificationLoadingModal();
            
            if (data.status === 'success') {
                this.showNotification('Integrity verification completed!', 'success');
                // Update the existing modal with final results
                this.updateIntegrityVerificationResults(data);
            } else {
                this.showNotification('Error verifying integrity: ' + data.error, 'error');
            }
        } catch (error) {
            // Remove loading modal on error
            this.removeVerificationLoadingModal();
            this.showNotification('Error verifying integrity: ' + error.message, 'error');
        }
    }
    
    displayIntegrityVerificationWithUnverifiedStatus(data) {
        const files = data.files || [];
        const totalCount = data.total_count || 0;
        
        // Override all files to show "unverified" status initially
        const unverifiedFiles = files.map(file => ({
            ...file,
            integrity_status: 'unverified'
        }));
        
        // Create initial status counts with all files as "unverified"
        const statusCounts = {
            unverified: totalCount,
            verified: 0,
            tampered: 0,
            file_missing: 0,
            no_fingerprint: 0,
            read_error: 0
        };
        
        // Create a modal to display the integrity verification results
        const modal = document.createElement('div');
        modal.id = 'integrity-verification-modal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1400px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> CSV Integrity Verification Report</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #fff3e0; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #f57c00;"> Verification Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${statusCounts.unverified}</div>
                                <div style="color: #666; font-size: 0.9em;"> Unverified</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #2e7d32;">${statusCounts.verified}</div>
                                <div style="color: #666; font-size: 0.9em;"> Verified</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #d32f2f;">${statusCounts.tampered}</div>
                                <div style="color: #666; font-size: 0.9em;"> Tampered</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${statusCounts.file_missing}</div>
                                <div style="color: #666; font-size: 0.9em;"> Missing</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #9c27b0;">${statusCounts.no_fingerprint}</div>
                                <div style="color: #666; font-size: 0.9em;"> No Fingerprint</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #607d8b;">${statusCounts.read_error}</div>
                                <div style="color: #666; font-size: 0.9em;"> Read Error</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${totalCount}</div>
                                <div style="color: #666; font-size: 0.9em;"> Total Files</div>
                            </div>
                        </div>
                    </div>
                    
                    ${unverifiedFiles.length > 0 ? `
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <h3 style="margin: 0 0 15px 0;"> Detailed Integrity Report</h3>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <thead style="background: #343a40; color: white;">
                                        <tr>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">File Name</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Type</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Status</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Size</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Created</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="integrity-files-table-body">
                                        ${unverifiedFiles.map(file => `
                                            <tr style="border-bottom: 1px solid #dee2e6;">
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="font-weight: 600; color: #495057;">${file.file_name}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; 
                                                        background: ${file.type === 'raw_meter_data' ? '#e3f2fd' : '#fff3e0'}; 
                                                        color: ${file.type === 'raw_meter_data' ? '#1976d2' : '#f57c00'};">
                                                        ${file.type === 'raw_meter_data' ? 'Raw Data' : 'Project File'}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #fff3e0; color: #f57c00;"> Unverified</span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d;">${this.formatFileSize(file.file_size || 0)}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d; font-size: 0.9em;">${new Date(file.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <button onclick="showIntegrityDetails('${file.id}', '${file.file_name}', 'unverified', '', '', true)" 
                                                            style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;"></div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Files Found</h3>
                            <p style="color: #6c757d;">No CSV files are available for integrity verification.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add the showIntegrityDetails function to the global scope
        window.showIntegrityDetails = (id, fileName, status, storedFingerprint, currentFingerprint, fileExists) => {
            this.showIntegrityDetailsModal(id, fileName, status, storedFingerprint, currentFingerprint, fileExists);
        };
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    updateIntegrityVerificationResults(data) {
        const files = data.files || [];
        const statusCounts = data.status_counts || {};
        
        // Update the summary section
        const summarySection = document.querySelector('#integrity-verification-modal .modal-body > div:first-child');
        if (summarySection) {
            summarySection.innerHTML = `
                <h3 style="margin: 0 0 10px 0; color: #2e7d32;"> Verification Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #2e7d32;">${statusCounts.verified || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> Verified</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #d32f2f;">${statusCounts.tampered || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> Tampered</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${statusCounts.file_missing || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> Missing</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #9c27b0;">${statusCounts.no_fingerprint || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> No Fingerprint</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #607d8b;">${statusCounts.read_error || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> Read Error</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${data.total_count || 0}</div>
                        <div style="color: #666; font-size: 0.9em;"> Total Files</div>
                    </div>
                </div>
            `;
            summarySection.style.background = '#e8f5e8';
        }
        
        // Update the table body with final results
        const tableBody = document.getElementById('integrity-files-table-body');
        if (tableBody) {
            tableBody.innerHTML = files.map(file => `
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <div style="font-weight: 600; color: #495057;">${file.file_name}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; 
                            background: ${file.type === 'raw_meter_data' ? '#e3f2fd' : '#fff3e0'}; 
                            color: ${file.type === 'raw_meter_data' ? '#1976d2' : '#f57c00'};">
                            ${file.type === 'raw_meter_data' ? 'Raw Data' : 'Project File'}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        ${this.getIntegrityStatusBadge(file.integrity_status)}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <div style="color: #6c757d;">${this.formatFileSize(file.file_size || 0)}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <div style="color: #6c757d; font-size: 0.9em;">${new Date(file.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <button onclick="showIntegrityDetails('${file.id}', '${file.file_name}', '${file.integrity_status}', '${file.stored_fingerprint || ''}', '${file.current_fingerprint || ''}', ${file.file_exists})" 
                                style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                            Details
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Update the modal header to show completion
        const modalHeader = document.querySelector('#integrity-verification-modal .modal-header h2');
        if (modalHeader) {
            modalHeader.textContent = ' CSV Integrity Verification Report';
        }
    }
    
    displayIntegrityVerification(data) {
        const files = data.files || [];
        const totalCount = data.total_count || 0;
        const statusCounts = data.status_counts || {};
        
        // Create a modal to display the integrity verification results
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1400px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2> CSV Integrity Verification Report</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #2e7d32;"> Verification Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #2e7d32;">${statusCounts.verified || 0}</div>
                                <div style="color: #666; font-size: 0.9em;"> Verified</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #d32f2f;">${statusCounts.tampered || 0}</div>
                                <div style="color: #666; font-size: 0.9em;"> Tampered</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${statusCounts.file_missing || 0}</div>
                                <div style="color: #666; font-size: 0.9em;"> Missing</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #9c27b0;">${statusCounts.no_fingerprint || 0}</div>
                                <div style="color: #666; font-size: 0.9em;"> No Fingerprint</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #607d8b;">${statusCounts.read_error || 0}</div>
                                <div style="color: #666; font-size: 0.9em;"> Read Error</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${totalCount}</div>
                                <div style="color: #666; font-size: 0.9em;"> Total Files</div>
                            </div>
                        </div>
                    </div>
                    
                    ${files.length > 0 ? `
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <h3 style="margin: 0 0 15px 0;"> Detailed Integrity Report</h3>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <thead style="background: #343a40; color: white;">
                                        <tr>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">File Name</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Type</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Status</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Size</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Created</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${files.map(file => `
                                            <tr style="border-bottom: 1px solid #dee2e6;">
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="font-weight: 600; color: #495057;">${file.file_name}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; 
                                                        background: ${file.type === 'raw_meter_data' ? '#e3f2fd' : '#fff3e0'}; 
                                                        color: ${file.type === 'raw_meter_data' ? '#1976d2' : '#f57c00'};">
                                                        ${file.type === 'raw_meter_data' ? 'Raw Data' : 'Project File'}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    ${this.getIntegrityStatusBadge(file.integrity_status)}
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d;">${this.formatFileSize(file.file_size || 0)}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <div style="color: #6c757d; font-size: 0.9em;">${new Date(file.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                    <button onclick="showIntegrityDetails('${file.id}', '${file.file_name}', '${file.integrity_status}', '${file.stored_fingerprint || ''}', '${file.current_fingerprint || ''}', ${file.file_exists})" 
                                                            style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;"></div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Files Found</h3>
                            <p style="color: #6c757d;">No CSV files are available for integrity verification.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add the showIntegrityDetails function to the global scope
        window.showIntegrityDetails = (id, fileName, status, storedFingerprint, currentFingerprint, fileExists) => {
            const detailsModal = document.createElement('div');
            detailsModal.className = 'modal';
            detailsModal.style.display = 'block';
            detailsModal.innerHTML = `
                <div class="modal-content" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2> Integrity Details: ${fileName}</h2>
                        <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0;">File Information</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <strong>File ID:</strong> ${id}
                                </div>
                                <div>
                                    <strong>File Name:</strong> ${fileName}
                                </div>
                                <div>
                                    <strong>File Exists:</strong> ${fileExists ? ' Yes' : ' No'}
                                </div>
                                <div>
                                    <strong>Status:</strong> ${this.getIntegrityStatusBadge(status)}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 15px 0;"> Fingerprint Comparison</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div>
                                    <h4 style="color: #1976d2; margin-bottom: 10px;">Stored Fingerprint</h4>
                                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                                        <div style="font-family: 'Courier New', monospace; font-size: 0.8em; color: #495057; word-break: break-all; line-height: 1.4;">
                                            ${storedFingerprint || 'No fingerprint stored'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 style="color: #f57c00; margin-bottom: 10px;">Current Fingerprint</h4>
                                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                                        <div style="font-family: 'Courier New', monospace; font-size: 0.8em; color: #495057; word-break: break-all; line-height: 1.4;">
                                            ${currentFingerprint || 'Could not read file'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top: 15px; padding: 10px; background: ${status === 'verified' ? '#e8f5e8' : status === 'tampered' ? '#ffebee' : '#fff3e0'}; border-radius: 6px; border-left: 4px solid ${status === 'verified' ? '#4caf50' : status === 'tampered' ? '#f44336' : '#ff9800'};">
                                <strong>${status === 'verified' ? ' VERIFIED:' : status === 'tampered' ? ' TAMPERED:' : ' ISSUE:'}</strong> 
                                ${this.getIntegrityStatusMessage(status)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(detailsModal);
            
            // Close modal when clicking outside
            detailsModal.addEventListener('click', (e) => {
                if (e.target === detailsModal) {
                    detailsModal.remove();
                }
            });
        };
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    async showClippedFilesList() {
        this.showNotification('Loading clipped files list...', 'info');
        
        try {
            const response = await fetch('/api/dashboard/clipping-stats', {
                headers: this.getAuthHeaders()
            });
            const stats = await response.json();
            
            // Get list of clipped files - try to get from a custom endpoint or use verified files
            // For now, we'll show a message directing users to the clipping interface
            // In a full implementation, we'd create an endpoint like /api/clipped-files
            const clippedFiles = [];
            
            // Try to get files that might be clipped
            try {
                const filesResponse = await fetch('/api/verified-files', {
                    headers: this.getAuthHeaders()
                });
                const filesData = await filesResponse.json();
                
                // Note: verified-files doesn't include is_clipped, so we'll show all files
                // and indicate that clipped files can be managed in the clipping interface
                if (filesData.files && filesData.files.length > 0) {
                    // For now, we'll show a message that clipped files are managed in the interface
                    this.displayClippedFilesList([], stats.clipped_files || 0, true);
                    return;
                }
            } catch (e) {
                console.warn('Could not fetch files:', e);
            }
            
            this.displayClippedFilesList(clippedFiles, stats.clipped_files || 0);
        } catch (error) {
            this.showNotification('Error loading clipped files: ' + error.message, 'error');
        }
    }
    
    displayClippedFilesList(files, totalCount, showInfoMessage = false) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;">✂️ Clipped Files List</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #1976d2;"> Summary</h3>
                        <div style="font-size: 1.2em; font-weight: bold; color: #1976d2;">Total Clipped Files: ${totalCount}</div>
                    </div>
                    ${files.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <thead style="background: #343a40; color: white;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left;">File Name</th>
                                        <th style="padding: 12px; text-align: left;">Size</th>
                                        <th style="padding: 12px; text-align: left;">Created</th>
                                        <th style="padding: 12px; text-align: left;">Fingerprint</th>
                                        <th style="padding: 12px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${files.map(file => `
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 12px;">
                                                <div style="font-weight: 600; color: #495057;">${file.file_name || file.name || 'Unknown'}</div>
                                            </td>
                                            <td style="padding: 12px; color: #6c757d;">${this.formatFileSize(file.file_size || file.size || 0)}</td>
                                            <td style="padding: 12px; color: #6c757d; font-size: 0.9em;">${new Date(file.created_at || file.upload_date || Date.now()).toLocaleDateString()}</td>
                                            <td style="padding: 12px;">
                                                <code style="font-size: 0.75em; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; color: #495057;">
                                                    ${(file.fingerprint || '').substring(0, 16)}...
                                                </code>
                                            </td>
                                            <td style="padding: 12px;">
                                                <button onclick="window.location.href='/clipping-interface?file=${file.id || file.file_id}'" 
                                                        style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                    View/Edit
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;">✂️</div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">${totalCount > 0 ? 'Clipped Files Available' : 'No Clipped Files'}</h3>
                            <p style="color: #6c757d; margin-bottom: 15px;">
                                ${totalCount > 0 
                                    ? `There are ${totalCount} clipped file(s) in the system. Use the "Start Clipping" button to view and manage all clipped files.`
                                    : 'No files have been clipped yet. Use "Start Clipping" to create clipped files.'}
                            </p>
                            ${showInfoMessage ? `
                                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: left;">
                                    <h4 style="margin: 0 0 10px 0; color: #1976d2;"> About Clipped Files</h4>
                                    <p style="margin: 5px 0; color: #495057; font-size: 0.9em;">
                                        Clipped files are created when you edit CSV files in the Clipping Interface. 
                                        All modifications are tracked with complete audit trail including who, when, why, and what changed.
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                    <button class="btn btn-secondary" onclick="window.location.href='/clipping-interface'" style="margin-left: 10px;">Start Clipping</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    async showModificationsHistory() {
        this.showNotification('Loading modifications history...', 'info');
        
        try {
            // Get all files first to get their custody records
            const filesResponse = await fetch('/api/verified-files', {
                headers: this.getAuthHeaders()
            });
            const filesData = await filesResponse.json();
            
            // Get modifications from database directly
            const modsResponse = await fetch('/api/csv/integrity/summary', {
                headers: this.getAuthHeaders()
            });
            const summaryData = await modsResponse.json();
            
            // Try to get detailed modification history
            let modifications = [];
            if (filesData.files && filesData.files.length > 0) {
                // Get modification history for the first file as an example
                // In a real implementation, we'd want to get all modifications
                try {
                    const modHistoryResponse = await fetch('/api/csv/integrity/modification-history', {
                        method: 'POST',
                        headers: {
                            ...this.getAuthHeaders(),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            custody_record: filesData.files[0] || {}
                        })
                    });
                    const modHistory = await modHistoryResponse.json();
                    if (modHistory.modifications) {
                        modifications = modHistory.modifications;
                    }
                } catch (e) {
                    console.warn('Could not fetch detailed modification history:', e);
                }
            }
            
            // Fallback: Get from database directly via a custom query
            // For now, we'll use the summary data
            this.displayModificationsHistory(summaryData, modifications);
        } catch (error) {
            this.showNotification('Error loading modifications history: ' + error.message, 'error');
        }
    }
    
    displayModificationsHistory(summaryData, modifications) {
        const totalMods = summaryData.total_modifications || modifications.length || 0;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1400px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> Data Modifications History</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #fff3e0; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: #f57c00;"> Summary</h3>
                        <div style="font-size: 1.2em; font-weight: bold; color: #f57c00;">Total Modifications: ${totalMods}</div>
                        <div style="margin-top: 10px; color: #666; font-size: 0.9em;">
                            All data modifications are tracked with complete audit trail including who, when, why, and what changed.
                        </div>
                    </div>
                    ${modifications.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <thead style="background: #343a40; color: white;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left;">File Name</th>
                                        <th style="padding: 12px; text-align: left;">Modification Type</th>
                                        <th style="padding: 12px; text-align: left;">Reason</th>
                                        <th style="padding: 12px; text-align: left;">Modified By</th>
                                        <th style="padding: 12px; text-align: left;">Date</th>
                                        <th style="padding: 12px; text-align: left;">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${modifications.map(mod => `
                                        <tr style="border-bottom: 1px solid #dee2e6;">
                                            <td style="padding: 12px;">
                                                <div style="font-weight: 600; color: #495057;">${mod.file_name || mod.filename || 'Unknown'}</div>
                                            </td>
                                            <td style="padding: 12px;">
                                                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #e3f2fd; color: #1976d2;">
                                                    ${mod.modification_type || mod.type || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style="padding: 12px; color: #6c757d;">${mod.modification_reason || mod.reason || 'N/A'}</td>
                                            <td style="padding: 12px; color: #6c757d;">${mod.modified_by || mod.user || 'Unknown'}</td>
                                            <td style="padding: 12px; color: #6c757d; font-size: 0.9em;">${new Date(mod.modified_at || mod.timestamp || Date.now()).toLocaleString()}</td>
                                            <td style="padding: 12px;">
                                                <button onclick="alert('Modification Details:\\n\\nFile: ${mod.file_name || 'Unknown'}\\nType: ${mod.modification_type || 'Unknown'}\\nReason: ${mod.modification_reason || 'N/A'}\\nRows Changed: ${mod.rows_removed || 0} removed, ${mod.rows_added || 0} added')" 
                                                        style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 3em; color: #6c757d; margin-bottom: 15px;"></div>
                            <h3 style="color: #6c757d; margin-bottom: 10px;">No Modifications Recorded</h3>
                            <p style="color: #6c757d;">No data modifications have been recorded yet. All modifications are tracked when files are edited in the clipping interface.</p>
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    async showIntegrityStatusDetails() {
        this.showNotification('Loading integrity status details...', 'info');
        
        try {
            const response = await fetch('/api/csv/integrity/summary', {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            this.displayIntegrityStatusDetails(data);
        } catch (error) {
            this.showNotification('Error loading integrity status: ' + error.message, 'error');
        }
    }
    
    displayIntegrityStatusDetails(data) {
        const totalFiles = data.total_files || 0;
        const verifiedFiles = data.verified_files || 0;
        const tamperedFiles = data.tampered_files || 0;
        const unverifiedFiles = data.unverified_files || 0;
        const integrityPercentage = totalFiles > 0 ? Math.round((verifiedFiles / totalFiles) * 100) : 100;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> Integrity Status Report</h2>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: ${integrityPercentage >= 95 ? '#e8f5e8' : integrityPercentage >= 80 ? '#fff3e0' : '#ffebee'}; border-radius: 8px;">
                        <h3 style="margin: 0 0 10px 0; color: ${integrityPercentage >= 95 ? '#2e7d32' : integrityPercentage >= 80 ? '#f57c00' : '#d32f2f'};"> Integrity Summary</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #1976d2;">${totalFiles}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Files</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #2e7d32;">${verifiedFiles}</div>
                                <div style="color: #666; font-size: 0.9em;"> Verified</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #d32f2f;">${tamperedFiles}</div>
                                <div style="color: #666; font-size: 0.9em;"> Tampered</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: #f57c00;">${unverifiedFiles}</div>
                                <div style="color: #666; font-size: 0.9em;"> Unverified</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                                <div style="font-size: 2em; font-weight: bold; color: ${integrityPercentage >= 95 ? '#2e7d32' : integrityPercentage >= 80 ? '#f57c00' : '#d32f2f'};">${integrityPercentage}%</div>
                                <div style="color: #666; font-size: 0.9em;">Integrity Level</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0;"> Integrity Protection Features</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #495057;">
                            <li style="margin-bottom: 8px;"><strong>Cryptographic Fingerprinting:</strong> SHA-256 hashes for all files</li>
                            <li style="margin-bottom: 8px;"><strong>Tamper Detection:</strong> Automatic detection of file modifications</li>
                            <li style="margin-bottom: 8px;"><strong>Chain of Custody:</strong> Complete tracking of file access and modifications</li>
                            <li style="margin-bottom: 8px;"><strong>Modification Tracking:</strong> All changes documented with reasons</li>
                            <li style="margin-bottom: 8px;"><strong>Audit Trail:</strong> Complete history for compliance and utility submissions</li>
                        </ul>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;"> Integrity Status Levels</h4>
                        <div style="color: #495057; font-size: 0.9em;">
                            <p style="margin: 5px 0;"><strong>95-100%:</strong> Excellent - All files verified and protected</p>
                            <p style="margin: 5px 0;"><strong>80-94%:</strong> Good - Most files verified, some pending verification</p>
                            <p style="margin: 5px 0;"><strong>Below 80%:</strong> Needs Attention - Run integrity verification to check all files</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                    <button class="btn btn-secondary" onclick="dashboard.showIntegrityVerification(); this.closest('.modal').remove(); document.body.classList.remove('modal-open');" style="margin-left: 10px;">Run Full Verification</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    showIntegrityDetailsModal(id, fileName, status, storedFingerprint, currentFingerprint, fileExists) {
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.style.display = 'block';
        detailsModal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2> Integrity Details: ${fileName}</h2>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0;">File Information</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <strong>File ID:</strong> ${id}
                            </div>
                            <div>
                                <strong>File Exists:</strong> ${fileExists ? ' Yes' : ' No'}
                            </div>
                            <div>
                                <strong>Status:</strong> ${this.getIntegrityStatusBadge(status)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0;"> Fingerprint Comparison</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <h4 style="color: #1976d2; margin-bottom: 10px;">Stored Fingerprint</h4>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                                    <div style="font-family: 'Courier New', monospace; font-size: 0.8em; color: #495057; word-break: break-all; line-height: 1.4;">
                                        ${storedFingerprint || 'No fingerprint stored'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 style="color: #f57c00; margin-bottom: 10px;">Current Fingerprint</h4>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                                    <div style="font-family: 'Courier New', monospace; font-size: 0.8em; color: #495057; word-break: break-all; line-height: 1.4;">
                                        ${currentFingerprint || 'Could not read file'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0 0 15px 0;"> Status Explanation</h3>
                        <div style="color: #666; line-height: 1.6;">
                            ${this.getIntegrityStatusMessage(status)}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailsModal);
        document.body.classList.add('modal-open');
        
        // Close modal when clicking outside
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    showVerificationLoadingModal() {
        // Create loading modal
        const loadingModal = document.createElement('div');
        loadingModal.id = 'verification-loading-modal';
        loadingModal.className = 'modal';
        loadingModal.style.display = 'block';
        loadingModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                        <h2 style="margin: 0;"> Verifying CSV Integrity...</h2>
                    </div>
                </div>
                <div class="modal-body" style="text-align: center; padding: 40px;">
                    <div style="font-size: 3em; margin-bottom: 20px;"></div>
                    <h3 style="color: #1976d2; margin-bottom: 15px;">Verification in Progress</h3>
                    <p style="color: #666; margin-bottom: 20px;">Please wait while we verify the integrity of all CSV files...</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                            <div style="width: 20px; height: 20px; border: 2px solid #e3f2fd; border-top: 2px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                            <span style="color: #1976d2; font-weight: 600;">Processing files...</span>
                        </div>
                        <div style="color: #666; font-size: 0.9em;">
                            This may take a few moments depending on the number of files.
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingModal);
    }
    
    removeVerificationLoadingModal() {
        const loadingModal = document.getElementById('verification-loading-modal');
        if (loadingModal) {
            loadingModal.remove();
        }
    }
    
    getIntegrityStatusBadge(status) {
        const badges = {
            'unverified': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #fff3e0; color: #f57c00;"> Unverified</span>',
            'verified': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #e8f5e8; color: #2e7d32;"> Verified</span>',
            'tampered': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #ffebee; color: #d32f2f;"> Tampered</span>',
            'file_missing': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #fff3e0; color: #f57c00;"> Missing</span>',
            'no_fingerprint': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #f3e5f5; color: #9c27b0;"> No Fingerprint</span>',
            'read_error': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #e0f2f1; color: #607d8b;"> Read Error</span>',
            'unknown': '<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600; background: #f5f5f5; color: #757575;">❓ Unknown</span>'
        };
        return badges[status] || badges['unknown'];
    }
    
    getIntegrityStatusMessage(status) {
        const messages = {
            'unverified': 'File integrity verification is in progress. Please wait for verification to complete.',
            'verified': 'File integrity is intact. The current file matches the stored fingerprint.',
            'tampered': 'File has been modified! The current fingerprint does not match the stored fingerprint.',
            'file_missing': 'File cannot be found at the expected location.',
            'no_fingerprint': 'No fingerprint was stored for this file during upload.',
            'read_error': 'Unable to read the file to generate a current fingerprint.',
            'unknown': 'Unable to determine the integrity status of this file.'
        };
        return messages[status] || messages['unknown'];
    }
    
    async showCreateProject() {
        this.showNotification('Opening project creation dialog...', 'info');
        
        try {
            // Create a modal for project creation
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                            <h2 style="margin: 0;">➕ Create New Project</h2>
                        </div>
                        <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="create-project-form">
                            <div class="form-group">
                                <label for="project-name">Project Name:</label>
                                <input type="text" id="project-name" name="project_name" required placeholder="Enter project name">
                            </div>
                            <div class="form-group">
                                <label for="project-description">Description (optional):</label>
                                <textarea id="project-description" name="description" rows="3" placeholder="Enter project description"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="project-type">Project Type:</label>
                                <select id="project-type" name="project_type">
                                    <option value="energy_audit">Energy Audit</option>
                                    <option value="power_quality">Power Quality Analysis</option>
                                    <option value="load_study">Load Study</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Cancel</button>
                                <button type="submit" class="btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.classList.add('modal-open');
            
            // Handle form submission
            document.getElementById('create-project-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formData.get('project_name'),
                            description: formData.get('description'),
                            project_type: formData.get('project_type')
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        this.showNotification('Project created successfully!', 'success');
                        modal.remove();
                        // Refresh project list if needed
                        this.refreshProjectList();
                    } else {
                        this.showNotification('Error creating project: ' + result.error, 'error');
                    }
                } catch (error) {
                    this.showNotification('Error creating project: ' + error.message, 'error');
                }
            });
            
        } catch (error) {
            this.showNotification('Error opening project creation dialog: ' + error.message, 'error');
        }
    }
    
    async showAccessProject() {
        console.log('🔍 showAccessProject() called');
        
        // Check if user is authenticated
        if (!this.sessionToken) {
            console.error('❌ No session token available. User not authenticated.');
            this.showNotification('Please log in first to access projects.', 'error');
            return;
        }
        
        this.showNotification('Loading projects...', 'info');
        
        try {
            console.log('📡 Fetching projects from /api/projects...');
            console.log('🔑 Session token available:', this.sessionToken ? 'Yes' : 'No');
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('⏱️ Projects request timed out');
                controller.abort();
            }, 30000); // 30 second timeout (increased for database queries with counts)
            
            const authHeaders = this.getAuthHeaders();
            console.log('📤 Request headers:', authHeaders);
            
            const response = await fetch('/api/projects', {
                headers: authHeaders,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log('📥 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API error:', response.status, errorText);
                this.showNotification(`Error loading projects: ${response.status} ${response.statusText}`, 'error');
                return;
            }
            
            const data = await response.json();
            console.log('📦 Projects data received:', Array.isArray(data) ? `${data.length} projects` : 'Not an array', data);
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(`✅ Found ${data.length} projects, creating modal...`);
                // Create a modal to select and access projects
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 800px;">
                        <div class="modal-header">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                                <h2 style="margin: 0;">📂 Access Project</h2>
                            </div>
                            <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="project-list">
                                ${data.map(project => {
                                    // Escape project name for use in HTML attributes
                                    const escapedName = project.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                                    // Get project ID - handle both id and project_id fields
                                    const projectId = project.id || project.project_id || project.ID;
                                    if (!projectId) {
                                        console.error('⚠️ Project missing ID:', project);
                                        return ''; // Skip projects without IDs
                                    }
                                    return `
                                    <div class="project-item" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="flex: 1; cursor: pointer;" onclick="(function() { 
                                                const projectId = ${projectId}; 
                                                console.log('🖱️ Project clicked, ID:', projectId); 
                                                if (window.mainDashboard && typeof window.mainDashboard.loadProject === 'function') { 
                                                    window.mainDashboard.loadProject(projectId); 
                                                } else { 
                                                    console.error('❌ window.mainDashboard.loadProject not available'); 
                                                    alert('Error: Cannot load project. Please refresh the page and try again.'); 
                                                } 
                                            })();">
                                        <h3 style="margin: 0 0 5px 0; font-size: 0.9em;">${project.name}</h3>
                                        <p style="margin: 0; color: #666; font-size: 0.8em;">Click to load this project</p>
                                            </div>
                                            <div style="display: flex; gap: 10px; align-items: center;">
                                                <button type="button" 
                                                        class="btn-danger" 
                                                        style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;"
                                                        onclick="(function(btn) { 
                                                            const projectName = '${escapedName}';
                                                            const projectItem = btn.closest('.project-item');
                                                            (window.archiveProjectByName || function(name) { console.error('archiveProjectByName not available'); })(projectName, function(archivedName) { 
                                                                // Remove the project item from the DOM immediately
                                                                if (projectItem) {
                                                                    projectItem.style.transition = 'opacity 0.3s';
                                                                    projectItem.style.opacity = '0';
                                                                    setTimeout(() => {
                                                                        projectItem.remove();
                                                                        // If no projects left, close the modal
                                                                        const projectList = document.querySelector('.project-list');
                                                                        if (projectList && projectList.children.length === 0) {
                                                                            const modal = document.querySelector('.modal');
                                                                            if (modal) {
                                                                                modal.remove();
                                                                                document.body.classList.remove('modal-open');
                                                                            }
                                                                        }
                                                                    }, 300);
                                                                } else {
                                                                    // Fallback: refresh the entire popup
                                                                    const modal = document.querySelector('.modal');
                                                                    if (modal) {
                                                                        modal.remove();
                                                                        document.body.classList.remove('modal-open');
                                                                        setTimeout(() => {
                                                                            window.mainDashboard.showAccessProject();
                                                                        }, 100);
                                                                    }
                                                                }
                                                                // Also refresh the dropdown if it exists
                                                                if (typeof loadProjectList === 'function') {
                                                                    setTimeout(() => {
                                                                        loadProjectList();
                                                                    }, 500);
                                                                }
                                                            });
                                                        })(this); event.stopPropagation();"
                                                        title="Archive this project">
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                            <div class="form-actions" style="margin-top: 20px;">
                                <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                document.body.classList.add('modal-open');
                console.log('✅ Modal created and appended to body');
            } else {
                console.log('ℹ️ No projects found or empty array');
                this.showNotification('No projects found. Create a project first.', 'info');
            }
        } catch (error) {
            console.error('❌ Error in showAccessProject:', error);
            if (error.name === 'AbortError') {
                this.showNotification('Request timed out. Please try again.', 'error');
            } else {
                this.showNotification('Error loading projects: ' + (error.message || 'Unknown error'), 'error');
            }
        }
    }
    
    async loadProject(projectId) {
        console.log('📂 loadProject() called with projectId:', projectId);
        
        // Validate projectId
        if (!projectId) {
            console.error('❌ loadProject called with invalid projectId:', projectId);
            this.showNotification('Error: Invalid project ID', 'error');
            return;
        }
        
        // CRITICAL: Clear cached project/analysis data but preserve project list data
        try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('project') || key.includes('analysis') || key.includes('results'))) {
                    // Don't clear project list related keys - preserve them for the dropdown
                    if (!key.includes('projectList') && !key.includes('projectsList')) {
                        keysToRemove.push(key);
                    }
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            
            // Also clear any cached analysis results
            if (window.analysisResults) {
                delete window.analysisResults;
            }
            
            console.log('🧹 Cleared cached data for new project load (preserved project list)');
        } catch (e) {
            console.warn('⚠️ Could not clear cache:', e);
        }
        
        this.showNotification(`Loading project ID: ${projectId}...`, 'info');
        
        try {
            console.log('📡 Calling /api/projects/load with project_id:', projectId);
            
            const response = await fetch('/api/projects/load', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    project_id: projectId
                })
            });
            
            console.log('📥 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('❌ API error:', response.status, errorText);
                this.showNotification(`Error loading project: HTTP ${response.status} - ${errorText}`, 'error');
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 API response:', result);
            
            if (result.project) {
                // Store project data in sessionStorage for the legacy interface to use
                sessionStorage.setItem('loadedProjectData', JSON.stringify(result));
                sessionStorage.setItem('loadedProjectName', result.project.name);
                sessionStorage.setItem('currentProjectId', projectId);
                
                console.log('✅ Project loaded:', result.project.name);
                this.showNotification(`Project "${result.project.name}" loaded successfully! Redirecting to UI...`, 'success');
                
                // Close any open modals
                document.querySelectorAll('.modal').forEach(modal => modal.remove());
                document.body.classList.remove('modal-open');
                
                // Redirect to legacy interface with the loaded project
                console.log('🔄 Redirecting to /legacy in 1 second...');
                setTimeout(() => {
                    console.log('🚀 Navigating to /legacy');
                    // Use window.location.href to navigate (was working before)
                    window.location.href = '/legacy';
                }, 1000);
            } else {
                console.error('❌ No project in response:', result);
                this.showNotification('Error loading project: ' + (result.error || 'Project data not found in response'), 'error');
            }
        } catch (error) {
            console.error('❌ Error in loadProject:', error);
            console.error('❌ Error stack:', error.stack);
            if (error.name === 'AbortError') {
                this.showNotification('Project load was cancelled or timed out. Please try again.', 'error');
            } else {
                this.showNotification('Error loading project: ' + error.message, 'error');
            }
        }
    }
    
    async reanalyzeProject(projectId, projectName) {
        if (!confirm(`Re-analyze "${projectName}" with the latest code improvements?\n\nThis will:\n- Re-run analysis with improved weather normalization\n- Recalculate base temperature from baseline data\n- Extract time series data for ASHRAE regression\n- Regenerate reports with updated calculations\n\nOriginal CSV files must still exist.`)) {
            return;
        }
        
        // CRITICAL: Clear cache before re-analyzing to ensure fresh calculations
        try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('project') || key.includes('analysis') || key.includes('results'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
            
            // Also clear any cached analysis results
            if (window.analysisResults) {
                delete window.analysisResults;
            }
            
            console.log('🧹 Cleared frontend cache before re-analysis');
        } catch (e) {
            console.warn('Could not clear frontend cache:', e);
        }
        
        this.showNotification(`Re-analyzing "${projectName}"...`, 'info');
        
        try {
            // Load project data
            const loadResponse = await fetch('/api/projects/load', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    project_id: projectId
                })
            });
            
            const loadResult = await loadResponse.json();
            
            if (loadResult.error || !loadResult.project || !loadResult.project.data) {
                throw new Error(loadResult.error || 'Failed to load project data');
            }
            
            // Parse project data
            let projectData = {};
            try {
                const dataStr = loadResult.project.data;
                const parsed = JSON.parse(dataStr);
                if (parsed.payload) {
                    projectData = typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;
                } else {
                    projectData = parsed;
                }
            } catch (e) {
                throw new Error('Failed to parse project data');
            }
            
            // Extract file IDs
            const beforeFileId = projectData.before_file_id || projectData.beforeFileId;
            const afterFileId = projectData.after_file_id || projectData.afterFileId;
            
            if (!beforeFileId || !afterFileId) {
                throw new Error('Project missing file IDs. Cannot re-analyze.');
            }
            
            // Build form data
            const formData = new FormData();
            formData.append('before_file_id', beforeFileId);
            formData.append('after_file_id', afterFileId);
            formData.append('project_name', projectName);
            
            // Add all other project data
            for (const [key, value] of Object.entries(projectData)) {
                if (key !== 'before_file_id' && key !== 'after_file_id' && key !== 'beforeFileId' && key !== 'afterFileId') {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                }
            }
            
            // Run analysis
            const analyzeResponse = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            const results = await analyzeResponse.json();
            
            if (results.error) {
                throw new Error(results.error);
            }
            
            // Store results and redirect to legacy UI
            sessionStorage.setItem('reanalyzedProjectResults', JSON.stringify(results));
            sessionStorage.setItem('reanalyzedProjectName', projectName);
            
            this.showNotification(` "${projectName}" re-analyzed successfully! Redirecting...`, 'success');
            
            // Close modals
            document.querySelectorAll('.modal').forEach(modal => modal.remove());
            document.body.classList.remove('modal-open');
            
            // Redirect to legacy interface
            setTimeout(() => {
                window.location.href = '/legacy';
            }, 1000);
            
        } catch (error) {
            this.showNotification(`Error re-analyzing project: ${error.message}`, 'error');
            console.error('Re-analysis error:', error);
        }
    }
    
    async showProjectTemplates() {
        this.showNotification('Loading project templates...', 'info');
        
        try {
            // Create a modal showing available templates
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="/static/synerex_logo_transparent.png" alt="SYNEREX" style="height: 32px; width: auto;">
                            <h2 style="margin: 0;">📄 Project Templates</h2>
                        </div>
                        <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="template-list">
                            <div class="template-item" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 5px 0;">Energy Audit Template</h3>
                                <p style="margin: 0 0 10px 0; color: #666;">Standard template for energy audit projects with predefined fields and calculations.</p>
                                <button class="btn-primary" onclick="window.mainDashboard.createFromTemplate('energy_audit')">Use Template</button>
                            </div>
                            <div class="template-item" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 5px 0;">Power Quality Analysis Template</h3>
                                <p style="margin: 0 0 10px 0; color: #666;">Template for power quality analysis with harmonic analysis and compliance checking.</p>
                                <button class="btn-primary" onclick="window.mainDashboard.createFromTemplate('power_quality')">Use Template</button>
                            </div>
                            <div class="template-item" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 5px 0;">Load Study Template</h3>
                                <p style="margin: 0 0 10px 0; color: #666;">Template for electrical load studies and capacity analysis.</p>
                                <button class="btn-primary" onclick="window.mainDashboard.createFromTemplate('load_study')">Use Template</button>
                            </div>
                        </div>
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open');">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.classList.add('modal-open');
        } catch (error) {
            this.showNotification('Error loading templates: ' + error.message, 'error');
        }
    }
    
    async createFromTemplate(templateType) {
        this.showNotification(`Creating project from ${templateType} template...`, 'info');
        
        // Close template modal
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        document.body.classList.remove('modal-open');
        
        // Create project with template data
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${templateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Project`,
                    description: `Project created from ${templateType} template`,
                    project_type: templateType,
                    template: true
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Project created from template successfully!', 'success');
                // Redirect to legacy interface to work with the new project
                setTimeout(() => {
                    window.location.href = '/legacy';
                }, 1000);
            } else {
                this.showNotification('Error creating project from template: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error creating project from template: ' + error.message, 'error');
        }
    }
    
    async refreshProjectList() {
        // This method can be called to refresh project lists in the UI
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            // Update any project lists in the UI if needed

        } catch (error) {
            console.error('Error refreshing project list:', error);
        }
    }
    
    attachPEButtonListeners() {
        // Attach event listeners for PE Management buttons
        const registerPE = document.getElementById('register-pe');
        if (registerPE) {
            // Remove existing listeners by cloning
            const newRegisterPE = registerPE.cloneNode(true);
            registerPE.parentNode.replaceChild(newRegisterPE, registerPE);
            newRegisterPE.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showRegisterPE();
            });
            console.log('Register PE button listener attached');
        } else {
            console.warn('Register PE button not found in DOM');
        }
        
        const peDashboard = document.getElementById('pe-dashboard');
        if (peDashboard) {
            const newPeDashboard = peDashboard.cloneNode(true);
            peDashboard.parentNode.replaceChild(newPeDashboard, peDashboard);
            newPeDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPEDashboard();
            });
            console.log('PE Dashboard button listener attached');
        } else {
            console.warn('PE Dashboard button not found in DOM');
        }
        
        const verifyLicenses = document.getElementById('verify-licenses');
        if (verifyLicenses) {
            const newVerifyLicenses = verifyLicenses.cloneNode(true);
            verifyLicenses.parentNode.replaceChild(newVerifyLicenses, verifyLicenses);
            newVerifyLicenses.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showLicenseVerification();
            });
            console.log('Verify Licenses button listener attached');
        } else {
            console.warn('Verify Licenses button not found in DOM');
        }
    }
    
    showRegisterPE() {
        try {
            console.log('Register New PE button clicked');
            this.showNotification('Opening PE registration...', 'info');
            setTimeout(() => {
                window.location.href = '/pe-dashboard#register';
            }, 500);
        } catch (error) {
            console.error('Error in showRegisterPE:', error);
            window.location.href = '/pe-dashboard#register';
        }
    }
    
    showPEDashboard() {
        try {
            console.log('PE Dashboard button clicked');
            this.showNotification('Opening PE dashboard...', 'info');
            setTimeout(() => {
                window.location.href = '/pe-dashboard';
            }, 500);
        } catch (error) {
            console.error('Error in showPEDashboard:', error);
            window.location.href = '/pe-dashboard';
        }
    }
    
    showLicenseVerification() {
        try {
            console.log('Verify Licenses button clicked');
            this.showNotification('Opening license verification...', 'info');
            setTimeout(() => {
                window.location.href = '/pe-dashboard#verify';
            }, 500);
        } catch (error) {
            console.error('Error in showLicenseVerification:', error);
            window.location.href = '/pe-dashboard#verify';
        }
    }
    
    showSystemStatus() {
        this.showNotification('Redirecting to system status...', 'info');
        setTimeout(() => {
            window.location.href = '/system-status';
        }, 1000);
    }
    
    showAuditCompliance() {
        this.showNotification('Redirecting to audit compliance...', 'info');
        setTimeout(() => {
            window.location.href = '/audit-compliance';
        }, 1000);
    }
    
    showDocumentation() {
        this.showNotification('Redirecting to documentation...', 'info');
        setTimeout(() => {
            window.location.href = '/documentation';
        }, 1000);
    }
    
    // Help System
    showHelp() {
        const helpSystem = document.getElementById('help-system');
        if (helpSystem) {
            helpSystem.style.display = 'block';
            this.helpStep = 1;
            this.updateHelpStep();
            
            // Add keyboard event listener for ESC key
            this.helpKeyHandler = (event) => {
                if (event.key === 'Escape') {
                    this.hideHelp();
                }
            };
            document.addEventListener('keydown', this.helpKeyHandler);
            
            // Add click-outside-to-close functionality
            this.helpClickHandler = (event) => {
                if (event.target === helpSystem) {
                    this.hideHelp();
                }
            };
            helpSystem.addEventListener('click', this.helpClickHandler);
        }
    }
    
    hideHelp() {
        const helpSystem = document.getElementById('help-system');
        if (helpSystem) {
            helpSystem.style.display = 'none';
            
            // Remove event listeners
            if (this.helpKeyHandler) {
                document.removeEventListener('keydown', this.helpKeyHandler);
                this.helpKeyHandler = null;
            }
            if (this.helpClickHandler) {
                helpSystem.removeEventListener('click', this.helpClickHandler);
                this.helpClickHandler = null;
            }
        }
    }
    
    previousHelpStep() {
        if (this.helpStep > 1) {
            this.helpStep--;
            this.updateHelpStep();
        }
    }
    
    nextHelpStep() {
        if (this.helpStep < this.maxHelpSteps) {
            this.helpStep++;
            this.updateHelpStep();
        }
    }
    
    updateHelpStep() {
        // Hide all steps
        document.querySelectorAll('.help-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStep = document.querySelector(`.help-step[data-step="${this.helpStep}"]`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
        
        // Update navigation buttons
        document.getElementById('prev-step').disabled = this.helpStep === 1;
        document.getElementById('next-step').disabled = this.helpStep === this.maxHelpSteps;
        
        if (this.helpStep === this.maxHelpSteps) {
            document.getElementById('next-step').textContent = 'Finish';
        } else {
            document.getElementById('next-step').textContent = 'Next';
        }
    }
    
    // Notification System
    showNotification(message, type = 'info') {
        const banner = document.getElementById('notification-banner');
        const text = document.getElementById('notification-text');
        
        if (!banner || !text) return;
        
        text.textContent = message;
        
        // Remove existing type classes
        banner.classList.remove('success', 'error', 'info', 'warning');
        
        // Add new type class
        if (type !== 'info') {
            banner.classList.add(type);
        }
        
        // Update background color based on type
        switch (type) {
            case 'success':
                banner.style.background = 'linear-gradient(135deg, #28a745, #218838)';
                break;
            case 'error':
                banner.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                break;
            case 'warning':
                banner.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
                break;
            default:
                banner.style.background = 'linear-gradient(135deg, #17a2b8, #138496)';
        }
        
        banner.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }
    
    hideNotification() {
        const banner = document.getElementById('notification-banner');
        if (banner) {
            banner.classList.add('hide');
            setTimeout(() => {
                banner.style.display = 'none';
                banner.classList.remove('hide');
            }, 300);
        }
    }
    
    // Utility methods
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
        };
    }
    
    setLoading(loading) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (loading) {
                form.classList.add('loading');
            } else {
                form.classList.remove('loading');
            }
        });
    }
    
    clearAllSpinners() {
        // Clear all possible spinner elements
        const spinners = document.querySelectorAll('.spinner, .loading-spinner, [class*="spinner"], .loading, [id*="spinner"], [id*="loading"], [class*="loading"]');
        spinners.forEach(spinner => {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.classList.remove('loading', 'active', 'spinning', 'spinner');
            // Also remove inline styles that might show spinner
            spinner.style.opacity = '';
        });
        
        // Clear loading classes from body and forms
        document.body.classList.remove('loading', 'modal-open');
        document.body.style.opacity = '';
        document.body.style.pointerEvents = '';
        
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.classList.remove('loading');
            form.style.pointerEvents = 'auto';
            form.style.opacity = '1';
            form.style.position = ''; // Remove position that might be needed for ::after spinner
        });
        
        // Clear any loading overlays
        const overlays = document.querySelectorAll('.loading-overlay, .spinner-overlay, [class*="overlay"]');
        overlays.forEach(overlay => {
            overlay.style.display = 'none';
        });
        
        // Disable any disabled buttons
        const buttons = document.querySelectorAll('button[disabled], input[type="submit"][disabled]');
        buttons.forEach(btn => {
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
            }
            btn.disabled = false;
        });
    }
    
    clearLoginForm() {
        document.getElementById('user-login').reset();
    }
    
    clearRegistrationForm() {
        document.getElementById('user-registration').reset();
        this.hidePasswordFeedback();
    }
    
    // Password validation methods
    validatePassword() {
        const password = document.getElementById('reg-password').value;
        const strength = this.checkPasswordStrength(password);
        this.updatePasswordStrengthIndicator(strength);
        this.updatePasswordRequirements(password);
        this.validatePasswordMatch(); // Also check if confirm password matches
    }
    
    validatePasswordMatch() {
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const messageElement = document.getElementById('password-match-message');
        
        if (confirmPassword === '') {
            messageElement.style.display = 'none';
            return;
        }
        
        if (password === confirmPassword) {
            messageElement.textContent = '✓ Passwords match';
            messageElement.className = 'password-feedback match';
            messageElement.style.display = 'block';
        } else {
            messageElement.textContent = '✗ Passwords do not match';
            messageElement.className = 'password-feedback no-match';
            messageElement.style.display = 'block';
        }
    }
    
    checkPasswordStrength(password) {
        if (password.length < 6) return 'weak';
        
        let score = 0;
        
        // Length check
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 3) return 'weak';
        if (score < 5) return 'fair';
        if (score < 6) return 'good';
        return 'strong';
    }
    
    updatePasswordStrengthIndicator(strength) {
        const bar = document.getElementById('password-strength-bar');
        const message = document.getElementById('password-strength-message');
        
        // Reset classes
        bar.className = 'password-strength-bar';
        message.className = 'password-feedback';
        
        switch (strength) {
            case 'weak':
                bar.classList.add('weak');
                message.textContent = 'Password is weak';
                message.classList.add('weak');
                message.style.display = 'block';
                break;
            case 'fair':
                bar.classList.add('fair');
                message.textContent = 'Password is fair';
                message.classList.add('weak');
                message.style.display = 'block';
                break;
            case 'good':
                bar.classList.add('good');
                message.textContent = 'Password is good';
                message.classList.add('strong');
                message.style.display = 'block';
                break;
            case 'strong':
                bar.classList.add('strong');
                message.textContent = 'Password is strong';
                message.classList.add('strong');
                message.style.display = 'block';
                break;
            default:
                message.style.display = 'none';
        }
    }
    
    updatePasswordRequirements(password) {
        const requirements = {
            'req-length': password.length >= 8,
            'req-uppercase': /[A-Z]/.test(password),
            'req-lowercase': /[a-z]/.test(password),
            'req-number': /[0-9]/.test(password),
            'req-special': /[^A-Za-z0-9]/.test(password)
        };
        
        Object.keys(requirements).forEach(reqId => {
            const element = document.getElementById(reqId);
            if (requirements[reqId]) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        });
    }
    
    hidePasswordFeedback() {
        const strengthMessage = document.getElementById('password-strength-message');
        const matchMessage = document.getElementById('password-match-message');
        const strengthBar = document.getElementById('password-strength-bar');
        
        if (strengthMessage) strengthMessage.style.display = 'none';
        if (matchMessage) matchMessage.style.display = 'none';
        if (strengthBar) strengthBar.className = 'password-strength-bar';
        
        // Reset password requirements
        const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'];
        requirements.forEach(reqId => {
            document.getElementById(reqId).classList.remove('valid');
        });
    }
}

// Clear spinners on page unload to prevent them from persisting
window.addEventListener('beforeunload', function() {
    if (window.mainDashboard) {
        window.mainDashboard.clearAllSpinners();
    } else {
        // Clear spinners even if dashboard isn't initialized yet
        const spinners = document.querySelectorAll('.spinner, .loading-spinner, [class*="spinner"], .loading, [id*="spinner"], [id*="loading"]');
        spinners.forEach(spinner => {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.classList.remove('loading', 'active', 'spinning');
        });
        document.body.classList.remove('loading', 'modal-open');
    }
});

window.addEventListener('pagehide', function() {
    if (window.mainDashboard) {
        window.mainDashboard.clearAllSpinners();
    } else {
        // Clear spinners even if dashboard isn't initialized yet
        const spinners = document.querySelectorAll('.spinner, .loading-spinner, [class*="spinner"], .loading, [id*="spinner"], [id*="loading"]');
        spinners.forEach(spinner => {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.classList.remove('loading', 'active', 'spinning');
        });
        document.body.classList.remove('loading', 'modal-open');
    }
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // CRITICAL: Clear all spinners immediately on page load
    // This prevents spinners from persisting when navigating from other pages
    if (window.mainDashboard) {
        window.mainDashboard.clearAllSpinners();
    } else {
        // Clear spinners even if dashboard isn't initialized yet
        const spinners = document.querySelectorAll('.spinner, .loading-spinner, [class*="spinner"], .loading, [id*="spinner"], [id*="loading"]');
        spinners.forEach(spinner => {
            spinner.style.display = 'none';
            spinner.style.visibility = 'hidden';
            spinner.classList.remove('loading', 'active', 'spinning');
        });
        document.body.classList.remove('loading', 'modal-open');
    }

    if (!window.mainDashboard) {
        window.mainDashboard = new MainDashboard();
        
        // Load project list into dropdown
        if (typeof loadProjectList === 'function') {
            loadProjectList();
        }
    }
});

// Global notification functions for compatibility
// DISABLED: Using notification system from javascript_functions.js instead
// window.showNotification = function(message, type = 'info') {
//     if (window.mainDashboard) {
//         window.mainDashboard.showNotification(message, type);
//     }
// }

// DISABLED: Using notification system from javascript_functions.js instead
// window.hideNotification = function() {
//     if (window.mainDashboard) {
//         window.mainDashboard.hideNotification();
//     }
// }

// Global password toggle function
window.togglePasswordVisibility = function(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const eyeIcon = button.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.textContent = '🙈'; // Closed eye icon
        button.classList.add('showing');
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        eyeIcon.textContent = '👁️'; // Open eye icon
        button.classList.remove('showing');
        button.setAttribute('aria-label', 'Show password');
    }
    
    // Keep focus on input after toggle
    input.focus();
};

// Debug: Check if script loaded

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {

} else {

    if (!window.mainDashboard) {
        window.mainDashboard = new MainDashboard();
        
        // Load project list into dropdown
        if (typeof loadProjectList === 'function') {
            loadProjectList();
        }
    }
}

// Admin Panel function
function openAdminPanel() {
    // Get session token from dashboard instance first (most current), then localStorage
    let sessionToken = null;
    const dashboard = window.mainDashboard;
    
    if (dashboard && dashboard.sessionToken) {
        sessionToken = dashboard.sessionToken.trim();
    } else {
        sessionToken = (localStorage.getItem('session_token') || sessionStorage.getItem('session_token'));
        if (sessionToken) sessionToken = sessionToken.trim();
    }
    
    // Check if user is currently authenticated as admin on the dashboard
    const isCurrentlyAdmin = dashboard && dashboard.currentUser && dashboard.currentUser.role === 'administrator';
    
    if (!sessionToken && !isCurrentlyAdmin) {
        // Show login form instead of alert
        showNotification('Please log in first to access the admin panel.', 'warning');
        // Focus on login form
        const loginForm = document.getElementById('user-login');
        if (loginForm) {
            loginForm.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }
    
    // If user is currently authenticated as admin, use their session
    if (isCurrentlyAdmin && sessionToken) {
        console.log('User is authenticated as admin, opening admin panel with current session');
        // Set cookie with session token
        document.cookie = `session_token=${sessionToken}; path=/; max-age=86400; SameSite=Lax`;
        // Navigate to admin panel
        window.location.href = `/admin-panel?session_token=${encodeURIComponent(sessionToken)}`;
        return;
    }
    
    // Otherwise, validate the session first
    if (!sessionToken) {
        showNotification('No session token found. Please log in again.', 'error');
        if (dashboard && dashboard.showLoginSection) {
            dashboard.showLoginSection();
        }
        return;
    }
    
    console.log('Validating session before opening admin panel...');
    
    // Validate the session before opening
    fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
    })
    .then(response => {
        console.log('Session validation response status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('Session validation result:', result);
        if (result.status === 'success' && result.user && result.user.role === 'administrator') {
            // Session is valid - set cookie and navigate
            document.cookie = `session_token=${sessionToken}; path=/; max-age=86400; SameSite=Lax`;
            console.log('Session validated, navigating to admin panel');
            window.location.href = `/admin-panel?session_token=${encodeURIComponent(sessionToken)}`;
        } else {
            console.error('Session validation failed:', result);
            const errorMsg = result.error || 'Session expired or insufficient privileges';
            showNotification(errorMsg + '. Please log in again.', 'error');
            if (dashboard && dashboard.showLoginSection) {
                dashboard.showLoginSection();
            }
        }
    })
    .catch(error => {
        console.error('Session validation error:', error);
        showNotification('Could not validate session. Please log in again.', 'error');
    });
}

// SynerexAI Chat Widget Functions
function toggleSynerexAIChat() {
    const chatWidget = document.getElementById('synerex-ai-chat-widget');
    if (chatWidget.style.display === 'none') {
        chatWidget.style.display = 'flex';
        // Focus on input when opened
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 100);
    } else {
        chatWidget.style.display = 'none';
    }
}

function askQuickQuestion(question) {
    // Add user message to chat
    addChatMessage(question, 'user');
    
    // Get AI response from Ollama backend
    setTimeout(async () => {
        try {
            const response = await generateAIResponse(question);
            // Check if response is a string or object
            const responseText = typeof response === 'string' ? response : (response.response || JSON.stringify(response));
            addChatMessage(responseText, 'ai');
        } catch (error) {
            console.error('AI response error:', error);
            // Show more detailed error
            const errorMsg = error.message || 'Unknown error occurred';
            addChatMessage(`I apologize, but I encountered an error: ${errorMsg}. Please check the console for details or ensure Ollama is running on port 11434.`, 'ai');
        }
    }, 1000);
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Disable send button
    const sendBtn = document.querySelector('.chat-send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking...';
    
    // Get AI response from Ollama backend
    setTimeout(async () => {
        try {
            const response = await generateAIResponse(message);
            // Check if response is a string or object
            const responseText = typeof response === 'string' ? response : (response.response || JSON.stringify(response));
            addChatMessage(responseText, 'ai');
        } catch (error) {
            console.error('AI response error:', error);
            // Show more detailed error
            const errorMsg = error.message || 'Unknown error occurred';
            addChatMessage(`I apologize, but I encountered an error: ${errorMsg}. Please check the console for details or ensure Ollama is running on port 11434.`, 'ai');
        }
        
        // Re-enable send button
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }, 1500);
}

function addChatMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const prefix = sender === 'user' ? 'You:' : 'SynerexAI:';
    messageDiv.innerHTML = `<strong>${prefix}</strong> ${text}`;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enhanced SynerexAI instance
let enhancedAI = null;

// Initialize enhanced AI when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof EnhancedSynerexAI !== 'undefined') {
        enhancedAI = new EnhancedSynerexAI();
        console.log('Enhanced SynerexAI initialized with project context access');
    }
});

// REMOVED: Using global async generateAIResponse function from enhanced_synerex_ai.js
function generateAIResponse_DEPRECATED(question) {
    // Use enhanced AI if available
    if (enhancedAI) {
        return enhancedAI.generateEnhancedResponse(question);
    }
    
    // Fallback to basic responses
    const lowerQuestion = question.toLowerCase();
    
    // XECO Product Questions
    if (lowerQuestion.includes('xeco-hf') || lowerQuestion.includes('harmonic filter')) {
        return `The XECO-HF Series harmonic filters are designed for industrial and commercial applications. Key specifications include:
        • Voltage Rating: 480V, 600V, 1000V
        • Current Rating: 50A to 2000A
        • Harmonic Filtering: 5th, 7th, 11th, 13th harmonics
        • Efficiency: >98%
        • Applications: VFDs, UPS systems, LED lighting
        
        For installation, ensure proper clearance (3 feet front, 1 foot sides) and adequate ventilation. Would you like specific installation guidance?`;
    }
    
    // Installation Questions
    if (lowerQuestion.includes('install') || lowerQuestion.includes('installation')) {
        return `For XECO equipment installation, follow these key requirements:
        • All installations must comply with NEC and local codes
        • Qualified electrician required for installation
        • Proper grounding and bonding required
        • Adequate ventilation and clearance maintained
        • Electrical permits obtained before installation
        
        Specific installation requirements vary by product model. Which XECO product are you installing?`;
    }
    
    // Utility Information Questions
    if (lowerQuestion.includes('utility') || lowerQuestion.includes('rate')) {
        return `For utility rate information, I can help with:
        • Local utility rate analysis and comparison
        • Tariff structure optimization
        • Time-of-use rate analysis
        • Demand charge optimization
        • Local incentive programs
        
        Please provide your location (city, state, zip code) for specific utility rate information.`;
    }
    
    // Electrical Code Questions
    if (lowerQuestion.includes('electrical code') || lowerQuestion.includes('nec')) {
        return `For electrical code compliance, I can assist with:
        • NEC compliance requirements
        • Electrical installation standards
        • Wiring and grounding requirements
        • Electrical permit requirements
        • Safety and inspection guidance
        
        What specific electrical installation are you working on?`;
    }
    
    // Power Quality Questions
    if (lowerQuestion.includes('power quality') || lowerQuestion.includes('harmonic')) {
        return `For power quality analysis, I can help with:
        • Harmonic distortion analysis
        • Voltage unbalance assessment
        • Power factor correction
        • IEEE 519 compliance
        • Power quality monitoring
        
        Please provide your power quality data or describe the specific power quality issues you're experiencing.`;
    }
    
    // Troubleshooting Questions
    if (lowerQuestion.includes('troubleshoot') || lowerQuestion.includes('problem')) {
        return `For troubleshooting assistance, I can help with:
        • Common XECO equipment issues
        • Diagnostic procedures
        • Maintenance schedules
        • Replacement parts identification
        • Technical support guidance
        
        What specific equipment or issue are you troubleshooting?`;
    }
    
    // SYNEREX Program Usage Questions
    if (lowerQuestion.includes('synerex') || lowerQuestion.includes('program') || lowerQuestion.includes('dashboard') || lowerQuestion.includes('how to use')) {
        return `For SYNEREX program usage, I can help with:
        • Dashboard navigation and features
        • CSV file upload and processing
        • Project creation and management
        • Report generation and analysis
        • Admin panel access and configuration
        • System troubleshooting and optimization
        • User authentication and roles
        • Data analysis and calculations
        
        What specific SYNEREX feature or function would you like help with?`;
    }
    
    // General Energy Questions
    return `Thank you for your energy-related question! As SynerexAI, I specialize in:
    • Energy analysis and efficiency optimization
    • XECO equipment support and installation
    • Utility information and rate optimization
    • Electrical code compliance and safety
    • Power quality analysis and improvement
    • SYNEREX program usage and navigation
    
    Could you provide more specific details about your energy or SYNEREX question so I can give you the most accurate assistance?`;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Report generation functions removed - they belong in the analysis interface, not the dashboard

// Report button event listeners removed - report buttons belong in the analysis interface
