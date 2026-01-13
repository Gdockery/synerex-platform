// Upload Interface JavaScript
class UploadInterface {
    constructor() {
        this.selectedFiles = [];
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('session_token');
        this.initializeEventListeners();
        this.checkAuthentication();
        this.loadRecentUploads();
    }
    
    initializeEventListeners() {
        // Navigation
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            window.location.href = '/main-dashboard';
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // File upload
        const dropzone = document.getElementById('upload-dropzone');
        const fileInput = document.getElementById('file-input');
        
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Upload actions
        document.getElementById('upload-files').addEventListener('click', () => {
            this.uploadFiles();
        });
        
        document.getElementById('clear-files').addEventListener('click', () => {
            this.clearFiles();
        });
    }
    
    async checkAuthentication() {
        if (!this.sessionToken) {
            this.showNotification('Please login to access this page', 'error');
            setTimeout(() => {
                window.location.href = '/main-dashboard';
            }, 2000);
            return;
        }
        
        try {
            const response = await fetch('/api/auth/validate-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: this.sessionToken })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.currentUser = result.user;
                document.getElementById('current-user-name').textContent = 
                    `Welcome, ${this.currentUser.full_name} (${this.currentUser.role.toUpperCase()})`;
            } else {
                this.showNotification('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/main-dashboard';
                }, 2000);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showNotification('Authentication error. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = '/main-dashboard';
            }, 2000);
        }
    }
    
    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                this.showNotification(`File ${file.name} is not a CSV file`, 'error');
                return false;
            }
            if (file.size > 100 * 1024 * 1024) { // 100MB
                this.showNotification(`File ${file.name} is too large (max 100MB)`, 'error');
                return false;
            }
            return true;
        });
        
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        this.updateFileList();
    }
    
    updateFileList() {
        const fileList = document.getElementById('file-list');
        const selectedFilesDiv = document.getElementById('selected-files');
        
        if (this.selectedFiles.length === 0) {
            fileList.style.display = 'none';
            return;
        }
        
        fileList.style.display = 'block';
        selectedFilesDiv.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                </div>
                <button class="btn-remove" onclick="uploadInterface.removeFile(${index})">×</button>
            `;
            selectedFilesDiv.appendChild(fileItem);
        });
    }
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
    }
    
    clearFiles() {
        this.selectedFiles = [];
        this.updateFileList();
        document.getElementById('file-input').value = '';
    }
    
    async uploadFiles() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('Please select files to upload', 'error');
            return;
        }
        
        const progressDiv = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const uploadStatus = document.getElementById('upload-status');
        
        progressDiv.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        uploadStatus.textContent = 'Preparing upload...';
        
        try {
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                uploadStatus.textContent = `Uploading ${file.name}...`;
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('uploaded_by', this.currentUser.id);
                
                const response = await fetch('/api/raw-meter-data/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                if (result.status !== 'success') {
                    throw new Error(result.error || 'Upload failed');
                }
                
                const progress = ((i + 1) / this.selectedFiles.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }
            
            uploadStatus.textContent = 'Upload completed successfully!';
            this.showNotification(`Successfully uploaded ${this.selectedFiles.length} file(s)`, 'success');
            this.clearFiles();
            this.loadRecentUploads();
            
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = `Upload failed: ${error.message}`;
            this.showNotification(`Upload failed: ${error.message}`, 'error');
        }
    }
    
    async loadRecentUploads() {
        const recentUploadsDiv = document.getElementById('recent-uploads');
        
        try {
            const response = await fetch('/api/original-files');
            const result = await response.json();
            
            if (result.status === 'success') {
                const files = result.files || [];
                
                if (files.length === 0) {
                    recentUploadsDiv.innerHTML = '<div class="no-files">No recent uploads found</div>';
                    return;
                }
                
                recentUploadsDiv.innerHTML = `
                    <div class="files-table">
                        <div class="table-header">
                            <div>File Name</div>
                            <div>Size</div>
                            <div>Uploaded</div>
                            <div>Actions</div>
                        </div>
                        ${files.map(file => `
                            <div class="table-row">
                                <div class="file-name">${file.file_name}</div>
                                <div class="file-size">${this.formatFileSize(file.file_size)}</div>
                                <div class="upload-date">${new Date(file.created_at).toLocaleDateString()}</div>
                                <div class="actions">
                                    <button class="btn-download" onclick="uploadInterface.downloadFile(${file.id})">📥</button>
                                    <button class="btn-delete" onclick="uploadInterface.deleteFile(${file.id})">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                recentUploadsDiv.innerHTML = '<div class="error">Error loading recent uploads</div>';
            }
        } catch (error) {
            console.error('Error loading recent uploads:', error);
            recentUploadsDiv.innerHTML = '<div class="error">Error loading recent uploads</div>';
        }
    }
    
    async downloadFile(fileId) {
        try {
            const response = await fetch(`/api/original-files/${fileId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `file_${fileId}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showNotification('File downloaded successfully', 'success');
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Download failed', 'error');
        }
    }
    
    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/original-files/${fileId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.showNotification('File deleted successfully', 'success');
                this.loadRecentUploads();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Delete failed', 'error');
        }
    }
    
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_token: this.sessionToken })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('session_token');
            window.location.href = '/main-dashboard';
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
        const banner = document.getElementById('notification-banner');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        banner.className = `notification-banner ${type}`;
        banner.style.display = 'block';
        
        setTimeout(() => {
            banner.style.display = 'none';
        }, 5000);
    }
}

// Initialize upload interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.uploadInterface = new UploadInterface();
});
