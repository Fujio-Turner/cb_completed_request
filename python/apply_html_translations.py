#!/usr/bin/env python3
"""
Apply HTML Content Translations to Localized Files

This script translates HTML content (headers, chart titles, etc.) in addition to TEXT_CONSTANTS.
"""

import json
import re
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_html_translations(file_path, language_code, translations):
    """Apply HTML content translations to a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} HTML translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # HTML content translations
        html_translations = {
            '<h3 class="chart-title fixed-height">Index Type Usage</h3>': f'<h3 class="chart-title fixed-height">{translations["ui_strings"]["Index Type Usage"][language_code]}</h3>',
            '<h3 class="chart-card-header">Index Scan Consistency</h3>': f'<h3 class="chart-card-header">{translations["ui_strings"]["Index Scan Consistency"][language_code]}</h3>',
            
            # Date validation messages (if present in HTML)
            'Please enter date in YYYY-MM-DD format': translations["ui_strings"]["Please enter date in YYYY-MM-DD format"][language_code],
            'Invalid date format': translations["ui_strings"]["Invalid date format"][language_code],
            'Start date cannot be after end date': translations["ui_strings"]["Start date cannot be after end date"][language_code],
        }
        
        # Apply each translation
        for english_html, translated_html in html_translations.items():
            if english_html in content:
                old_content = content
                content = content.replace(english_html, translated_html)
                if content != old_content:
                    changes_made += 1
                    print(f"  ✅ Translated: {english_html[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} HTML translations to {file_path}")
        else:
            print(f"  ℹ️ No missing HTML translations found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply HTML translations"""
    
    print("🌍 Applying HTML Content Translations to Localized Files")
    print("=" * 65)
    
    # Load translations
    translations = load_translations()
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'),
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = apply_html_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 HTML Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ HTML translations have been applied!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All HTML translations are already up to date!")

if __name__ == "__main__":
    main()
