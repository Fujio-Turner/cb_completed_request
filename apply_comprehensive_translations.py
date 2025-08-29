#!/usr/bin/env python3
"""
Comprehensive Translation Script for Couchbase Query Analyzer
Handles complex patterns, JavaScript template literals, chart configurations, and edge cases
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

def apply_comprehensive_translations(html_content, translations, language_code):
    """Apply comprehensive translations handling all edge cases"""
    
    # Update language attribute
    html_content = re.sub(r'<html lang="[^"]*">', f'<html lang="{language_code}">', html_content)
    
    # Apply UI strings translations
    for english, translations_dict in translations['ui_strings'].items():
        if language_code in translations_dict:
            target_lang = translations_dict[language_code]
            
            # 1. HTML text content between tags (most common)
            html_content = re.sub(f'>{re.escape(english)}<', f'>{target_lang}<', html_content)
            
            # 2. Button text inside button tags
            html_content = re.sub(
                f'(<button[^>]*>){re.escape(english)}(</button>)',
                rf'\1{target_lang}\2',
                html_content
            )
            
            # 3. HTML attributes
            html_content = re.sub(f'placeholder="{re.escape(english)}"', f'placeholder="{target_lang}"', html_content)
            html_content = re.sub(f'title="{re.escape(english)}"', f'title="{target_lang}"', html_content)
            html_content = re.sub(f'alt="{re.escape(english)}"', f'alt="{target_lang}"', html_content)
            html_content = re.sub(f'aria-label="{re.escape(english)}"', f'aria-label="{target_lang}"', html_content)
            
            # 4. JavaScript string literals (double quotes)
            html_content = re.sub(f'"{re.escape(english)}"', f'"{target_lang}"', html_content)
            
            # 5. JavaScript string literals (single quotes)
            html_content = re.sub(f"'{re.escape(english)}'", f"'{target_lang}'", html_content)
            
            # 6. Template literals
            html_content = re.sub(f'`{re.escape(english)}`', f'`{target_lang}`', html_content)
            
            # 7. Chart.js configurations - text properties
            html_content = re.sub(f'text:\\s*"{re.escape(english)}"', f'text: "{target_lang}"', html_content)
            html_content = re.sub(f"text:\\s*'{re.escape(english)}'", f"text: '{target_lang}'", html_content)
            
            # 8. Chart.js configurations - label properties
            html_content = re.sub(f'label:\\s*"{re.escape(english)}"', f'label: "{target_lang}"', html_content)
            html_content = re.sub(f"label:\\s*'{re.escape(english)}'", f"label: '{target_lang}'", html_content)
            
            # 9. JavaScript textContent assignments
            html_content = re.sub(
                f'(textContent\\s*=\\s*)"{re.escape(english)}"',
                rf'\1"{target_lang}"',
                html_content
            )
            html_content = re.sub(
                f"(textContent\\s*=\\s*)'{re.escape(english)}'",
                rf"\1'{target_lang}'",
                html_content
            )
            
            # 10. JavaScript innerHTML assignments
            html_content = re.sub(
                f'(innerHTML\\s*=\\s*)"{re.escape(english)}"',
                rf'\1"{target_lang}"',
                html_content
            )
            html_content = re.sub(
                f"(innerHTML\\s*=\\s*)'{re.escape(english)}'",
                rf"\1'{target_lang}'",
                html_content
            )
            
            # 11. Template literals with HTML inside (CRITICAL pattern)
            html_content = re.sub(
                f'(`[^`]*){re.escape(english)}([^`]*`)',
                rf'\1{target_lang}\2',
                html_content
            )
            
            # 12. HTML generation in JavaScript strings
            html_content = re.sub(
                f'(<[^>]*>){re.escape(english)}(<[^>]*>)',
                rf'\1{target_lang}\2',
                html_content
            )
            
            # 13. Console messages and alerts
            html_content = re.sub(f'(console\\.log\\([\'"]){re.escape(english)}([\'"]\\))', rf'\1{target_lang}\2', html_content)
            html_content = re.sub(f'(alert\\([\'"]){re.escape(english)}([\'"]\\))', rf'\1{target_lang}\2', html_content)
            html_content = re.sub(f'(confirm\\([\'"]){re.escape(english)}([\'"]\\))', rf'\1{target_lang}\2', html_content)
    
    # Apply JavaScript variable translations
    for var_name, translations_dict in translations['javascript_variables'].items():
        if language_code in translations_dict:
            target_lang = translations_dict[language_code]
            
            # Handle scanCounts variables
            if 'scanCounts_' in var_name:
                original_key = var_name.split('_')[1].title()  # yes -> Yes, no -> No
                
                # Object property access patterns
                html_content = re.sub(f'scanCounts\\["{original_key}"\\]', f'scanCounts["{target_lang}"]', html_content)
                html_content = re.sub(f'scanCounts\\.{original_key}', f'scanCounts["{target_lang}"]', html_content)
                
                # Chart data array patterns
                html_content = re.sub(f'data:\\s*\\[scanCounts\\["{original_key}"\\]', f'data: [scanCounts["{target_lang}"]', html_content)
                html_content = re.sub(f'data:\\s*\\[scanCounts\\.{original_key}', f'data: [scanCounts["{target_lang}"]', html_content)
    
    # Apply time unit translations
    if 'time_units' in translations:
        for english_unit, translations_dict in translations['time_units'].items():
            if language_code in translations_dict:
                target_unit = translations_dict[language_code]
                # Handle time units in various contexts
                html_content = re.sub(f'\\b{english_unit}\\b', target_unit, html_content)
    
    return html_content

def validate_translation(file_path, language_code):
    """Run validation checks to find remaining untranslated content"""
    
    print(f"\n🔍 Validating {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # Check for common English patterns that should be translated
    english_patterns = [
        r'>Copy<',
        r'>Show<',
        r'>Hide<',
        r'>Reset<',
        r'placeholder="[^"]*[A-Z][^"]*"',
        r'textContent.*=.*"[^"]*[A-Z][^"]*"',
        r'innerHTML.*=.*"[^"]*[A-Z][^"]*"'
    ]
    
    for pattern in english_patterns:
        matches = re.findall(pattern, content)
        if matches:
            issues.append(f"Found potential untranslated content: {pattern} -> {matches[:3]}...")  # Show first 3 matches
    
    if issues:
        print(f"⚠️ Found {len(issues)} potential translation issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ No obvious translation issues found")
    
    return len(issues) == 0

def process_language(language_code, translations):
    """Process translations for a specific language"""
    
    language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
    language_name = language_names.get(language_code, language_code)
    
    file_path = Path(f'{language_code}/index.html')
    
    if not file_path.exists():
        print(f"❌ Error: {file_path} not found")
        return False
    
    print(f"\n🌍 Processing {language_name} translations...")
    
    # Read the HTML file
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Apply comprehensive translations
    translated_content = apply_comprehensive_translations(html_content, translations, language_code)
    
    # Write the translated content back
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        print(f"✅ {language_name} translations applied successfully")
        
        # Validate the translation
        is_valid = validate_translation(file_path, language_code)
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error writing {language_name} file: {e}")
        return False

def main():
    """Main function to apply comprehensive translations"""
    
    print("🚀 Starting comprehensive translation process...")
    
    # Load translations
    translations = load_translations()
    
    # Process each language
    languages = ['de', 'es', 'pt']
    results = {}
    
    for lang in languages:
        results[lang] = process_language(lang, translations)
    
    # Summary
    print("\n📊 Translation Summary:")
    for lang, success in results.items():
        status = "✅ Complete" if success else "⚠️ Needs Review"
        language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
        print(f"  {language_names[lang]}: {status}")
    
    all_successful = all(results.values())
    if all_successful:
        print("\n🎉 All translations completed successfully!")
    else:
        print("\n⚠️ Some translations may need manual review. Check the validation messages above.")

if __name__ == '__main__':
    main()
