/**
 * File Selection Module for Legacy Interface
 * Handles file selection for Before/After files with fingerprints
 */

class FileSelection {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.isInitialized = true;
        });
    }

    setupEventListeners() {
        // Before File button
        const chooseBeforeBtn = document.getElementById('choose-before-file');
        if (chooseBeforeBtn) {
            chooseBeforeBtn.addEventListener('click', () => this.showFileSelection('before'));
        }

        // After File button
        const chooseAfterBtn = document.getElementById('choose-after-file');
        if (chooseAfterBtn) {
            chooseAfterBtn.addEventListener('click', () => this.showFileSelection('after'));
        }
    }

    async showFileSelection(fileType) {
        try {

            this.showNotification('Loading CSV files...', 'info');
            
            // Fetch files with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/verified-files', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data.status === 'success' && data.files && data.files.length > 0) {
                // Show all verified files (they're already verified by being in the verified folders)
                this.showFileModal(data.files, fileType);
            } else {
                this.showNotification('No verified CSV files found. Please upload and process files first.', 'warning');
            }
        } catch (error) {
            console.error('Error loading files:', error);
            if (error.name === 'AbortError') {
                this.showNotification('Request timed out. Please try again.', 'error');
            } else {
                this.showNotification('Error loading files. Please try again.', 'error');
            }
        }
    }

    showFileModal(files, fileType) {
        // Remove existing modal
        this.removeExistingModal();
        
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'file-selection-modal';
        modal.className = 'file-selection-modal';
        modal.innerHTML = this.getModalHTML(files, fileType);
        
        // Add to page
        document.body.appendChild(modal);
        
        // Add click handlers
        this.addModalEventListeners(files, fileType);
    }

    getModalHTML(files, fileType) {
        return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📁 Select ${fileType === 'before' ? 'Before' : 'After'} CSV File</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <p class="modal-description">
                            Choose a CSV file with fingerprints and ranges set for the ${fileType === 'before' ? 'baseline (before)' : 'post-retrofit (after)'} data.<br>
                            <strong>Note:</strong> Files must have column headers preserved in the first row for proper analysis.
                        </p>
                        
                        <div class="files-list">
                            ${files.map(file => this.getFileItemHTML(file, fileType)).join('')}
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    getFileItemHTML(file, fileType) {
        // Determine file status based on path
        let statusIcon = '📄';
        let statusText = 'File';
        let statusClass = 'legacy';
        
        if (file.file_path) {
            if (file.file_path.includes('/files/protected/verified/')) {
                statusIcon = '🔒';
                statusText = 'Verified & Protected';
                statusClass = 'protected-verified';
            } else if (file.file_path.includes('/files/protected/archived/')) {
                statusIcon = '🔒';
                statusText = 'Archived & Protected';
                statusClass = 'protected-archived';
            } else if (file.file_path.includes('/files/raw/')) {
                statusIcon = '⚠️';
                statusText = 'Raw - Needs Verification';
                statusClass = 'raw';
            } else if (file.file_path.includes('/files/processing/')) {
                statusIcon = '🔄';
                statusText = 'Being Processed';
                statusClass = 'processing';
            } else if (file.file_path.includes('/files/projects/')) {
                statusIcon = '📁';
                statusText = 'Project File';
                statusClass = 'project';
            } else if (file.file_path.includes('raw_meter_data')) {
                statusIcon = '📊';
                statusText = 'Raw Data';
                statusClass = 'raw-data';
            }
        }
        
        return `
            <div class="file-item ${statusClass}" data-file-id="${file.id}" data-file-name="${file.file_name}" data-file-type="${fileType}">
                <div class="file-info">
                    <div class="file-name">${file.file_name}</div>
                    <div class="file-details">
                        Size: ${this.formatFileSize(file.file_size)} | 
                        Uploaded: ${new Date(file.created_at).toLocaleDateString()}
                        ${file.directory ? ` | Folder: ${file.directory}` : ''}
                    </div>
                </div>
                <div class="file-status ${statusClass}">
                    ${statusIcon} ${statusText}
                </div>
            </div>
        `;
    }

    addModalEventListeners(files, fileType) {
        const modal = document.getElementById('file-selection-modal');
        
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => this.closeModal());
        
        // Cancel button
        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());
        
        // Overlay click to close
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        
        // File selection
        modal.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.fileId;
                const fileName = item.dataset.fileName;
                this.selectFile(fileId, fileName, fileType);
            });
        });
    }

    selectFile(fileId, fileName, fileType) {
        if (fileType === 'before') {
            const beforeFileId = document.getElementById('before_file_id');
            const beforeFileSelected = document.getElementById('before-file-selected');
            const chooseBeforeBtn = document.getElementById('choose-before-file');
            
            if (beforeFileId) beforeFileId.value = fileId;
            if (beforeFileSelected) {
                beforeFileSelected.textContent = fileName;
                beforeFileSelected.style.display = 'inline';
            }
            if (chooseBeforeBtn) chooseBeforeBtn.textContent = '📁 Change File';
        } else if (fileType === 'after') {
            const afterFileId = document.getElementById('after_file_id');
            const afterFileSelected = document.getElementById('after-file-selected');
            const chooseAfterBtn = document.getElementById('choose-after-file');
            
            if (afterFileId) afterFileId.value = fileId;
            if (afterFileSelected) {
                afterFileSelected.textContent = fileName;
                afterFileSelected.style.display = 'inline';
            }
            if (chooseAfterBtn) chooseAfterBtn.textContent = '📁 Change File';
        }
        
        // Extract periods from selected file
        if (typeof extractPeriodFromFileId === 'function') {
            extractPeriodFromFileId(fileId, fileType);
        }
        
        this.closeModal();
    }

    closeModal() {
        this.removeExistingModal();
    }

    removeExistingModal() {
        const existingModal = document.getElementById('file-selection-modal');
        if (existingModal) {
            existingModal.remove();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.file-selection-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'file-selection-notification';
        notification.textContent = message;
        
        // Style based on type
        const colors = {
            info: '#17a2b8',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            max-width: 300px;
            word-wrap: break-word;
            background-color: ${colors[type] || colors.info};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize when script loads
window.fileSelection = new FileSelection();
