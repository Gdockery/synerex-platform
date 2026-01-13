#!/usr/bin/env python3
"""
User Confirmation System for Synerex OneForm
Provides confirmation dialogs for critical operations
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class ConfirmationSystem:
    def __init__(self):
        self.pending_confirmations = {}
        self.confirmation_timeout = 300  # 5 minutes
    
    def create_confirmation(self, operation_type: str, details: Dict[str, Any]) -> str:
        """Create a confirmation request and return a confirmation ID"""
        confirmation_id = f"{operation_type}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        self.pending_confirmations[confirmation_id] = {
            "type": operation_type,
            "details": details,
            "created_at": datetime.now(),
            "status": "pending"
        }
        
        logger.info(f"Confirmation created: {confirmation_id} for {operation_type}")
        return confirmation_id
    
    def get_confirmation_details(self, confirmation_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a confirmation request"""
        if confirmation_id in self.pending_confirmations:
            return self.pending_confirmations[confirmation_id]
        return None
    
    def confirm_operation(self, confirmation_id: str, user_confirmed: bool) -> bool:
        """Confirm or deny an operation"""
        if confirmation_id not in self.pending_confirmations:
            logger.warning(f"Confirmation not found: {confirmation_id}")
            return False
        
        confirmation = self.pending_confirmations[confirmation_id]
        confirmation["status"] = "confirmed" if user_confirmed else "denied"
        confirmation["confirmed_at"] = datetime.now()
        
        logger.info(f"Operation {'confirmed' if user_confirmed else 'denied'}: {confirmation_id}")
        return user_confirmed
    
    def cleanup_expired_confirmations(self):
        """Remove expired confirmation requests"""
        current_time = datetime.now()
        expired_ids = []
        
        for conf_id, confirmation in self.pending_confirmations.items():
            if confirmation["status"] == "pending":
                time_diff = (current_time - confirmation["created_at"]).total_seconds()
                if time_diff > self.confirmation_timeout:
                    expired_ids.append(conf_id)
        
        for conf_id in expired_ids:
            del self.pending_confirmations[conf_id]
            logger.info(f"Expired confirmation removed: {conf_id}")
        
        return len(expired_ids)

# Global instance
confirmation_system = ConfirmationSystem()

def require_confirmation(operation_type: str, details: Dict[str, Any]) -> str:
    """Require user confirmation for an operation"""
    return confirmation_system.create_confirmation(operation_type, details)

def get_confirmation_details(confirmation_id: str) -> Optional[Dict[str, Any]]:
    """Get confirmation details"""
    return confirmation_system.get_confirmation_details(confirmation_id)

def confirm_operation(confirmation_id: str, user_confirmed: bool) -> bool:
    """Confirm or deny an operation"""
    return confirmation_system.confirm_operation(confirmation_id, user_confirmed)

# Operation types
class OperationTypes:
    DATABASE_OVERWRITE = "database_overwrite"
    FILE_DELETE = "file_delete"
    PROJECT_DELETE = "project_delete"
    BACKUP_RESTORE = "backup_restore"
    SYSTEM_RESET = "system_reset"

def create_database_overwrite_confirmation(db_path: str, backup_path: str = None) -> str:
    """Create confirmation for database overwrite operation"""
    details = {
        "database_path": db_path,
        "backup_path": backup_path,
        "message": f"Database file '{db_path}' will be overwritten. This action cannot be undone.",
        "warning": "This will permanently replace the current database with new data."
    }
    return require_confirmation(OperationTypes.DATABASE_OVERWRITE, details)

def create_file_delete_confirmation(file_path: str) -> str:
    """Create confirmation for file deletion"""
    details = {
        "file_path": file_path,
        "message": f"File '{file_path}' will be permanently deleted.",
        "warning": "This action cannot be undone."
    }
    return require_confirmation(OperationTypes.FILE_DELETE, details)

def create_project_delete_confirmation(project_name: str) -> str:
    """Create confirmation for project deletion"""
    details = {
        "project_name": project_name,
        "message": f"Project '{project_name}' will be permanently deleted.",
        "warning": "All project data will be lost and cannot be recovered."
    }
    return require_confirmation(OperationTypes.PROJECT_DELETE, details)

def create_backup_restore_confirmation(backup_path: str, target_path: str) -> str:
    """Create confirmation for backup restore operation"""
    details = {
        "backup_path": backup_path,
        "target_path": target_path,
        "message": f"File '{target_path}' will be restored from backup '{backup_path}'.",
        "warning": "The current file will be replaced with the backup version."
    }
    return require_confirmation(OperationTypes.BACKUP_RESTORE, details)

def create_database_overwrite_danger_confirmation(file_path: str, danger_info: dict) -> str:
    """Create confirmation for database overwrite with DANGER notice"""
    details = {
        "file_path": file_path,
        "file_type": danger_info.get("file_type", "database"),
        "file_size": danger_info.get("file_size", 0),
        "last_modified": danger_info.get("last_modified", "unknown"),
        "warning_level": danger_info.get("warning_level", "CRITICAL"),
        "message": danger_info.get("message", "🚨 DANGER: Database file will be overwritten!"),
        "details": danger_info.get("details", "This database file contains important project data."),
        "recommendation": danger_info.get("recommendation", "Create a backup before proceeding."),
        "danger": True
    }
    return require_confirmation(OperationTypes.DATABASE_OVERWRITE, details)

if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Create a confirmation
    conf_id = create_database_overwrite_confirmation("test.db", "backup.db")
    print(f"Confirmation created: {conf_id}")
    
    # Get details
    details = get_confirmation_details(conf_id)
    print(f"Details: {details}")
    
    # Confirm the operation
    result = confirm_operation(conf_id, True)
    print(f"Operation confirmed: {result}")
