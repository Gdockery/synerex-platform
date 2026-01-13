#!/usr/bin/env python3
"""
Custom Similarity Detection Script for Code Duplication Analysis

This script analyzes the main Python file to detect similar code blocks,
duplicate functions, and redundant patterns that may indicate code duplication.
"""

import ast
import difflib
import re
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
from collections import defaultdict
import sys

@dataclass
class SimilarityMatch:
    """Represents a similarity match between two code blocks"""
    type: str
    similarity: float
    location1: str
    location2: str
    lines1: List[str]
    lines2: List[str]
    description: str

class CodeSimilarityDetector:
    """Detects similar code blocks and potential duplications"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.content = self._read_file()
        self.lines = self.content.split('\n')
        self.ast_tree = self._parse_ast()
        self.functions = self._extract_functions()
        self.classes = self._extract_classes()
        self.similarities = []
    
    def _read_file(self) -> str:
        """Read the file content"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            return ""
    
    def _parse_ast(self) -> ast.AST:
        """Parse the file into an AST"""
        try:
            return ast.parse(self.content)
        except SyntaxError as e:
            print(f"Syntax error in file: {e}")
            return ast.parse("")
    
    def _extract_functions(self) -> Dict[str, Dict]:
        """Extract all function definitions"""
        functions = {}
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.FunctionDef):
                start_line = node.lineno
                end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line + 10
                
                functions[node.name] = {
                    'node': node,
                    'start_line': start_line,
                    'end_line': end_line,
                    'lines': self.lines[start_line-1:end_line],
                    'body': ast.unparse(node.body) if hasattr(ast, 'unparse') else str(node.body)
                }
        
        return functions
    
    def _extract_classes(self) -> Dict[str, Dict]:
        """Extract all class definitions"""
        classes = {}
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.ClassDef):
                start_line = node.lineno
                end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line + 50
                
                classes[node.name] = {
                    'node': node,
                    'start_line': start_line,
                    'end_line': end_line,
                    'lines': self.lines[start_line-1:end_line],
                    'methods': {}
                }
                
                # Extract methods
                for method in node.body:
                    if isinstance(method, ast.FunctionDef):
                        method_start = method.lineno
                        method_end = method.end_lineno if hasattr(method, 'end_lineno') else method_start + 10
                        
                        classes[node.name]['methods'][method.name] = {
                            'node': method,
                            'start_line': method_start,
                            'end_line': method_end,
                            'lines': self.lines[method_start-1:method_end],
                            'body': ast.unparse(method.body) if hasattr(ast, 'unparse') else str(method.body)
                        }
        
        return classes
    
    def detect_function_similarities(self, min_similarity: float = 0.8) -> List[SimilarityMatch]:
        """Detect similar functions"""
        similarities = []
        function_names = list(self.functions.keys())
        
        for i, name1 in enumerate(function_names):
            for j, name2 in enumerate(function_names[i+1:], i+1):
                func1 = self.functions[name1]
                func2 = self.functions[name2]
                
                # Compare function bodies
                similarity = self._calculate_similarity(func1['body'], func2['body'])
                
                if similarity >= min_similarity:
                    similarities.append(SimilarityMatch(
                        type="function",
                        similarity=similarity,
                        location1=f"{name1} (lines {func1['start_line']}-{func1['end_line']})",
                        location2=f"{name2} (lines {func2['start_line']}-{func2['end_line']})",
                        lines1=func1['lines'],
                        lines2=func2['lines'],
                        description=f"Functions {name1} and {name2} are {similarity:.1%} similar"
                    ))
        
        return similarities
    
    def detect_method_similarities(self, min_similarity: float = 0.8) -> List[SimilarityMatch]:
        """Detect similar methods within classes"""
        similarities = []
        
        for class_name, class_info in self.classes.items():
            method_names = list(class_info['methods'].keys())
            
            for i, method1 in enumerate(method_names):
                for j, method2 in enumerate(method_names[i+1:], i+1):
                    meth1 = class_info['methods'][method1]
                    meth2 = class_info['methods'][method2]
                    
                    similarity = self._calculate_similarity(meth1['body'], meth2['body'])
                    
                    if similarity >= min_similarity:
                        similarities.append(SimilarityMatch(
                            type="method",
                            similarity=similarity,
                            location1=f"{class_name}.{method1} (lines {meth1['start_line']}-{meth1['end_line']})",
                            location2=f"{class_name}.{method2} (lines {meth2['start_line']}-{meth2['end_line']})",
                            lines1=meth1['lines'],
                            lines2=meth2['lines'],
                            description=f"Methods {class_name}.{method1} and {class_name}.{method2} are {similarity:.1%} similar"
                        ))
        
        return similarities
    
    def detect_pattern_similarities(self) -> List[SimilarityMatch]:
        """Detect similar code patterns"""
        similarities = []
        
        # Pattern 1: HTML content replacements
        html_replacements = self._find_html_replacements()
        if len(html_replacements) > 10:
            similarities.append(SimilarityMatch(
                type="pattern",
                similarity=1.0,
                location1=f"HTML replacements (lines {html_replacements[0]}-{html_replacements[-1]})",
                location2=f"Total: {len(html_replacements)} replacements",
                lines1=[],
                lines2=[],
                description=f"Found {len(html_replacements)} HTML content replacements - potential for template helper"
            ))
        
        # Pattern 2: Validation functions
        validation_functions = self._find_validation_functions()
        if len(validation_functions) > 5:
            similarities.append(SimilarityMatch(
                type="pattern",
                similarity=0.9,
                location1=f"Validation functions (lines {validation_functions[0]}-{validation_functions[-1]})",
                location2=f"Total: {len(validation_functions)} functions",
                lines1=[],
                lines2=[],
                description=f"Found {len(validation_functions)} validation functions - potential for unified validator"
            ))
        
        # Pattern 3: Calculation functions
        calc_functions = self._find_calculation_functions()
        if len(calc_functions) > 10:
            similarities.append(SimilarityMatch(
                type="pattern",
                similarity=0.9,
                location1=f"Calculation functions (lines {calc_functions[0]}-{calc_functions[-1]})",
                location2=f"Total: {len(calc_functions)} functions",
                lines1=[],
                lines2=[],
                description=f"Found {len(calc_functions)} calculation functions - potential for unified calculator"
            ))
        
        return similarities
    
    def detect_duplicate_functions(self) -> List[SimilarityMatch]:
        """Detect exact duplicate functions"""
        duplicates = []
        function_names = list(self.functions.keys())
        
        for i, name1 in enumerate(function_names):
            for j, name2 in enumerate(function_names[i+1:], i+1):
                func1 = self.functions[name1]
                func2 = self.functions[name2]
                
                # Check for exact duplicates
                if func1['body'] == func2['body']:
                    duplicates.append(SimilarityMatch(
                        type="duplicate",
                        similarity=1.0,
                        location1=f"{name1} (lines {func1['start_line']}-{func1['end_line']})",
                        location2=f"{name2} (lines {func2['start_line']}-{func2['end_line']})",
                        lines1=func1['lines'],
                        lines2=func2['lines'],
                        description=f"Functions {name1} and {name2} are exact duplicates"
                    ))
        
        return duplicates
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings"""
        if not text1 or not text2:
            return 0.0
        
        # Use difflib for similarity calculation
        matcher = difflib.SequenceMatcher(None, text1, text2)
        return matcher.ratio()
    
    def _find_html_replacements(self) -> List[int]:
        """Find lines with HTML content replacements"""
        html_replacements = []
        for i, line in enumerate(self.lines, 1):
            if 'html_content.replace(' in line:
                html_replacements.append(i)
        return html_replacements
    
    def _find_validation_functions(self) -> List[int]:
        """Find validation function definitions"""
        validation_functions = []
        for name, func_info in self.functions.items():
            if 'validate' in name.lower() or 'verify' in name.lower():
                validation_functions.append(func_info['start_line'])
        return validation_functions
    
    def _find_calculation_functions(self) -> List[int]:
        """Find calculation function definitions"""
        calc_functions = []
        for name, func_info in self.functions.items():
            if 'calculate' in name.lower() or 'compute' in name.lower():
                calc_functions.append(func_info['start_line'])
        return calc_functions
    
    def run_analysis(self) -> Dict[str, List[SimilarityMatch]]:
        """Run complete similarity analysis"""
        results = {
            'duplicates': self.detect_duplicate_functions(),
            'function_similarities': self.detect_function_similarities(),
            'method_similarities': self.detect_method_similarities(),
            'pattern_similarities': self.detect_pattern_similarities()
        }
        
        return results
    
    def generate_report(self, results: Dict[str, List[SimilarityMatch]]) -> str:
        """Generate a detailed similarity report"""
        report = []
        report.append("# Code Similarity Analysis Report")
        report.append("")
        
        total_issues = sum(len(matches) for matches in results.values())
        report.append(f"## Summary")
        report.append(f"- Total issues found: {total_issues}")
        report.append(f"- Duplicate functions: {len(results['duplicates'])}")
        report.append(f"- Similar functions: {len(results['function_similarities'])}")
        report.append(f"- Similar methods: {len(results['method_similarities'])}")
        report.append(f"- Pattern similarities: {len(results['pattern_similarities'])}")
        report.append("")
        
        # Duplicate functions
        if results['duplicates']:
            report.append("## Duplicate Functions (Exact Matches)")
            for match in results['duplicates']:
                report.append(f"### {match.description}")
                report.append(f"- **Location 1**: {match.location1}")
                report.append(f"- **Location 2**: {match.location2}")
                report.append(f"- **Similarity**: {match.similarity:.1%}")
                report.append("")
        
        # Similar functions
        if results['function_similarities']:
            report.append("## Similar Functions")
            for match in results['function_similarities']:
                report.append(f"### {match.description}")
                report.append(f"- **Location 1**: {match.location1}")
                report.append(f"- **Location 2**: {match.location2}")
                report.append(f"- **Similarity**: {match.similarity:.1%}")
                report.append("")
        
        # Similar methods
        if results['method_similarities']:
            report.append("## Similar Methods")
            for match in results['method_similarities']:
                report.append(f"### {match.description}")
                report.append(f"- **Location 1**: {match.location1}")
                report.append(f"- **Location 2**: {match.location2}")
                report.append(f"- **Similarity**: {match.similarity:.1%}")
                report.append("")
        
        # Pattern similarities
        if results['pattern_similarities']:
            report.append("## Pattern Similarities")
            for match in results['pattern_similarities']:
                report.append(f"### {match.description}")
                report.append(f"- **Location**: {match.location1}")
                report.append(f"- **Details**: {match.location2}")
                report.append("")
        
        return "\n".join(report)

def main():
    """Main function to run the similarity analysis"""
    if len(sys.argv) != 2:
        print("Usage: python similarity_detector.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    detector = CodeSimilarityDetector(file_path)
    
    print("Running similarity analysis...")
    results = detector.run_analysis()
    
    print("Generating report...")
    report = detector.generate_report(results)
    
    # Save report to file
    report_file = "SIMILARITY_ANALYSIS_REPORT.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Analysis complete. Report saved to {report_file}")
    
    # Print summary to console
    total_issues = sum(len(matches) for matches in results.values())
    print(f"\nSummary:")
    print(f"- Total issues found: {total_issues}")
    print(f"- Duplicate functions: {len(results['duplicates'])}")
    print(f"- Similar functions: {len(results['function_similarities'])}")
    print(f"- Similar methods: {len(results['method_similarities'])}")
    print(f"- Pattern similarities: {len(results['pattern_similarities'])}")

if __name__ == "__main__":
    main()
