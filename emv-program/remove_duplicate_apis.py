#!/usr/bin/env python3
"""
Synerex OneForm - Remove Duplicate API Endpoints
Safely removes duplicate and conflicting API endpoints
"""

import os
import shutil
from datetime import datetime

class APICleanup:
    def __init__(self):
        self.backup_file = f"main_hardened_ready_fixed_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
        self.removed_endpoints = []
        self.removed_functions = []
        
    def create_backup(self):
        """Create backup of main file before modifications"""
        source = "8082/main_hardened_ready_fixed.py"
        backup = f"8082/{self.backup_file}"
        
        if os.path.exists(source):
            shutil.copy2(source, backup)
            print(f"Backup created: {backup}")
            return True
        else:
            print(f"Source file not found: {source}")
            return False
    
    def remove_legacy_project_apis(self):
        """Remove legacy project management APIs"""
        print("\nRemoving legacy project APIs...")
        
        # Endpoints to remove
        legacy_endpoints = [
            '"/api/projects/list"',
            '"/api/projects/save"',
            '"/api/projects/load"'
        ]
        
        # Functions to remove
        legacy_functions = [
            'def projects_list():',
            'def projects_save():',
            'def projects_load():'
        ]
        
        return self.remove_endpoints_and_functions(legacy_endpoints, legacy_functions)
    
    def remove_legacy_profile_apis(self):
        """Remove legacy profile management APIs"""
        print("\nRemoving legacy profile APIs...")
        
        # Endpoints to remove
        legacy_endpoints = [
            '"/api/profiles"',  # Old POST version
            '"/api/profiles/<cid>"',
            '"/api/profiles/<cid>/clone"'
        ]
        
        # Functions to remove
        legacy_functions = [
            'def _create_profile():',
            'def _get_profile(cid):',
            'def _clone_profile(cid):'
        ]
        
        return self.remove_endpoints_and_functions(legacy_endpoints, legacy_functions)
    
    def remove_endpoints_and_functions(self, endpoints, functions):
        """Remove specified endpoints and functions from the main file"""
        source_file = "8082/main_hardened_ready_fixed.py"
        
        if not os.path.exists(source_file):
            print(f"Source file not found: {source_file}")
            return False
        
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            skip_until_next_function = False
            current_function = None
            function_start_line = -1
            indent_level = 0
            
            i = 0
            while i < len(lines):
                line = lines[i]
                
                # Check if this is a route we want to remove
                should_remove_route = False
                for endpoint in endpoints:
                    if f'@app.route({endpoint}' in line:
                        should_remove_route = True
                        self.removed_endpoints.append(endpoint.strip('"'))
                        print(f"  Removing endpoint: {endpoint}")
                        break
                
                # Check if this is a function we want to remove
                should_remove_function = False
                for func in functions:
                    if func in line:
                        should_remove_function = True
                        current_function = func
                        function_start_line = i
                        self.removed_functions.append(func.replace('def ', '').replace('():', ''))
                        print(f"  Removing function: {func}")
                        break
                
                if should_remove_route:
                    # Skip the route decorator
                    i += 1
                    continue
                
                if should_remove_function:
                    # Skip the function definition and find where it ends
                    skip_until_next_function = True
                    indent_level = len(line) - len(line.lstrip())
                    i += 1
                    continue
                
                if skip_until_next_function:
                    # Check if we've reached the end of the function
                    if line.strip() == '' or line.startswith('#'):
                        # Empty line or comment, continue
                        i += 1
                        continue
                    
                    current_indent = len(line) - len(line.lstrip())
                    
                    # If we hit a line with same or less indentation, we're done with the function
                    if current_indent <= indent_level and line.strip() != '':
                        skip_until_next_function = False
                        # Don't increment i, process this line normally
                        continue
                    else:
                        # Still inside the function, skip this line
                        i += 1
                        continue
                
                # Keep this line
                new_lines.append(line)
                i += 1
            
            # Write the cleaned file
            with open(source_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            
            print(f"  Successfully removed {len(self.removed_endpoints)} endpoints and {len(self.removed_functions)} functions")
            return True
            
        except Exception as e:
            print(f"Error removing endpoints: {e}")
            return False
    
    def verify_cleanup(self):
        """Verify that the cleanup was successful"""
        print("\nVerifying cleanup...")
        
        source_file = "8082/main_hardened_ready_fixed.py"
        
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check that removed endpoints are gone
            for endpoint in self.removed_endpoints:
                if f'"/api/{endpoint}"' in content:
                    print(f"  WARNING: Endpoint {endpoint} still found in file")
                else:
                    print(f"  OK: Endpoint {endpoint} successfully removed")
            
            # Check that removed functions are gone
            for func in self.removed_functions:
                if f'def {func}():' in content:
                    print(f"  WARNING: Function {func} still found in file")
                else:
                    print(f"  OK: Function {func} successfully removed")
            
            return True
            
        except Exception as e:
            print(f"Error verifying cleanup: {e}")
            return False
    
    def create_cleanup_report(self):
        """Create a report of what was cleaned up"""
        report = f"""# API Cleanup Report

## Cleanup Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Removed Endpoints:
"""
        
        for endpoint in self.removed_endpoints:
            report += f"- `/api/{endpoint}`\n"
        
        report += f"""
## Removed Functions:
"""
        
        for func in self.removed_functions:
            report += f"- `{func}()`\n"
        
        report += f"""
## Backup File: {self.backup_file}

## Benefits:
- Eliminated API conflicts
- Improved consistency
- Reduced maintenance complexity
- Cleaner API documentation

## Next Steps:
1. Test the application thoroughly
2. Update any frontend code using removed endpoints
3. Update API documentation
4. Run comprehensive API tests
"""
        
        with open('API_CLEANUP_REPORT.md', 'w') as f:
            f.write(report)
        
        print(f"\nCleanup report created: API_CLEANUP_REPORT.md")
    
    def run_cleanup(self):
        """Run the complete API cleanup process"""
        print("Starting API Duplicate Cleanup")
        print("=" * 40)
        
        # Create backup
        if not self.create_backup():
            return False
        
        # Remove legacy project APIs
        if not self.remove_legacy_project_apis():
            print("Failed to remove legacy project APIs")
            return False
        
        # Remove legacy profile APIs
        if not self.remove_legacy_profile_apis():
            print("Failed to remove legacy profile APIs")
            return False
        
        # Verify cleanup
        if not self.verify_cleanup():
            print("Cleanup verification failed")
            return False
        
        # Create report
        self.create_cleanup_report()
        
        print("\n" + "=" * 40)
        print("API CLEANUP COMPLETED SUCCESSFULLY!")
        print("=" * 40)
        print(f"Removed {len(self.removed_endpoints)} duplicate endpoints")
        print(f"Removed {len(self.removed_functions)} duplicate functions")
        print(f"Backup created: {self.backup_file}")
        print("\nNext steps:")
        print("1. Test the application")
        print("2. Update frontend code if needed")
        print("3. Run API tests")
        
        return True

def main():
    cleanup = APICleanup()
    success = cleanup.run_cleanup()
    
    if success:
        print("\nAPI cleanup completed successfully!")
    else:
        print("\nAPI cleanup failed!")

if __name__ == "__main__":
    main()












