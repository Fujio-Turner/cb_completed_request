#!/usr/bin/env python3
"""
Apply Comprehensive Translations

This script applies ALL translations from settings/translations.json
while protecting JavaScript syntax and technical elements.

Usage: python apply_comprehensive_translations.py [language_code]
Example: python apply_comprehensive_translations.py es
"""

import sys
import json
import re
import os

def load_translations():
    """Load all translations from JSON file"""
    try:
        with open('settings/translations.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Error: settings/translations.json not found")
        return None

def is_protected_context(content, start_pos, end_pos):
    """Check if text position is in a protected JavaScript/CSS context"""
    
    # Get surrounding context
    before = content[:start_pos]
    after = content[end_pos:]
    
    # Protected patterns - DO NOT translate these contexts
    protected_patterns = [
        r'function\s+\w+\s*\(',         # Function definitions
        r'const\s+\w+\s*=',             # Variable declarations  
        r'let\s+\w+\s*=',               # Variable declarations
        r'\.getElementById\s*\(',        # DOM selectors
        r'\.querySelector\s*\(',        # CSS selectors
        r'id\s*=\s*["\']',              # HTML id attributes
        r'class\s*=\s*["\']',           # HTML class attributes
        r'onclick\s*=\s*["\']',         # Event handlers
        r'console\.log\s*\(',           # Debug statements (keep English)
        r'//.*',                        # Comments
        r'/\*.*?\*/',                   # Block comments
    ]
    
    # Check if we're inside any protected pattern
    context_before = before[-100:] if len(before) > 100 else before
    context_after = after[:100] if len(after) > 100 else after
    full_context = context_before + content[start_pos:end_pos] + context_after
    
    for pattern in protected_patterns:
        if re.search(pattern, full_context):
            return True
    
    return False

def apply_comprehensive_translations(file_path, language_code, translations):
    """Apply all translations from JSON file safely"""
    
    print(f"🔄 Applying comprehensive {language_code.upper()} translations to {file_path}")
    print("=" * 60)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = 0
        skipped_protected = 0
        
        # Get UI strings for this language
        ui_strings = translations.get("ui_strings", {})
        
        # Sort by length (longest first) to avoid partial replacements
        sorted_translations = sorted(ui_strings.items(), key=lambda x: len(x[0]), reverse=True)
        
        for english_text, translations_dict in sorted_translations:
            if language_code not in translations_dict:
                continue
                
            translated_text = translations_dict[language_code]
            
            # Skip if English and translated are the same
            if english_text == translated_text:
                continue
            
            # Find all occurrences
            start = 0
            while True:
                pos = content.find(english_text, start)
                if pos == -1:
                    break
                
                # Check if this occurrence is in a protected context
                end_pos = pos + len(english_text)
                if is_protected_context(content, pos, end_pos):
                    skipped_protected += 1
                    start = end_pos
                    continue
                
                # Apply translation
                content = content[:pos] + translated_text + content[end_pos:]
                changes_made += 1
                print(f"  ✅ {english_text[:40]}... → {translated_text[:40]}...")
                
                # Update start position for next search
                start = pos + len(translated_text)
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\n📊 Translation Summary:")
            print(f"   ✅ Translations applied: {changes_made}")
            print(f"   🛡️ Protected (skipped): {skipped_protected}")
            print(f"   📁 File: {file_path}")
            
            return True
        else:
            print(f"  ℹ️ No translations needed in {file_path}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main function"""
    
    if len(sys.argv) != 2:
        print("Usage: python apply_comprehensive_translations.py [language_code]")
        print("Example: python apply_comprehensive_translations.py es")
        sys.exit(1)
    
    language_code = sys.argv[1].lower()
    file_path = f"{language_code}/index.html"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        print(f"💡 Make sure to copy en/index.html to {file_path} first")
        sys.exit(1)
    
    # Load translations
    translations = load_translations()
    if not translations:
        sys.exit(1)
    
    # Apply translations
    success = apply_comprehensive_translations(file_path, language_code, translations)
    
    if success:
        print(f"\n🎉 Comprehensive translation complete for {language_code.upper()}!")
        print(f"🔍 Next steps:")
        print(f"   1. Run: python3 python/validate_js_syntax.py")
        print(f"   2. Run: python3 python/validate_html_attributes.py") 
        print(f"   3. Test {file_path} in browser")
    else:
        print(f"\n⚠️ No changes applied to {file_path}")

if __name__ == "__main__":
    main()
