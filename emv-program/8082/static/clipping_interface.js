// Clipping Interface JavaScript
class ClippingInterface {
    constructor() {
        console.log('ClippingInterface constructor called');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);
        console.log('Body exists:', !!document.body);
        
        this.currentFile = null;
        this.originalData = null;
        this.modifiedData = null;
        this.selectedRows = new Set();
        this.hasChanges = false;
        this.isProcessing = false; // Add processing flag
        this.isLoadingFiles = false; // Add files loading flag
        this.rangePreviewTimeout = null; // Initialize timeout
        this.files = []; // Store loaded files
        this.cellAnnotations = new Map(); // Store cell annotations: key = "row_index_column_name"
        
        this.initializeEventListeners();
        
        // Load files after a short delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Loading files after DOM ready...');
            if (!this.isLoadingFiles) {
                this.loadFiles();
            }
        }, 100);
        
        // Debug button removed - row numbers working
        
        // Safety timeout to force clear loading state after 15 seconds
        setTimeout(() => {
            if (this.isLoadingFiles) {
                console.log('Safety timeout: Force clearing loading state');
                this.isLoadingFiles = false;
                this.clearLoadingState();
            }
        }, 15000);
        
        // Check if a specific file was requested via URL parameter
        this.checkForFileParameter();
    }
    
    initializeEventListeners() {
        // Check if we're on the clipping interface page
        const backBtn = document.getElementById('back-to-dashboard');
        if (!backBtn) {
            console.log('Not on clipping interface page, skipping event listeners');
            return;
        }
        
        // Navigation
        backBtn.addEventListener('click', () => {
            if (this.hasChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    window.location.href = '/main-dashboard';
                }
            } else {
                window.location.href = '/main-dashboard';
            }
        });
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // File selection
        const fileSearch = document.getElementById('file-search');
        if (fileSearch) {
            fileSearch.addEventListener('input', (e) => {
                this.filterFiles(e.target.value);
            });
        }

        // CSV Editor Guide events
        const showEditorFeatures = document.getElementById('show-editor-features');
        if (showEditorFeatures) showEditorFeatures.addEventListener('click', () => this.showCSVEditorGuide());
        
        const showEditingHelp = document.getElementById('show-editing-help');
        if (showEditingHelp) showEditingHelp.addEventListener('click', () => this.showEditingHelp());
        
        // Range selection events
        const setStartCurrent = document.getElementById('set-start-current');
        if (setStartCurrent) setStartCurrent.addEventListener('click', () => this.setStartToCurrent());
        
        const setEndCurrent = document.getElementById('set-end-current');
        if (setEndCurrent) setEndCurrent.addEventListener('click', () => this.setEndToCurrent());
        
        const applyRange = document.getElementById('apply-range');
        if (applyRange) applyRange.addEventListener('click', () => this.applyRangeSelection());
        
        const clearRange = document.getElementById('clear-range');
        if (clearRange) clearRange.addEventListener('click', () => this.clearRangeSelection());
        
        // Date range events removed - using row selection only
        
        // Navigation events
        const gotoStart = document.getElementById('goto-start');
        if (gotoStart) gotoStart.addEventListener('click', () => this.gotoStart());
        
        const gotoEnd = document.getElementById('goto-end');
        if (gotoEnd) gotoEnd.addEventListener('click', () => this.gotoEnd());
        
        const gotoCurrent = document.getElementById('goto-current');
        if (gotoCurrent) gotoCurrent.addEventListener('click', () => this.gotoCurrent());
        
        const previewRange = document.getElementById('preview-range');
        if (previewRange) previewRange.addEventListener('click', () => this.previewRange());
        
        // Input change events with debouncing
        const startRow = document.getElementById('start-row');
        if (startRow) startRow.addEventListener('input', () => this.debouncedUpdateRangePreview());
        
        const endRow = document.getElementById('end-row');
        if (endRow) endRow.addEventListener('input', () => this.debouncedUpdateRangePreview());
        
        // Analysis dataset creation
        const createAnalysisDataset = document.getElementById('create-analysis-dataset');
        if (createAnalysisDataset) createAnalysisDataset.addEventListener('click', () => this.createAnalysisDataset());
        
        const cancelSelection = document.getElementById('cancel-selection');
        if (cancelSelection) cancelSelection.addEventListener('click', () => this.cancelSelection());
        
        const refreshFiles = document.getElementById('refresh-files');
        if (refreshFiles) {
            refreshFiles.addEventListener('click', () => {
                console.log('Manual refresh clicked');
                // Force reload by clearing the loading flag first
                this.isLoadingFiles = false;
                this.loadFiles();
            });
        }
        
        // Editor controls
        const addRow = document.getElementById('add-row');
        if (addRow) addRow.addEventListener('click', () => this.addNewRow());
        
        const deleteSelected = document.getElementById('delete-selected');
        if (deleteSelected) deleteSelected.addEventListener('click', () => this.deleteSelectedRows());
        
        const selectAll = document.getElementById('select-all');
        if (selectAll) selectAll.addEventListener('click', () => this.toggleSelectAll());
        
        // Save/Discard actions
        const saveChanges = document.getElementById('save-changes');
        if (saveChanges) {
            console.log('Save Changes button found, adding event listener');
            // Use direct onclick approach like the test button
            saveChanges.onclick = (e) => {
                e.preventDefault();
                console.log('Save Changes button clicked via onclick!');
                this.showReasonSection();
            };
        } else {
            console.error('Save Changes button not found!');
        }
        
        // Test button removed - Save Changes button should now work
        
        const discardChanges = document.getElementById('discard-changes');
        if (discardChanges) discardChanges.addEventListener('click', () => this.discardChanges());
        
        const previewChanges = document.getElementById('preview-changes');
        if (previewChanges) previewChanges.addEventListener('click', () => this.previewChanges());
        
        // Modification reason form handlers
        const applyModificationsBtn = document.getElementById('apply-modifications');
        if (applyModificationsBtn) {
            applyModificationsBtn.addEventListener('click', () => this.applyModifications());
        }
        
        const cancelModificationBtn = document.getElementById('cancel-modification');
        if (cancelModificationBtn) {
            cancelModificationBtn.addEventListener('click', () => {
                this.hideReasonSection();
                // Show editor section again
                const editorSection = document.getElementById('editor-section');
                if (editorSection) editorSection.style.display = 'block';
            });
        }
        
        // Validate form when reason or details change
        const modificationReason = document.getElementById('modification-reason');
        if (modificationReason) {
            modificationReason.addEventListener('change', () => this.validateModificationForm());
        }
        
        const modificationDetails = document.getElementById('modification-details');
        if (modificationDetails) {
            modificationDetails.addEventListener('input', () => this.validateModificationForm());
        }
        
        // Selection reason (for backward compatibility)
        const selectionReason = document.getElementById('selection-reason');
        if (selectionReason) selectionReason.addEventListener('change', () => this.validateReasonForm());
        
        const selectionDetails = document.getElementById('selection-details');
        if (selectionDetails) selectionDetails.addEventListener('input', () => this.validateReasonForm());
        
        // Notification close
        const notificationClose = document.getElementById('notification-close');
        if (notificationClose) notificationClose.addEventListener('click', () => this.hideNotification());
    }
    
    async loadFiles() {
        // Prevent multiple simultaneous load operations
        if (this.isLoadingFiles) {
            console.log('Files already loading, skipping duplicate call');
            return;
        }
        
        console.log('loadFiles() called');
        const filesList = document.getElementById('files-list');
        console.log('filesList element:', filesList);
        
        if (!filesList) {
            console.error('files-list element not found!');
            return;
        }
        
        // Clear any existing loading states first
        this.clearLoadingState();
        
        // Set loading flag
        this.isLoadingFiles = true;
        
        filesList.innerHTML = '<div class="loading" id="loading-indicator">Loading files...</div>';
        
        try {
            console.log('Loading files from /api/original-files...');
            
            // Add timeout to prevent infinite loading
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch('/api/original-files', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API response:', result);
            
            if (result.status === 'success') {
                const files = result.files || [];
                this.files = files; // Store files in class
                console.log('Files loaded:', files.length, 'files');
                
                // Nuclear option - stop ALL animations immediately
                const allElements = document.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.animation = 'none !important';
                    element.style.transform = 'none !important';
                    element.classList.remove('loading');
                });
                
                // Force clear loading indicator
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    console.log('Removing loading indicator element');
                    loadingIndicator.remove();
                }
                
                this.clearLoadingState(); // Clear loading state before rendering
                this.renderFiles(files);
            } else {
                console.error('API returned error:', result);
                filesList.innerHTML = '<div class="error">Error loading files: ' + (result.error || 'Unknown error') + '</div>';
            }
        } catch (error) {
            console.error('Error loading files:', error);
            if (error.name === 'AbortError') {
                filesList.innerHTML = '<div class="error">Request timed out. Please try again.</div>';
            } else {
                filesList.innerHTML = '<div class="error">Error loading files: ' + error.message + '</div>';
            }
            
            // Add a retry button
            filesList.innerHTML += '<div style="margin-top: 10px;"><button onclick="clippingInterface.loadFiles()" class="btn-primary">Retry</button></div>';
        } finally {
            // Clear loading flag and force clear loading state
            this.isLoadingFiles = false;
            this.clearLoadingState();
        }
    }
    
    renderFiles(files) {
        console.log('renderFiles() called with', files.length, 'files');
        const filesList = document.getElementById('files-list');
        console.log('filesList element in renderFiles:', filesList);
        
        // Clear any loading indicators
        this.isLoadingFiles = false;
        
        // Nuclear option - stop ALL animations immediately
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.style.animation = 'none !important';
            element.style.transform = 'none !important';
            element.classList.remove('loading');
        });
        
        // Force clear any loading elements
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            console.log('Removing loading indicator in renderFiles');
            loadingIndicator.remove();
        }
        
        this.clearLoadingState();
        
        if (files.length === 0) {
            console.log('No files to render');
            filesList.innerHTML = '<div class="no-files">No files available for clipping</div>';
            return;
        }
        
        // Completely replace content to ensure no loading state remains
        const filesGrid = document.createElement('div');
        filesGrid.className = 'files-grid';
        
        files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.setAttribute('data-file-id', file.id);
            
            fileCard.innerHTML = `
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <h4 class="file-name">${file.file_name}</h4>
                    <p class="file-size">${this.formatFileSize(file.file_size)}</p>
                    <p class="file-date">${new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <div class="file-actions">
                    <button class="btn-primary btn-sm" onclick="clippingInterface.openFile(${file.id})">
                        ✂️ Open for Editing
                    </button>
                </div>
            `;
            
            filesGrid.appendChild(fileCard);
        });
        
        // Clear and replace content
        filesList.innerHTML = '';
        filesList.appendChild(filesGrid);
        
        // Force make files list visible
        filesList.style.display = 'block';
        filesList.style.visibility = 'visible';
        filesList.style.opacity = '1';
        console.log('Files list should now be visible');
    }
    
    filterFiles(searchTerm) {
        const fileCards = document.querySelectorAll('.file-card');
        const term = searchTerm.toLowerCase();
        
        fileCards.forEach(card => {
            const fileName = card.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    async openFile(fileId) {
        try {
            console.log('Opening file for editing:', fileId);
            this.showNotification('Loading file for editing...', 'info');
            
            // Show loading indicator in files list
            const filesList = document.getElementById('files-list');
            if (filesList) {
                filesList.innerHTML = '<div class="loading" id="file-loading-indicator">Loading file content...</div>';
            }
            
            const response = await fetch(`/api/original-files/${fileId}/clipping`);
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API response data:', result);
            
            if (result.status === 'success') {
                this.currentFile = result.file;
                this.originalData = result.content;
                
                console.log('File loaded successfully, processing data...');
                console.log('File data:', this.currentFile);
                console.log('Content length:', this.originalData ? this.originalData.length : 'No content');
                
                // Load cell annotations for this file
                await this.loadCellAnnotations(fileId);
                
                // Show processing indicator
                this.showNotification('Processing file data...', 'info');
                
                // Use setTimeout to break up the processing and prevent UI blocking
                setTimeout(() => {
                    try {
                        // For very large files, use a more efficient approach
                        const dataLength = this.originalData.length;
                        console.log('Processing', dataLength, 'rows of data...');
                        
                        if (dataLength > 5000) {
                            console.log('Very large file detected, using reference copy for performance');
                            // For very large files, don't deep copy initially
                            this.modifiedData = this.originalData;
                        } else {
                            // For smaller files, use deep copy
                            this.modifiedData = JSON.parse(JSON.stringify(this.originalData));
                        }
                        
                        this.hasChanges = false;
                        this.selectedRows.clear();
                        
                        console.log('Data processed, rendering table...');
                        
                        // Stop all animations before showing editor
                        const allElements = document.querySelectorAll('*');
                        allElements.forEach(element => {
                            element.style.animation = 'none !important';
                            element.style.transform = 'none !important';
                            element.classList.remove('loading');
                        });
                        
                        // Clear the file loading indicator
                        const fileLoadingIndicator = document.getElementById('file-loading-indicator');
                        if (fileLoadingIndicator) {
                            fileLoadingIndicator.remove();
                        }
                        
                        this.showEditor();
                        
                        // Render table in chunks to prevent browser hang
                        this.renderCSVTableChunked();
                        this.updateFileInfo();
                        this.showNotification('File opened for editing successfully', 'success');
                    } catch (processingError) {
                        console.error('Error processing file data:', processingError);
                        this.showNotification('Error processing file data', 'error');
                    }
                }, 200); // Longer delay for processing
            } else {
                console.error('API returned error:', result.error);
                
                // Stop animations and clear loading state on error
                const allElements = document.querySelectorAll('*');
                allElements.forEach(element => {
                    element.style.animation = 'none !important';
                    element.style.transform = 'none !important';
                    element.classList.remove('loading');
                });
                
                const fileLoadingIndicator = document.getElementById('file-loading-indicator');
                if (fileLoadingIndicator) {
                    fileLoadingIndicator.remove();
                }
                
                this.showNotification('Error loading file: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error opening file:', error);
            
            // Stop animations and clear loading state on error
            const allElements = document.querySelectorAll('*');
            allElements.forEach(element => {
                element.style.animation = 'none !important';
                element.style.transform = 'none !important';
                element.classList.remove('loading');
            });
            
            const fileLoadingIndicator = document.getElementById('file-loading-indicator');
            if (fileLoadingIndicator) {
                fileLoadingIndicator.remove();
            }
            
            this.showNotification('Error opening file: ' + error.message, 'error');
        }
    }
    
    showEditor() {
        console.log('Showing editor section');
        const editorSection = document.getElementById('editor-section');
        const selectionSection = document.getElementById('selection-summary-section');
        
        if (!editorSection) {
            console.error('editor-section element not found!');
            return;
        }
        
        if (!selectionSection) {
            console.error('selection-summary-section element not found!');
            return;
        }
        
        editorSection.style.display = 'block';
        editorSection.style.visibility = 'visible';
        editorSection.style.opacity = '1';
        editorSection.style.position = 'relative';
        editorSection.style.zIndex = '1';
        selectionSection.style.display = 'none';
        console.log('Editor section should now be visible');
        console.log('Editor section display style:', window.getComputedStyle(editorSection).display);
        console.log('Editor section visibility:', window.getComputedStyle(editorSection).visibility);
        console.log('Editor section opacity:', window.getComputedStyle(editorSection).opacity);
        console.log('Editor section position:', window.getComputedStyle(editorSection).position);
    }
    
    hideEditor() {
        document.getElementById('editor-section').style.display = 'none';
    }
    
    showReasonSection() {
        console.log('showReasonSection() called');
        const reasonSection = document.getElementById('selection-summary-section');
        
        if (!reasonSection) {
            console.error('selection-summary-section element not found!');
            return;
        }
        
        // Hide editor section and show reason form
        const editorSection = document.getElementById('editor-section');
        if (editorSection) editorSection.style.display = 'none';
        
        reasonSection.style.display = 'block';
        reasonSection.classList.remove('hidden');
        console.log('Selection summary section should now be visible');
        this.validateModificationForm();
    }
    
    hideReasonSection() {
        const reasonSection = document.getElementById('selection-summary-section');
        if (reasonSection) {
            reasonSection.style.display = 'none';
            reasonSection.classList.add('hidden');
        }
        // Show editor section again
        const editorSection = document.getElementById('editor-section');
        if (editorSection) editorSection.style.display = 'block';
    }
    
    validateModificationForm() {
        console.log('validateModificationForm() called');
        const reasonElement = document.getElementById('modification-reason');
        const detailsElement = document.getElementById('modification-details');
        const applyBtn = document.getElementById('apply-modifications');
        
        if (!reasonElement) {
            console.error('modification-reason element not found!');
            return;
        }
        
        if (!applyBtn) {
            console.error('apply-modifications element not found!');
            return;
        }
        
        const reason = reasonElement.value;
        const details = detailsElement ? detailsElement.value.trim() : '';
        
        console.log('Reason:', reason);
        console.log('Details:', details);
        
        // Enable/disable apply button based on form validity
        applyBtn.disabled = !reason || (reason === 'other' && !details);
        console.log('Apply button disabled:', applyBtn.disabled);
        
        // Update button style based on disabled state
        if (applyBtn.disabled) {
            applyBtn.style.opacity = '0.6';
            applyBtn.style.cursor = 'not-allowed';
        } else {
            applyBtn.style.opacity = '1';
            applyBtn.style.cursor = 'pointer';
        }
    }
    
    renderCSVTable() {
        // Prevent rendering conflicts
        if (this.isProcessing) {
            console.log('Skipping table render - operation in progress');
            return;
        }
        
        console.log('renderCSVTable() called');
        const header = document.getElementById('csv-header');
        const body = document.getElementById('csv-body');
        
        if (!header) {
            console.error('csv-header element not found!');
            return;
        }
        
        if (!body) {
            console.error('csv-body element not found!');
            return;
        }
        
        console.log('Modified data:', this.modifiedData);
        console.log('Data length:', this.modifiedData ? this.modifiedData.length : 'No data');
        
        if (!this.modifiedData || this.modifiedData.length === 0) {
            console.log('No data available, showing empty table');
            header.innerHTML = '<tr><th>No data available</th></tr>';
            body.innerHTML = '';
            return;
        }
        
        // Render header
        const headers = Object.keys(this.modifiedData[0]);
        console.log('Headers found:', headers);
        
        header.innerHTML = `
            <tr>
                <th class="row-number-header">Row #</th>
                <th class="select-column">
                    <input type="checkbox" id="select-all-checkbox" onchange="clippingInterface.toggleSelectAll()">
                </th>
                ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        `;
        console.log('Header rendered');
        
        // Render body
        const bodyHTML = this.modifiedData.map((row, index) => `
            <tr data-row-index="${index}" class="${this.selectedRows.has(index) ? 'selected' : ''}">
                <td class="row-number">${index + 1}</td>
                <td class="select-column">
                    <input type="checkbox" class="row-checkbox" 
                           data-row-index="${index}" 
                           onchange="clippingInterface.toggleRowSelection(${index})"
                           ${this.selectedRows.has(index) ? 'checked' : ''}>
                </td>
                ${headers.map(h => {
                    const cellKey = `${index}_${h}`;
                    const annotation = this.cellAnnotations.get(cellKey);
                    const bgColor = annotation ? annotation.color_code : '';
                    const hasAnnotation = annotation ? 'data-annotated="true"' : '';
                    const title = annotation ? `Annotated by ${annotation.user_name}: ${annotation.explanation}` : 'Click to annotate this cell';
                    
                    return `<td 
                        contenteditable="true" 
                        data-row="${index}" 
                        data-column="${h}"
                        data-cell-key="${cellKey}"
                        style="background-color: ${bgColor};${annotation ? ' border-left: 3px solid #007bff; font-weight: 500;' : ''}"
                        ${hasAnnotation}
                        onclick="clippingInterface.onCellClick(${index}, '${h}', this)"
                        onblur="clippingInterface.onCellEdit(${index}, '${h}', this.textContent)"
                        title="${title}">
                        ${row[h] || ''}
                    </td>`;
                }).join('')}
            </tr>
        `).join('');
        
        body.innerHTML = bodyHTML;
        console.log('Body rendered with', this.modifiedData.length, 'rows');
        
        // Check if table is visible
        const table = document.getElementById('csv-table');
        if (table) {
            console.log('Table element found:', table);
            console.log('Table display style:', window.getComputedStyle(table).display);
            console.log('Table visibility:', window.getComputedStyle(table).visibility);
            console.log('Table has content:', table.innerHTML.length > 0);
            
            // Add a visible test indicator
            table.style.border = '2px solid red';
            table.style.backgroundColor = '#f0f0f0';
        } else {
            console.error('csv-table element not found!');
        }
        
        this.updateRowCounts();
    }
    
    renderCSVTableChunked() {
        console.log('renderCSVTableChunked() called');
        const header = document.getElementById('csv-header');
        const body = document.getElementById('csv-body');
        
        if (!header) {
            console.error('csv-header element not found!');
            return;
        }
        
        if (!body) {
            console.error('csv-body element not found!');
            return;
        }
        
        console.log('Modified data:', this.modifiedData);
        console.log('Data length:', this.modifiedData ? this.modifiedData.length : 'No data');
        
        if (!this.modifiedData || this.modifiedData.length === 0) {
            console.log('No data available, showing empty table');
            header.innerHTML = '<tr><th>No data available</th></tr>';
            body.innerHTML = '';
            return;
        }
        
        // Render header first
        const headers = Object.keys(this.modifiedData[0]);
        console.log('Headers found:', headers);
        
        header.innerHTML = `
            <tr>
                <th class="row-number-header">Row #</th>
                <th class="select-column">
                    <input type="checkbox" id="select-all-checkbox" onchange="clippingInterface.toggleSelectAll()">
                </th>
                ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        `;
        console.log('Header rendered');
        
        // Clear body and show loading
        body.innerHTML = '<tr><td colspan="' + (headers.length + 2) + '">Loading data...</td></tr>';
        
        // For very large files, use virtual scrolling approach
        const totalRows = this.modifiedData.length;
        if (totalRows > 1000) {
            console.log('Large file detected, using virtual scrolling approach');
            this.renderVirtualTable(headers, body);
            return;
        }
        
        // Render body in smaller chunks to prevent browser hang
        const chunkSize = 25; // Process only 25 rows at a time
        let currentChunk = 0;
        
        const renderChunk = () => {
            const startIndex = currentChunk * chunkSize;
            const endIndex = Math.min(startIndex + chunkSize, this.modifiedData.length);
            
            if (startIndex >= this.modifiedData.length) {
                // All chunks rendered
                console.log('All chunks rendered');
                this.updateRowCounts();
                return;
            }
            
            const chunkHTML = this.modifiedData.slice(startIndex, endIndex).map((row, index) => {
                const actualIndex = startIndex + index;
                return `
                    <tr data-row-index="${actualIndex}" class="${this.selectedRows.has(actualIndex) ? 'selected' : ''}">
                        <td class="row-number">${actualIndex + 1}</td>
                        <td class="select-column">
                            <input type="checkbox" class="row-checkbox" 
                                   data-row-index="${actualIndex}" 
                                   onchange="clippingInterface.toggleRowSelection(${actualIndex})"
                                   ${this.selectedRows.has(actualIndex) ? 'checked' : ''}>
                        </td>
                        ${headers.map(h => {
                            const cellKey = `${actualIndex}_${h}`;
                            const annotation = this.cellAnnotations.get(cellKey);
                            const bgColor = annotation ? annotation.color_code : '';
                            const hasAnnotation = annotation ? 'data-annotated="true"' : '';
                            const title = annotation ? `Annotated by ${annotation.user_name}: ${annotation.explanation}` : 'Click to annotate this cell';
                            
                            return `<td 
                                contenteditable="true" 
                                data-row="${actualIndex}" 
                                data-column="${h}"
                                data-cell-key="${cellKey}"
                                style="background-color: ${bgColor};${annotation ? ' border-left: 3px solid #007bff; font-weight: 500;' : ''}"
                                ${hasAnnotation}
                                onclick="clippingInterface.onCellClick(${actualIndex}, '${h}', this)"
                                onblur="clippingInterface.onCellEdit(${actualIndex}, '${h}', this.textContent)"
                                title="${title}">
                                ${row[h] || ''}
                            </td>`;
                        }).join('')}
                    </tr>
                `;
            }).join('');
            
            if (currentChunk === 0) {
                body.innerHTML = chunkHTML;
            } else {
                body.innerHTML += chunkHTML;
            }
            
            currentChunk++;
            
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                setTimeout(renderChunk, 50); // Longer delay between chunks
            });
        };
        
        // Start rendering chunks
        renderChunk();
    }
    
    renderVirtualTable(headers, body) {
        console.log('renderVirtualTable() called for large file');
        
        // For very large files, only show first 100 rows with pagination
        const visibleRows = 100;
        const totalRows = this.modifiedData.length;
        
        body.innerHTML = `
            <tr>
                <td colspan="${headers.length + 2}" style="text-align: center; padding: 20px; background-color: #f8f9fa;">
                    <div style="margin-bottom: 15px;">
                        <strong>Large File Detected (${totalRows} rows)</strong>
                    </div>
                    <div style="margin-bottom: 15px;">
                        Showing first ${visibleRows} rows for performance. Use range selection to work with specific data.
                    </div>
                    <div style="margin-bottom: 15px;">
                        <button onclick="clippingInterface.loadMoreRows()" class="btn-primary">Load More Rows</button>
                        <button onclick="clippingInterface.showAllRows()" class="btn-secondary">Show All (May be slow)</button>
                    </div>
                </td>
            </tr>
        `;
        
        // Render first 100 rows
        const firstChunk = this.modifiedData.slice(0, visibleRows);
        const chunkHTML = firstChunk.map((row, index) => `
            <tr data-row-index="${index}" class="${this.selectedRows.has(index) ? 'selected' : ''}">
                <td class="row-number">${index + 1}</td>
                <td class="select-column">
                    <input type="checkbox" class="row-checkbox" 
                           data-row-index="${index}" 
                           onchange="clippingInterface.toggleRowSelection(${index})"
                           ${this.selectedRows.has(index) ? 'checked' : ''}>
                </td>
                ${headers.map(h => {
                    const cellKey = `${index}_${h}`;
                    const annotation = this.cellAnnotations.get(cellKey);
                    const bgColor = annotation ? annotation.color_code : '';
                    const hasAnnotation = annotation ? 'data-annotated="true"' : '';
                    const title = annotation ? `Annotated by ${annotation.user_name}: ${annotation.explanation}` : 'Click to annotate this cell';
                    
                    return `<td 
                        contenteditable="true" 
                        data-row="${index}" 
                        data-column="${h}"
                        data-cell-key="${cellKey}"
                        style="background-color: ${bgColor};${annotation ? ' border-left: 3px solid #007bff; font-weight: 500;' : ''}"
                        ${hasAnnotation}
                        onclick="clippingInterface.onCellClick(${index}, '${h}', this)"
                        onblur="clippingInterface.onCellEdit(${index}, '${h}', this.textContent)"
                        title="${title}">
                        ${row[h] || ''}
                    </td>`;
                }).join('')}
            </tr>
        `).join('');
        
        body.innerHTML += chunkHTML;
        
        // Store virtual table state
        this.virtualTable = {
            visibleRows: visibleRows,
            totalRows: totalRows,
            headers: headers
        };
        
        this.updateRowCounts();
    }
    
    loadMoreRows() {
        if (!this.virtualTable) return;
        
        const { visibleRows, totalRows, headers } = this.virtualTable;
        const newVisibleRows = Math.min(visibleRows + 100, totalRows);
        
        if (newVisibleRows === visibleRows) {
            this.showNotification('All rows are already visible', 'info');
            return;
        }
        
        const body = document.getElementById('csv-body');
        if (!body) return;
        
        // Remove the info row
        const infoRow = body.querySelector('tr:first-child');
        if (infoRow) infoRow.remove();
        
        // Add more rows
        const additionalRows = this.modifiedData.slice(visibleRows, newVisibleRows);
        const chunkHTML = additionalRows.map((row, index) => {
            const actualIndex = visibleRows + index;
            return `
                <tr data-row-index="${actualIndex}" class="${this.selectedRows.has(actualIndex) ? 'selected' : ''}">
                    <td class="select-column">
                        <input type="checkbox" class="row-checkbox" 
                               data-row-index="${actualIndex}" 
                               onchange="clippingInterface.toggleRowSelection(${actualIndex})"
                               ${this.selectedRows.has(actualIndex) ? 'checked' : ''}>
                    </td>
                    ${headers.map(h => `<td contenteditable="true" onblur="clippingInterface.onCellEdit(${actualIndex}, '${h}', this.textContent)">${row[h] || ''}</td>`).join('')}
                </tr>
            `;
        }).join('');
        
        body.innerHTML += chunkHTML;
        
        // Update virtual table state
        this.virtualTable.visibleRows = newVisibleRows;
        
        this.showNotification(`Loaded ${newVisibleRows} of ${totalRows} rows`, 'success');
    }
    
    showAllRows() {
        if (!this.virtualTable) return;
        
        this.showNotification('Loading all rows... This may take a moment.', 'info');
        
        // Use the chunked rendering for all rows
        setTimeout(() => {
            this.renderCSVTableChunked();
            this.virtualTable = null; // Clear virtual table state
        }, 100);
    }
    
    toggleRowSelection(rowIndex) {
        if (this.selectedRows.has(rowIndex)) {
            this.selectedRows.delete(rowIndex);
        } else {
            this.selectedRows.add(rowIndex);
        }
        
        this.updateRowSelection(rowIndex);
        this.updateRowCounts();
        this.updateEditorButtons();
    }
    
    updateRowSelection(rowIndex) {
        const row = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
        const checkbox = document.querySelector(`input[data-row-index="${rowIndex}"]`);
        
        if (this.selectedRows.has(rowIndex)) {
            row.classList.add('selected');
            checkbox.checked = true;
        } else {
            row.classList.remove('selected');
            checkbox.checked = false;
        }
    }
    
    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        
        if (selectAllCheckbox.checked) {
            // Select all
            this.selectedRows.clear();
            allCheckboxes.forEach((checkbox, index) => {
                this.selectedRows.add(index);
                this.updateRowSelection(index);
            });
        } else {
            // Deselect all
            this.selectedRows.clear();
            allCheckboxes.forEach((checkbox, index) => {
                this.updateRowSelection(index);
            });
        }
        
        this.updateRowCounts();
        this.updateEditorButtons();
    }
    
    addNewRow() {
        if (!this.modifiedData || this.modifiedData.length === 0) return;
        
        const headers = Object.keys(this.modifiedData[0]);
        const newRow = {};
        headers.forEach(h => {
            newRow[h] = '';
        });
        
        this.modifiedData.push(newRow);
        this.hasChanges = true;
        this.renderCSVTable();
        this.updateEditorButtons();
    }
    
    deleteSelectedRows() {
        if (this.selectedRows.size === 0) {
            this.showNotification('No rows selected for deletion', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${this.selectedRows.size} row(s)?`)) {
            return;
        }
        
        // Delete rows in reverse order to maintain indices
        const sortedIndices = Array.from(this.selectedRows).sort((a, b) => b - a);
        sortedIndices.forEach(index => {
            this.modifiedData.splice(index, 1);
        });
        
        this.selectedRows.clear();
        this.hasChanges = true;
        this.renderCSVTable();
        this.updateEditorButtons();
        this.showNotification(`${sortedIndices.length} row(s) deleted`, 'success');
    }
    
    onCellEdit(rowIndex, column, newValue) {
        if (this.modifiedData[rowIndex][column] !== newValue) {
            this.modifiedData[rowIndex][column] = newValue;
            this.hasChanges = true;
            this.updateEditorButtons();
        }
    }
    
    async onCellClick(rowIndex, column, cellElement) {
        // Check if already annotated
        const cellKey = `${rowIndex}_${column}`;
        const existingAnnotation = this.cellAnnotations.get(cellKey);
        
        // Show modal/prompt for annotation
        const explanation = await this.promptCellAnnotation(
            existingAnnotation,
            rowIndex,
            column
        );
        
        if (explanation && explanation.trim()) {
            // Get user info from session
            const userInfo = await this.getCurrentUserInfo();
            
            // Create annotation object
            const annotation = {
                row_index: rowIndex,
                column_name: column,
                user_name: userInfo.full_name || userInfo.name || 'Unknown User',
                user_email: userInfo.email || '',
                user_id: userInfo.user_id || null,
                explanation: explanation.trim(),
                color_code: this.getColorForAnnotation(existingAnnotation),
                timestamp: new Date().toISOString()
            };
            
            // Store annotation
            this.cellAnnotations.set(cellKey, annotation);
            
            // Update cell appearance
            cellElement.style.backgroundColor = annotation.color_code;
            cellElement.setAttribute('data-annotated', 'true');
            cellElement.title = `Annotated by ${annotation.user_name}: ${annotation.explanation}`;
            
            // Send to backend to store in database and update fingerprint
            await this.saveCellAnnotation(annotation);
        }
    }
    
    promptCellAnnotation(existingAnnotation, rowIndex, column) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'annotation-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                ">
                    <h3 style="margin-top: 0;">Annotate Cell (Row ${rowIndex + 1}, Column: ${column})</h3>
                    ${existingAnnotation ? 
                        `<div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                            <p style="margin: 0 0 5px 0;"><strong>Previous annotation:</strong></p>
                            <p style="margin: 0 0 5px 0;">${existingAnnotation.explanation}</p>
                            <p style="margin: 0; font-size: 0.9em; color: #666;">
                                By: ${existingAnnotation.user_name} 
                                (${new Date(existingAnnotation.timestamp).toLocaleString()})
                            </p>
                        </div>` 
                        : ''}
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                        Explanation for clicking this cell:
                    </label>
                    <textarea id="annotation-explanation" rows="4" 
                        placeholder="e.g., 'Outlier detected', 'Data correction needed', 'Verified value', etc."
                        style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px; margin: 10px 0; font-family: inherit; resize: vertical;"
                    >${existingAnnotation?.explanation || ''}</textarea>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
                        <button onclick="
                            const modal = this.closest('.annotation-modal');
                            modal.remove();
                            window.clippingInterfaceAnnotationResolve(null);
                        " style="
                            padding: 8px 16px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            background: white;
                            cursor: pointer;
                        ">Cancel</button>
                        <button onclick="
                            const explanation = document.getElementById('annotation-explanation').value.trim();
                            if (explanation) {
                                const modal = this.closest('.annotation-modal');
                                modal.remove();
                                window.clippingInterfaceAnnotationResolve(explanation);
                            } else {
                                alert('Please provide an explanation');
                            }
                        " style="
                            padding: 8px 16px;
                            border: 1px solid #007bff;
                            border-radius: 4px;
                            background: #007bff;
                            color: white;
                            cursor: pointer;
                        ">Save Annotation</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Store resolve function globally so button can access it
            window.clippingInterfaceAnnotationResolve = resolve;
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    delete window.clippingInterfaceAnnotationResolve;
                    resolve(null);
                }
            });
        });
    }
    
    getColorForAnnotation(existingAnnotation) {
        // Color coding based on annotation type or sequential colors
        if (existingAnnotation) {
            // Return existing color or next in sequence
            return existingAnnotation.color_code;
        }
        // Color palette for annotations
        const colors = ['#ffffcc', '#ffe6cc', '#ffcccc', '#ccffcc', '#ccccff', '#ffccff'];
        const annotationCount = this.cellAnnotations.size;
        return colors[annotationCount % colors.length];
    }
    
    async getCurrentUserInfo() {
        try {
            // Try to get session token
            const urlParams = new URLSearchParams(window.location.search);
            let sessionToken = urlParams.get('session_token');
            if (!sessionToken) {
                sessionToken = localStorage.getItem('session_token') || sessionStorage.getItem('session_token');
            }
            
            const headers = {};
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            
            const response = await fetch('/api/current-user', { headers });
            const data = await response.json();
            
            if (data.success) {
                return {
                    user_id: data.user_id,
                    full_name: data.full_name || 'Unknown User',
                    name: data.full_name || data.username || 'Unknown User',
                    email: data.email || '',
                    username: data.username || 'unknown'
                };
            } else {
                return { user_id: null, full_name: 'Unknown User', name: 'Unknown User', email: '', username: 'unknown' };
            }
        } catch (error) {
            console.error('Error getting user info:', error);
            return { user_id: null, full_name: 'Unknown User', name: 'Unknown User', email: '', username: 'unknown' };
        }
    }
    
    async saveCellAnnotation(annotation) {
        try {
            if (!this.currentFile || !this.currentFile.id) {
                console.error('No current file to save annotation to');
                this.showNotification('Error: No file selected', 'error');
                return;
            }
            
            // Get session token
            const urlParams = new URLSearchParams(window.location.search);
            let sessionToken = urlParams.get('session_token');
            if (!sessionToken) {
                sessionToken = localStorage.getItem('session_token') || sessionStorage.getItem('session_token');
            }
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            
            const response = await fetch('/api/csv-cell-annotation', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    file_id: this.currentFile.id,
                    ...annotation
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification('Cell annotation saved', 'success');
            } else {
                this.showNotification('Error saving annotation: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving annotation:', error);
            this.showNotification('Error saving annotation', 'error');
        }
    }
    
    async loadCellAnnotations(fileId) {
        try {
            const response = await fetch(`/api/csv-cell-annotations/${fileId}`);
            const data = await response.json();
            
            if (data.success && data.annotations) {
                this.cellAnnotations = new Map();
                data.annotations.forEach(ann => {
                    const cellKey = `${ann.row_index}_${ann.column_name}`;
                    this.cellAnnotations.set(cellKey, ann);
                });
                console.log(`Loaded ${data.annotations.length} cell annotations`);
            }
        } catch (error) {
            console.error('Error loading annotations:', error);
        }
    }
    
    updateRowCounts() {
        const rowCountElement = document.getElementById('row-count');
        const selectedCountElement = document.getElementById('selected-count');
        
        if (rowCountElement) {
            rowCountElement.textContent = this.modifiedData ? this.modifiedData.length : 0;
        }
        
        if (selectedCountElement) {
            selectedCountElement.textContent = this.selectedRows.size;
        }
    }
    
    updateEditorButtons() {
        const saveBtn = document.getElementById('save-changes');
        const discardBtn = document.getElementById('discard-changes');
        const previewBtn = document.getElementById('preview-changes');
        const deleteBtn = document.getElementById('delete-selected');
        
        console.log('updateEditorButtons called - hasChanges:', this.hasChanges);
        console.log('saveBtn found:', !!saveBtn);
        
        if (saveBtn) {
            saveBtn.disabled = !this.hasChanges;
            console.log('Save button disabled:', saveBtn.disabled);
        }
        if (discardBtn) discardBtn.disabled = !this.hasChanges;
        if (previewBtn) previewBtn.disabled = !this.hasChanges;
        if (deleteBtn) deleteBtn.disabled = this.selectedRows.size === 0;
    }
    
    updateFileInfo() {
        console.log('updateFileInfo() called');
        const fileNameElement = document.getElementById('current-file-name');
        const fileDetailsElement = document.getElementById('current-file-details');
        
        if (!fileNameElement) {
            console.error('current-file-name element not found!');
            return;
        }
        
        if (!fileDetailsElement) {
            console.error('current-file-details element not found!');
            return;
        }
        
        if (!this.currentFile) {
            console.error('No current file data available!');
            return;
        }
        
        fileNameElement.textContent = this.currentFile.file_name;
        fileDetailsElement.textContent = 
            `Size: ${this.formatFileSize(this.currentFile.file_size)} | Uploaded: ${new Date(this.currentFile.created_at).toLocaleDateString()}`;
        
        console.log('File info updated successfully');
    }
    
    discardChanges() {
        if (!confirm('Are you sure you want to discard all changes?')) {
            return;
        }
        
        this.modifiedData = JSON.parse(JSON.stringify(this.originalData));
        this.hasChanges = false;
        this.selectedRows.clear();
        this.renderCSVTable();
        this.updateEditorButtons();
        this.showNotification('Changes discarded', 'info');
    }
    
    previewChanges() {
        const changes = this.calculateChanges();
        const preview = `
            Changes Summary:
            - Rows modified: ${changes.modifiedRows}
            - Rows added: ${changes.addedRows}
            - Rows deleted: ${changes.deletedRows}
            - Total changes: ${changes.totalChanges}
        `;
        
        alert(preview);
    }
    
    calculateChanges() {
        const originalLength = this.originalData.length;
        const modifiedLength = this.modifiedData.length;
        
        let modifiedRows = 0;
        for (let i = 0; i < Math.min(originalLength, modifiedLength); i++) {
            if (JSON.stringify(this.originalData[i]) !== JSON.stringify(this.modifiedData[i])) {
                modifiedRows++;
            }
        }
        
        return {
            modifiedRows,
            addedRows: Math.max(0, modifiedLength - originalLength),
            deletedRows: Math.max(0, originalLength - modifiedLength),
            totalChanges: modifiedRows + Math.abs(modifiedLength - originalLength)
        };
    }
    
    validateReasonForm() {
        console.log('validateReasonForm() called');
        const reasonElement = document.getElementById('selection-reason');
        const detailsElement = document.getElementById('selection-details');
        const applyBtn = document.getElementById('create-analysis-dataset');
        
        if (!reasonElement) {
            console.error('selection-reason element not found!');
            return;
        }
        
        if (!detailsElement) {
            console.error('selection-details element not found!');
            return;
        }
        
        if (!applyBtn) {
            console.error('create-analysis-dataset element not found!');
            return;
        }
        
        const reason = reasonElement.value;
        const details = detailsElement.value.trim();
        
        console.log('Reason:', reason);
        console.log('Details:', details);
        
        applyBtn.disabled = !reason || (reason === 'other' && !details);
        console.log('Apply button disabled:', applyBtn.disabled);
    }
    
    async applyModifications() {
        const reason = document.getElementById('modification-reason').value;
        const details = document.getElementById('modification-details').value.trim();
        
        if (!reason) {
            this.showNotification('Please select a modification reason', 'error');
            return;
        }
        
        if (reason === 'other' && !details) {
            this.showNotification('Please provide details for "Other" reason', 'error');
            return;
        }
        
        try {
            this.showNotification('Applying modifications...', 'info');
            
            // Convert modified data back to CSV format
            const csvContent = this.convertToCSV(this.modifiedData);
            
            console.log('📤 Sending clipping request:', {
                fileId: this.currentFile.id,
                fileName: this.currentFile.file_name,
                contentLength: csvContent.length,
                reason: reason,
                hasDetails: !!details,
                sessionToken: this.getSessionToken() ? 'Found' : 'Missing'
            });
            
            const response = await fetch(`/api/original-files/${this.currentFile.id}/apply-clipping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getSessionToken()}`
                },
                body: JSON.stringify({
                    modified_content: csvContent,
                    modification_reason: reason,
                    modification_details: details
                })
            });
            
            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            // Check if response has content
            const contentType = response.headers.get('content-type');
            console.log('📥 Response content-type:', contentType);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                    console.error('❌ Server error response (text):', errorText);
                    try {
                        const errorData = JSON.parse(errorText);
                        console.error('❌ Server error response (parsed):', errorData);
                        this.showNotification('Error applying modifications: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
                    } catch {
                        this.showNotification(`Error applying modifications: HTTP ${response.status} - ${response.statusText}`, 'error');
                    }
                } catch (e) {
                    console.error('❌ Error reading error response:', e);
                    this.showNotification(`Error applying modifications: HTTP ${response.status} - ${response.statusText}`, 'error');
                }
                return;
            }
            
            // Try to parse JSON response
            let result;
            try {
                const responseText = await response.text();
                console.log('📥 Response text length:', responseText.length);
                console.log('📥 Response text (first 500 chars):', responseText.substring(0, 500));
                
                if (!responseText || responseText.trim() === '') {
                    console.error('❌ Response is empty!');
                    this.showNotification('Error: Server returned empty response', 'error');
                    return;
                }
                
                result = JSON.parse(responseText);
                console.log('📥 Response data (parsed):', result);
            } catch (parseError) {
                console.error('❌ Error parsing response:', parseError);
                console.error('❌ Response might not be JSON');
                this.showNotification('Error: Could not parse server response', 'error');
                return;
            }
            
            if (result.status === 'success') {
                console.log('✅ Save successful!', result);
                this.showNotification('Modifications applied successfully', 'success');
                this.hasChanges = false;
                this.hideReasonSection();
                this.updateEditorButtons();
                
                // Reset form
                const reasonField = document.getElementById('modification-reason');
                const detailsField = document.getElementById('modification-details');
                if (reasonField) reasonField.value = '';
                if (detailsField) detailsField.value = '';
                
                // Show editor section again
                const editorSection = document.getElementById('editor-section');
                if (editorSection) editorSection.style.display = 'block';
            } else {
                console.error('❌ Server returned error status:', result);
                this.showNotification('Error applying modifications: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error applying modifications:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            this.showNotification('Error applying modifications: ' + error.message, 'error');
        }
    }
    
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape values that contain commas or quotes
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    getSessionToken() {
        return localStorage.getItem('session_token') || '';
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getSessionToken()}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('session_token');
            window.location.href = '/main-dashboard';
        }
    }
    
    showNotification(message, type = 'info') {
        const banner = document.getElementById('notification-banner');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        banner.className = `notification-banner ${type}`;
        banner.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }
    
    hideNotification() {
        document.getElementById('notification-banner').style.display = 'none';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showCSVEditorGuide() {
        const modal = document.getElementById('csv-editor-guide-modal');
        modal.style.display = 'flex';
    }

    showEditingHelp() {
        this.showCSVEditorGuide();
    }

    checkForFileParameter() {
        // Check URL parameters for a specific file to open
        const urlParams = new URLSearchParams(window.location.search);
        const fileId = urlParams.get('file');
        
        console.log('Checking for file parameter...');
        console.log('URL search params:', window.location.search);
        console.log('File ID from URL:', fileId);
        
        if (fileId) {
            console.log('File ID found in URL:', fileId);
            // Wait a moment for files to load, then open the specified file
            setTimeout(() => {
                console.log('Attempting to open file:', fileId);
                console.log('Files loaded at this point:', this.files ? this.files.length : 'files not loaded yet');
                this.openFile(parseInt(fileId));
            }, 1000);
        } else {
            console.log('No file ID found in URL');
        }
    }

    // Range Selection Methods
    setStartToCurrent() {
        if (this.currentRowIndex !== null) {
            document.getElementById('start-row').value = this.currentRowIndex + 1;
            this.updateRangePreview();
            this.showNotification(`Start row set to ${this.currentRowIndex + 1}`, 'success');
        } else {
            this.showNotification('Please select a row first', 'warning');
        }
    }

    setEndToCurrent() {
        if (this.currentRowIndex !== null) {
            document.getElementById('end-row').value = this.currentRowIndex + 1;
            this.updateRangePreview();
            this.showNotification(`End row set to ${this.currentRowIndex + 1}`, 'success');
        } else {
            this.showNotification('Please select a row first', 'warning');
        }
    }

    debouncedUpdateRangePreview() {
        // Clear existing timeout
        if (this.rangePreviewTimeout) {
            clearTimeout(this.rangePreviewTimeout);
        }
        
        // Set new timeout
        this.rangePreviewTimeout = setTimeout(() => {
            this.updateRangePreview();
        }, 300); // 300ms delay
    }
    
    updateRangePreview() {
        const startRowElement = document.getElementById('start-row');
        const endRowElement = document.getElementById('end-row');
        const previewElement = document.getElementById('range-preview-text');
        
        if (!startRowElement || !endRowElement || !previewElement) {
            return;
        }
        
        const startRow = parseInt(startRowElement.value) || 0;
        const endRow = parseInt(endRowElement.value) || 0;
        const totalRows = this.modifiedData ? this.modifiedData.length : 0;
        
        if (startRow > 0 && endRow > 0) {
            if (startRow > endRow) {
                previewElement.textContent = '⚠️ Start row cannot be greater than end row';
            } else if (startRow > totalRows || endRow > totalRows) {
                previewElement.textContent = `⚠️ Row numbers cannot exceed total rows (${totalRows})`;
            } else {
                const includedRows = endRow - startRow + 1;
                const excludedBefore = startRow - 1;
                const excludedAfter = totalRows - endRow;
                previewElement.textContent = 
                    `✅ Rows ${startRow}-${endRow} (${includedRows} rows included, ${excludedBefore} before, ${excludedAfter} after)`;
            }
        } else {
            previewElement.textContent = 'No range selected';
        }
    }

    applyRangeSelection() {
        // Prevent multiple simultaneous operations
        if (this.isProcessing) {
            this.showNotification('Please wait for current operation to complete', 'warning');
            return;
        }
        
        const startRow = parseInt(document.getElementById('start-row').value);
        const endRow = parseInt(document.getElementById('end-row').value);
        
        if (!startRow || !endRow) {
            this.showNotification('Please specify both start and end rows', 'warning');
            return;
        }
        
        if (startRow > endRow) {
            this.showNotification('Start row cannot be greater than end row', 'error');
            return;
        }
        
        if (startRow < 1 || endRow > this.modifiedData.length) {
            this.showNotification(`Row numbers must be between 1 and ${this.modifiedData.length}`, 'error');
            return;
        }
        
        // Convert to 0-based indexing
        const startIndex = startRow - 1;
        const endIndex = endRow - 1;
        const totalRows = endIndex - startIndex + 1;
        
        console.log(`Applying range selection: ${totalRows} rows`);
        
        // Set processing flag and disable inputs
        this.isProcessing = true;
        this.disableRangeInputs(true);
        
        // Show processing indicator for large ranges
        if (totalRows > 1000) {
            this.showNotification(`Processing ${totalRows} rows... This may take a moment.`, 'info');
        }
        
        // Clear current selection
        this.selectedRows.clear();
        this.currentRange = { start: startRow, end: endRow };
        
        // For large ranges, use chunked processing
        if (totalRows > 1000) {
            this.applyRangeSelectionChunked(startIndex, endIndex, startRow, endRow);
        } else {
            // For smaller ranges, process immediately
            for (let i = startIndex; i <= endIndex; i++) {
                this.selectedRows.add(i);
            }
            this.finishRangeSelection(startRow, endRow);
        }
    }
    
    applyRangeSelectionChunked(startIndex, endIndex, startRow, endRow) {
        const chunkSize = 100; // Reduced chunk size to prevent conflicts
        let currentIndex = startIndex;
        
        const processChunk = () => {
            const chunkEnd = Math.min(currentIndex + chunkSize - 1, endIndex);
            
            // Add rows to selection
            for (let i = currentIndex; i <= chunkEnd; i++) {
                this.selectedRows.add(i);
            }
            
            currentIndex = chunkEnd + 1;
            
            if (currentIndex <= endIndex) {
                // Continue with next chunk - longer delay to prevent conflicts
                setTimeout(processChunk, 50); // Increased delay
            } else {
                // All chunks processed
                this.finishRangeSelection(startRow, endRow);
            }
        };
        
        // Start processing chunks
        setTimeout(processChunk, 100); // Initial delay
    }
    
    finishRangeSelection(startRow, endRow) {
        console.log('Range selection completed');
        
        // Clear processing flag and re-enable inputs
        this.isProcessing = false;
        this.disableRangeInputs(false);
        
        // Mark as having changes and update the display
        console.log('Setting hasChanges to true');
        this.hasChanges = true;
        console.log('hasChanges is now:', this.hasChanges);
        this.renderCSVTable();
        this.updateRowCounts();
        this.updateRangeDisplay();
        this.updateEditorButtons();
        
        const includedRows = endRow - startRow + 1;
        const excludedBefore = startRow - 1;
        const excludedAfter = this.modifiedData.length - endRow;
        
        const rangeResultsText = document.getElementById('range-results-text');
        if (rangeResultsText) {
            rangeResultsText.textContent = 
                `Range applied: Rows ${startRow}-${endRow} selected (${includedRows} included, ${excludedBefore} before, ${excludedAfter} after)`;
        }
        
        this.showNotification(`Range applied: ${includedRows} rows selected`, 'success');
    }
    
    disableRangeInputs(disabled) {
        const startRowInput = document.getElementById('start-row');
        const endRowInput = document.getElementById('end-row');
        const applyRangeBtn = document.getElementById('apply-range');
        const clearRangeBtn = document.getElementById('clear-range');
        
        if (startRowInput) startRowInput.disabled = disabled;
        if (endRowInput) endRowInput.disabled = disabled;
        if (applyRangeBtn) applyRangeBtn.disabled = disabled;
        if (clearRangeBtn) clearRangeBtn.disabled = disabled;
        
        console.log('Range inputs', disabled ? 'disabled' : 'enabled');
    }
    
    clearLoadingState() {
        console.log('clearLoadingState() called');
        
        // Nuclear option - stop ALL animations and clear ALL loading states
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.style.animation = 'none !important';
            element.style.transform = 'none !important';
            element.classList.remove('loading');
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        });
        
        // Remove loading class from files list container
        const filesList = document.getElementById('files-list');
        if (filesList) {
            console.log('Removing loading class from files-list');
            filesList.classList.remove('loading');
            filesList.style.opacity = '1';
            filesList.style.pointerEvents = 'auto';
        }
        
        // Remove loading class from any child elements
        const loadingElements = document.querySelectorAll('.loading');
        console.log('Found', loadingElements.length, 'loading elements to clear');
        loadingElements.forEach((element, index) => {
            console.log(`Clearing loading element ${index}:`, element);
            element.classList.remove('loading');
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            element.style.animation = 'none !important'; // Stop any animations
            element.style.transform = 'none !important'; // Reset any transforms
        });
        
        // Also check for any elements with loading text
        const loadingTextElements = document.querySelectorAll('*');
        loadingTextElements.forEach(element => {
            if (element.textContent && element.textContent.includes('Loading files...')) {
                console.log('Found loading text element:', element);
                element.style.display = 'none';
            }
        });
        
        // Force clear any loading indicators by ID
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            console.log('Removing loading indicator by ID');
            loadingIndicator.remove();
        }
        
        console.log('Loading state cleared with nuclear option');
    }

    clearRangeSelection() {
        this.selectedRows.clear();
        this.currentRange = null;
        document.getElementById('start-row').value = '';
        document.getElementById('end-row').value = '';
        document.getElementById('range-preview-text').textContent = 'No range selected';
        document.getElementById('range-results-text').textContent = 'No range applied';
        this.renderCSVTable();
        this.updateRowCounts();
        this.updateRangeDisplay();
        this.showNotification('Range selection cleared', 'info');
    }

    updateRangeDisplay() {
        const startDisplay = document.getElementById('range-start-display');
        const endDisplay = document.getElementById('range-end-display');
        
        if (startDisplay && endDisplay) {
            if (this.currentRange) {
                startDisplay.textContent = this.currentRange.start;
                endDisplay.textContent = this.currentRange.end;
            } else {
                startDisplay.textContent = '-';
                endDisplay.textContent = '-';
            }
        }
    }

    // Filter Methods
    applyFilter() {
        const column = document.getElementById('filter-column').value;
        const operator = document.getElementById('filter-operator').value;
        const value = document.getElementById('filter-value').value;
        
        if (!column || !value) {
            this.showNotification('Please select a column and enter a filter value', 'warning');
            return;
        }
        
        this.currentFilter = { column, operator, value };
        this.filteredRows = new Set();
        
        this.modifiedData.forEach((row, index) => {
            const cellValue = row[column] || '';
            let matches = false;
            
            switch (operator) {
                case 'contains':
                    matches = cellValue.toLowerCase().includes(value.toLowerCase());
                    break;
                case 'equals':
                    matches = cellValue === value;
                    break;
                case 'starts_with':
                    matches = cellValue.toLowerCase().startsWith(value.toLowerCase());
                    break;
                case 'ends_with':
                    matches = cellValue.toLowerCase().endsWith(value.toLowerCase());
                    break;
                case 'greater_than':
                    matches = parseFloat(cellValue) > parseFloat(value);
                    break;
                case 'less_than':
                    matches = parseFloat(cellValue) < parseFloat(value);
                    break;
            }
            
            if (matches) {
                this.filteredRows.add(index);
            }
        });
        
        document.getElementById('filter-results-text').textContent = 
            `Filter applied: ${this.filteredRows.size} rows match "${value}" in ${column}`;
        
        this.showNotification(`Filter applied: ${this.filteredRows.size} rows found`, 'success');
    }

    clearFilter() {
        this.currentFilter = null;
        this.filteredRows = new Set();
        document.getElementById('filter-results-text').textContent = 'No filter applied';
        this.showNotification('Filter cleared', 'info');
    }

    includeFiltered() {
        if (!this.filteredRows || this.filteredRows.size === 0) {
            this.showNotification('Please apply a filter first', 'warning');
            return;
        }
        
        this.selectedRows = new Set(this.filteredRows);
        this.renderCSVTable();
        this.updateRowCounts();
        this.showNotification(`${this.filteredRows.size} filtered rows selected`, 'success');
    }

    excludeFiltered() {
        if (!this.filteredRows || this.filteredRows.size === 0) {
            this.showNotification('Please apply a filter first', 'warning');
            return;
        }
        
        this.selectedRows.clear();
        for (let i = 0; i < this.modifiedData.length; i++) {
            if (!this.filteredRows.has(i)) {
                this.selectedRows.add(i);
            }
        }
        
        this.renderCSVTable();
        this.updateRowCounts();
        this.showNotification(`Selected ${this.selectedRows.size} rows (excluding filtered)`, 'success');
    }

    // Analysis Dataset Creation
    createAnalysisDataset() {
        if (this.selectedRows.size === 0) {
            this.showNotification('Please select rows to include in the analysis dataset', 'warning');
            return;
        }
        
        const reason = document.getElementById('selection-reason').value;
        const details = document.getElementById('selection-details').value;
        
        if (!reason) {
            this.showNotification('Please provide a reason for the row selection', 'warning');
            return;
        }
        
        // Create the analysis dataset with selected rows
        const selectedData = Array.from(this.selectedRows).map(index => this.modifiedData[index]);
        
        // Show summary
        this.showSelectionSummary(selectedData, reason, details);
    }

    showSelectionSummary(selectedData, reason, details) {
        document.getElementById('total-rows-summary').textContent = this.modifiedData.length;
        document.getElementById('selected-rows-summary').textContent = selectedData.length;
        document.getElementById('excluded-rows-summary').textContent = this.modifiedData.length - selectedData.length;
        document.getElementById('selection-percentage').textContent = 
            Math.round((selectedData.length / this.modifiedData.length) * 100) + '%';
        
        // Show selection criteria
        const criteriaList = document.getElementById('selection-criteria-list');
        criteriaList.innerHTML = `
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Details:</strong> ${details || 'No additional details provided'}</p>
            <p><strong>Selection Method:</strong> Manual row selection</p>
            <p><strong>Data Integrity:</strong> Original file preserved, analysis dataset created</p>
        `;
        
        // Show the summary section
        document.getElementById('selection-summary-section').style.display = 'block';
        document.getElementById('editor-section').style.display = 'none';
        
        this.showNotification('Analysis dataset created successfully', 'success');
    }

    cancelSelection() {
        document.getElementById('selection-summary-section').style.display = 'none';
        document.getElementById('editor-section').style.display = 'block';
        this.showNotification('Selection cancelled', 'info');
    }

    // Navigation Methods
    gotoStart() {
        if (this.currentRange) {
            document.getElementById('start-row').value = this.currentRange.start;
            this.updateRangePreview();
            this.showNotification(`Navigated to start row ${this.currentRange.start}`, 'info');
        } else {
            this.showNotification('No range selected', 'warning');
        }
    }

    gotoEnd() {
        if (this.currentRange) {
            document.getElementById('end-row').value = this.currentRange.end;
            this.updateRangePreview();
            this.showNotification(`Navigated to end row ${this.currentRange.end}`, 'info');
        } else {
            this.showNotification('No range selected', 'warning');
        }
    }

    gotoCurrent() {
        if (this.currentRowIndex !== null) {
            const rowNumber = this.currentRowIndex + 1;
            this.showNotification(`Current row: ${rowNumber}`, 'info');
        } else {
            this.showNotification('No row currently selected', 'warning');
        }
    }

    previewRange() {
        if (this.currentRange) {
            const startRow = this.currentRange.start;
            const endRow = this.currentRange.end;
            const includedRows = endRow - startRow + 1;
            const excludedBefore = startRow - 1;
            const excludedAfter = this.modifiedData.length - endRow;
            
            this.showNotification(
                `Range Preview: Rows ${startRow}-${endRow} (${includedRows} included, ${excludedBefore} before, ${excludedAfter} after)`, 
                'info'
            );
        } else {
            this.showNotification('No range selected for preview', 'warning');
        }
    }

    // Date Range Methods removed - using row selection only
}

// Global function for modal close
function closeCSVEditorGuide() {
    const modal = document.getElementById('csv-editor-guide-modal');
    modal.style.display = 'none';
}

// Initialize the clipping interface when the page loads
let clippingInterface;

console.log('Clipping interface script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing ClippingInterface');
    clippingInterface = new ClippingInterface();
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting for DOMContentLoaded');
} else {
    console.log('DOM already loaded, initializing immediately');
    clippingInterface = new ClippingInterface();
}
