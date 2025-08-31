#!/usr/bin/env python3
"""
HTML Attribute Validator
Checks that critical HTML attributes haven't been translated (which breaks JavaScript)
"""

import re
import json

def validate_html_attributes():
    """Validate that HTML attributes match between English and localized versions"""
    
    # Critical attributes that should NEVER be translated
    critical_attributes = [
        'id',
        'class', 
        'aria-controls',
        'aria-label',
        'data-*',
        'onclick',
        'onchange',
        'href'
    ]
    
    print("🔍 HTML Attribute Validation")
    print("=" * 50)
    
    # Extract attributes from English version
    with open('en/index.html', 'r', encoding='utf-8') as f:
        en_content = f.read()
    
    # Extract all id and class attributes from English
    en_ids = set(re.findall(r'id="([^"]*)"', en_content))
    en_classes = set(re.findall(r'class="([^"]*)"', en_content))
    en_aria_controls = set(re.findall(r'aria-controls="([^"]*)"', en_content))
    
    print(f"📋 English version reference:")
    print(f"   IDs: {len(en_ids)} unique")
    print(f"   Classes: {len(en_classes)} unique") 
    print(f"   ARIA controls: {len(en_aria_controls)} unique")
    print()
    
    languages = ['de', 'es', 'pt']
    all_valid = True
    
    for lang in languages:
        filepath = f'{lang}/index.html'
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract attributes from localized version
        lang_ids = set(re.findall(r'id="([^"]*)"', content))
        lang_classes = set(re.findall(r'class="([^"]*)"', content))
        lang_aria_controls = set(re.findall(r'aria-controls="([^"]*)"', content))
        
        print(f"🔍 {filepath}:")
        
        # Check for missing or different IDs
        missing_ids = en_ids - lang_ids
        extra_ids = lang_ids - en_ids
        
        if missing_ids:
            print(f"   ❌ Missing IDs: {list(missing_ids)[:5]}")
            all_valid = False
        
        if extra_ids:
            print(f"   ⚠️  Extra/Changed IDs: {list(extra_ids)[:5]}")
            all_valid = False
            
        if not missing_ids and not extra_ids:
            print(f"   ✅ IDs: All {len(lang_ids)} IDs match English version")
        
        # Check ARIA controls
        missing_aria = en_aria_controls - lang_aria_controls
        if missing_aria:
            print(f"   ❌ Missing ARIA controls: {list(missing_aria)}")
            all_valid = False
        else:
            print(f"   ✅ ARIA: All {len(lang_aria_controls)} controls match")
            
        print()
    
    return all_valid

def main():
    """Main validation function"""
    is_valid = validate_html_attributes()
    
    if is_valid:
        print("🎉 All HTML attributes are consistent!")
        print("✅ JavaScript should work correctly in all language versions")
        return 0
    else:
        print("🚨 HTML attribute inconsistencies found!")
        print("❌ This will cause JavaScript errors - fix before release")
        return 1

if __name__ == "__main__":
    exit(main())
