#!/usr/bin/env python3
"""
Quick fix for broken JavaScript strings in localized HTML files
"""

import re

def fix_broken_strings(file_path):
    """Fix broken JavaScript string literals by adding proper concatenation"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix broken strings in JavaScript code sections
    # Pattern: "text followed by newline and more text"
    broken_string_pattern = r'"([^"]*)\n([^"]*)"'
    
    def fix_string(match):
        part1 = match.group(1)
        part2 = match.group(2)
        return f'"{part1}" +\n"{part2}"'
    
    # Apply the fix
    fixed_content = re.sub(broken_string_pattern, fix_string, content)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"✅ Fixed broken strings in {file_path}")

# Fix all language files
languages = ['de', 'es', 'pt']
for lang in languages:
    file_path = f"{lang}/index.html"
    fix_broken_strings(file_path)
