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
    
    # Get the word being translated
    translated_word = content[start_pos:end_pos]
    
    # Get wider context for analysis
    context_before = before[-100:] if len(before) > 100 else before
    context_after = after[:100] if len(after) > 100 else after
    full_context = context_before + translated_word + context_after
    
    # CRITICAL: Protect JavaScript function names and method calls
    # Check if this word is part of a JavaScript function name
    if re.search(r'(function\s+\w*' + re.escape(translated_word) + r'\w*\s*\()', full_context):
        return True
    
    # Protect JavaScript method calls (.method or object.method)
    if re.search(r'\.\s*' + re.escape(translated_word) + r'[A-Z]', full_context):
        return True
        
    # Protect camelCase function names that contain the word
    if re.search(r'\w+' + re.escape(translated_word) + r'[A-Z]\w*\s*\(', full_context):
        return True
        
    # Protect JavaScript keywords in code context
    js_contexts = [
        r'\s+for\s*\(',                    # for loops
        r'\.forEach\s*\(',                 # forEach method calls
        r'\.for[A-Z]\w*\s*\(',            # any for* method calls
        r'function\s+\w*for\w*\s*\(',     # functions containing "for"
        r'function\s+\w*Timeline\w*\s*\(',# functions containing "Timeline"
        r'function\s+\w*Error\w*\s*\(',   # functions containing "Error"
        r'clear\w*Timeline\w*\s*\(',      # clear*Timeline* functions
        r'generate\w*Timeline\w*\s*\(',   # generate*Timeline* functions
    ]
    
    for js_pattern in js_contexts:
        if re.search(js_pattern, full_context, re.IGNORECASE):
            return True
    
    # CRITICAL: Protect JavaScript method names and keywords
    js_keywords = ['for', 'forEach', 'if', 'else', 'function', 'const', 'let', 'var']
    if translated_word in js_keywords:
        # Protect JavaScript for loops
        if translated_word == 'for' and re.search(r'\s*\(\s*(const|let|var)\s+', context_after):
            return True
        
        # Protect JavaScript for-in/for-of loops  
        if translated_word == 'for' and re.search(r'\s*\(\s*\w+\s+(in|of)\s+', context_after):
            return True
    
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
