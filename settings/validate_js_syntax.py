#!/usr/bin/env python3
"""
JavaScript Syntax Validator for Localized HTML Files
Prevents JavaScript syntax errors during translation process
"""

import re
import tempfile
import subprocess
import sys
import os

def extract_and_validate_js(filepath):
    """Extract JavaScript from HTML and validate syntax"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract JavaScript sections (not external scripts or JSON-LD)
        js_sections = re.findall(r'<script(?![^>]*src=)(?![^>]*type=["\']application/ld\+json["\'])[^>]*>(.*?)</script>', content, re.DOTALL)
        
        if not js_sections:
            return True, "No JavaScript sections found"
        
        # Combine all JavaScript
        js_code = '\n'.join(js_sections)
        
        # Write to temp file and validate with Node.js
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(js_code)
            temp_file = f.name
        
        try:
            result = subprocess.run(['node', '--check', temp_file], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0, result.stderr.strip() if result.stderr else "OK"
        finally:
            os.unlink(temp_file)
            
    except Exception as e:
        return False, f"Validation error: {e}"

def main():
    """Validate JavaScript syntax in all HTML files"""
    files_to_check = [
        'index.html',
        'en/index.html', 
        'de/index.html',
        'es/index.html', 
        'pt/index.html'
    ]
    
    print("🔍 JavaScript Syntax Validation")
    print("=" * 40)
    
    all_passed = True
    
    for filepath in files_to_check:
        if os.path.exists(filepath):
            is_valid, message = extract_and_validate_js(filepath)
            status = "✅ PASS" if is_valid else "❌ FAIL"
            print(f"{filepath:20} {status}")
            
            if not is_valid:
                print(f"   Error: {message}")
                all_passed = False
        else:
            print(f"{filepath:20} ⚠️  File not found")
    
    print("=" * 40)
    if all_passed:
        print("🎉 All files passed JavaScript syntax validation!")
        return 0
    else:
        print("🚨 JavaScript syntax errors found - fix before release!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
