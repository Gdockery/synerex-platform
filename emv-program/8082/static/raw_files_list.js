// Raw Files List JavaScript
class RawFilesList {
    constructor() {
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('session_token');
        this.files = [];
        this.filteredFiles = [];
        this.selectedFiles = new Set();
        this.currentPage = 1;
        this.filesPerPage = 10;
        this.initializeEventListeners();
        this.checkAuthentication();
        this.loadFiles();
    }
    
    initializeEventListeners() {
        // Navigation
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            window.location.href = '/main-dashboard';
        });
        
        document.getElementById('upload-new-files').addEventListener('click', () => {
            window.location.href = '/upload-interface';
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // Search and filters
        document.getElementById('search-input').addEventListener('input', () => {
            this.filterFiles();
        });
        
        document.getElementById('search-btn').addEventListener('click', () => {
            this.filterFiles();
        });
        
        document.getElementById('sort-by').addEventListener('change', () => {
            this.sortFiles();
        });
        
        document.getElementById('filter-type').addEventListener('change', () => {
            this.filterFiles();
        });
        
        // Selection
        document.getElementById('select-all').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
        
        // Bulk actions
        document.getElementById('bulk-download').addEventListener('click', () => {
            this.bulkDownload();
        });
        
        document.getElementById('bulk-delete').addEventListener('click', () => {
            this.bulkDelete();
        });
        
        document.getElementById('bulk-assign').addEventListener('click', () => {
            this.bulkAssignToProject();
        });
        
        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            this.previousPage();
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.nextPage();
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
    
    async loadFiles() {
        const tableBody = document.getElementById('files-table-body');
        tableBody.innerHTML = '<div class="loading">Loading files...</div>';
        
        try {
            const response = await fetch('/api/original-files', {
                headers: this.getAuthHeaders()
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                this.files = result.files || [];
                this.filterFiles();
                this.updateStatistics();
            } else {
                tableBody.innerHTML = '<div class="error">Error loading files</div>';
            }
        } catch (error) {
            console.error('Error loading files:', error);
            tableBody.innerHTML = '<div class="error">Error loading files</div>';
        }
    }
    
    filterFiles() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filterType = document.getElementById('filter-type').value;
        
        this.filteredFiles = this.files.filter(file => {
            // Search filter
            if (searchTerm && !file.file_name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Type filter
            if (filterType === 'csv' && !file.file_name.toLowerCase().endsWith('.csv')) {
                return false;
            }
            
            if (filterType === 'recent') {
                const fileDate = new Date(file.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (fileDate < weekAgo) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.sortFiles();
        this.renderFiles();
        this.updatePagination();
    }
    
    sortFiles() {
        const sortBy = document.getElementById('sort-by').value;
        
        this.filteredFiles.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.file_name.localeCompare(b.file_name);
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'size':
                    return (b.file_size || 0) - (a.file_size || 0);
                default:
                    return 0;
            }
        });
        
        this.renderFiles();
    }
    
    renderFiles() {
        const tableBody = document.getElementById('files-table-body');
        
        if (this.filteredFiles.length === 0) {
            tableBody.innerHTML = '<div class="no-files">No files found</div>';
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.filesPerPage;
        const endIndex = startIndex + this.filesPerPage;
        const pageFiles = this.filteredFiles.slice(startIndex, endIndex);
        
        tableBody.innerHTML = pageFiles.map(file => `
            <div class="table-row ${this.selectedFiles.has(file.id) ? 'selected' : ''}">
                <div class="col-checkbox">
                    <input type="checkbox" ${this.selectedFiles.has(file.id) ? 'checked' : ''} 
                           onchange="rawFilesList.toggleFileSelection(${file.id})">
                </div>
                <div class="col-name">
                    <span class="file-name">${file.file_name}</span>
                </div>
                <div class="col-size">
                    <span class="file-size">${this.formatFileSize(file.file_size)}</span>
                </div>
                <div class="col-date">
                    <span class="upload-date">${new Date(file.created_at).toLocaleDateString()}</span>
                </div>
                <div class="col-fingerprint">
                    <span class="fingerprint" title="${file.fingerprint}">
                        ${file.fingerprint ? file.fingerprint.substring(0, 8) + '...' : 'N/A'}
                    </span>
                </div>
                <div class="col-actions">
                    <button class="btn-download" onclick="rawFilesList.downloadFile(${file.id})" title="Download">📥</button>
                    <button class="btn-delete" onclick="rawFilesList.deleteFile(${file.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    toggleFileSelection(fileId) {
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
        } else {
            this.selectedFiles.add(fileId);
        }
        
        this.updateBulkActions();
        this.renderFiles();
    }
    
    toggleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.filesPerPage;
        const endIndex = startIndex + this.filesPerPage;
        const pageFiles = this.filteredFiles.slice(startIndex, endIndex);
        
        if (checked) {
            pageFiles.forEach(file => this.selectedFiles.add(file.id));
        } else {
            pageFiles.forEach(file => this.selectedFiles.delete(file.id));
        }
        
        this.updateBulkActions();
        this.renderFiles();
    }
    
    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (this.selectedFiles.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedFiles.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.filteredFiles.length / this.filesPerPage);
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderFiles();
            this.updatePagination();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.filteredFiles.length / this.filesPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderFiles();
            this.updatePagination();
        }
    }
    
    updateStatistics() {
        const totalFiles = this.files.length;
        const totalSize = this.files.reduce((sum, file) => sum + (file.file_size || 0), 0);
        const recentUploads = this.files.filter(file => {
            const fileDate = new Date(file.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return fileDate >= weekAgo;
        }).length;
        const avgFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;
        
        document.getElementById('total-files').textContent = totalFiles;
        document.getElementById('total-size').textContent = this.formatFileSize(totalSize);
        document.getElementById('recent-uploads').textContent = recentUploads;
        document.getElementById('avg-file-size').textContent = this.formatFileSize(avgFileSize);
    }
    
    async downloadFile(fileId) {
        try {
            const response = await fetch(`/api/original-files/${fileId}/download`, {
                headers: this.getAuthHeaders()
            });
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
    
    async viewFile(fileId) {
        // Open file for editing in the clipping interface
        this.showNotification('Opening file for editing...', 'info');
        setTimeout(() => {
            window.location.href = `/clipping-interface?file=${fileId}`;
        }, 1000);
    }
    
    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/original-files/${fileId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.showNotification('File deleted successfully', 'success');
                this.loadFiles();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Delete failed', 'error');
        }
    }
    
    async bulkDownload() {
        if (this.selectedFiles.size === 0) {
            this.showNotification('Please select files to download', 'error');
            return;
        }
        
        this.showNotification(`Downloading ${this.selectedFiles.size} files...`, 'info');
        
        for (const fileId of this.selectedFiles) {
            await this.downloadFile(fileId);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        this.selectedFiles.clear();
        this.updateBulkActions();
        this.renderFiles();
    }
    
    async bulkDelete() {
        if (this.selectedFiles.size === 0) {
            this.showNotification('Please select files to delete', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${this.selectedFiles.size} files?`)) {
            return;
        }
        
        this.showNotification(`Deleting ${this.selectedFiles.size} files...`, 'info');
        
        for (const fileId of this.selectedFiles) {
            await this.deleteFile(fileId);
        }
        
        this.selectedFiles.clear();
        this.updateBulkActions();
        this.loadFiles();
    }
    
    async bulkAssignToProject() {
        if (this.selectedFiles.size === 0) {
            this.showNotification('Please select files to assign to project', 'error');
            return;
        }
        
        const projectName = prompt('Enter project name:');
        if (!projectName) {
            return;
        }
        
        try {
            const response = await fetch('/api/original-files/assign-to-project', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    file_ids: Array.from(this.selectedFiles),
                    project_name: projectName
                })
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                this.showNotification(`Successfully assigned ${this.selectedFiles.size} files to project "${projectName}"`, 'success');
                this.selectedFiles.clear();
                this.updateBulkActions();
                this.renderFiles();
            } else {
                throw new Error(result.error || 'Assignment failed');
            }
        } catch (error) {
            console.error('Assignment error:', error);
            this.showNotification('Assignment failed', 'error');
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
    
    // Utility methods
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
        };
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

// Initialize raw files list when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.rawFilesList = new RawFilesList();
});
