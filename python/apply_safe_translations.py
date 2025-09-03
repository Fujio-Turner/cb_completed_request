#!/usr/bin/env python3
"""
Safe Translation Script for Couchbase Query Analyzer
Applies translations while avoiding JavaScript syntax errors
"""

import json
import re
import sys
from pathlib import Path

def load_translations():
    """Load translations from JSON file"""
    try:
        with open('settings/translations.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: settings/translations.json not found")
        sys.exit(1)

def apply_safe_translations(html_content, translations, language_code):
    """Apply translations while avoiding JavaScript syntax issues"""
    
    # Update language attribute
    html_content = re.sub(r'<html lang="[^"]*">', f'<html lang="{language_code}">', html_content)
    
    # Apply UI strings translations - but avoid ones with \n that break JS
    for english, translations_dict in translations['ui_strings'].items():
        if language_code in translations_dict:
            target_lang = translations_dict[language_code]
            
            # Skip translations that contain problematic characters
            if any(char in target_lang for char in ['\\n', '\n', '\r', '\\r']):
                continue
            
            # Skip translations that might contain regex special chars that break substitution
            if any(char in target_lang for char in ['\\1', '\\2', '\\3', '\\4', '\\5']):
                continue
                
            # 1. HTML text content between tags (safe)
            html_content = re.sub(f'>{re.escape(english)}<', f'>{target_lang}<', html_content)
            
            # 2. HTML attributes (safe)
            html_content = re.sub(f'placeholder="{re.escape(english)}"', f'placeholder="{target_lang}"', html_content)
            html_content = re.sub(f'title="{re.escape(english)}"', f'title="{target_lang}"', html_content)
            html_content = re.sub(f'alt="{re.escape(english)}"', f'alt="{target_lang}"', html_content)
            html_content = re.sub(f'aria-label="{re.escape(english)}"', f'aria-label="{target_lang}"', html_content)
            
            # 3. Button text (safe) - use manual replacement
            button_pattern = f'(<button[^>]*>){re.escape(english)}(</button>)'
            matches = re.finditer(button_pattern, html_content)
            for match in list(matches):  # Convert to list to avoid modification during iteration
                replacement = match.group(1) + target_lang + match.group(2)
                html_content = html_content.replace(match.group(0), replacement)
            
            # 4. JavaScript string literals - but only simple ones without special chars
            if all(c not in english for c in ['\n', '\r', '\\n', '\\r']) and len(english.strip()) > 0:
                # Simple replacements for short strings
                if len(english) < 50:  # Avoid long strings that might be complex
                    html_content = re.sub(f'"{re.escape(english)}"', f'"{target_lang}"', html_content)
                    html_content = re.sub(f"'{re.escape(english)}'", f"'{target_lang}'", html_content)
            
            # 5. Chart.js configurations - only simple titles
            if len(english) < 100:
                html_content = re.sub(f'text:\\s*"{re.escape(english)}"', f'text: "{target_lang}"', html_content)
                html_content = re.sub(f'label:\\s*"{re.escape(english)}"', f'label: "{target_lang}"', html_content)
    
    return html_content

def process_language(language_code, translations):
    """Process translations for a specific language"""
    
    language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
    language_name = language_names.get(language_code, language_code)
    
    file_path = Path(f'{language_code}/index.html')
    
    if not file_path.exists():
        print(f"❌ Error: {file_path} not found")
        return False
    
    print(f"\n🌍 Processing {language_name} translations (safe mode)...")
    
    # Read the HTML file
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Apply safe translations
    translated_content = apply_safe_translations(html_content, translations, language_code)
    
    # Write the translated content back
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        print(f"✅ {language_name} safe translations applied successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error writing {language_name} file: {e}")
        return False

def main():
    """Main function to apply safe translations"""
    
    print("🚀 Starting safe translation process...")
    
    # Load translations
    translations = load_translations()
    
    # Process each language
    languages = ['de', 'es', 'pt']
    results = {}
    
    for lang in languages:
        results[lang] = process_language(lang, translations)
    
    # Summary
    print("\n📊 Safe Translation Summary:")
    for lang, success in results.items():
        status = "✅ Complete" if success else "❌ Failed"
        language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
        print(f"  {language_names[lang]}: {status}")
    
    all_successful = all(results.values())
    if all_successful:
        print("\n🎉 All safe translations completed successfully!")
    else:
        print("\n⚠️ Some translations failed. Check errors above.")

if __name__ == '__main__':
    main()
