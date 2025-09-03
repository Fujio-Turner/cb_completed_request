#!/usr/bin/env python3
"""
Apply Missing Translations to Localized HTML Files

This script finds and translates the English TEXT_CONSTANTS that were missed
in previous translation rounds.
"""

import json
import re
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_missing_translations(file_path, language_code, translations):
    """Apply missing translations to a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Apply translations for new TEXT_CONSTANTS
        new_translations = {
            'ALL_CACHES_CLEARED: "All caches cleared for new JSON parse",': f'ALL_CACHES_CLEARED: "{translations["ui_strings"]["All caches cleared for new JSON parse"][language_code]}",',
            'FAILED_COPY_CLIPBOARD: "Failed to copy to clipboard",': f'FAILED_COPY_CLIPBOARD: "{translations["ui_strings"]["Failed to copy to clipboard"][language_code]}",',
            'SHOW_SAMPLE_QUERIES: "Show Sample Queries",': f'SHOW_SAMPLE_QUERIES: "{translations["ui_strings"]["Show Sample Queries"][language_code]}",',
            'ERROR_GENERATING_UI: "Error generating UI:",': f'ERROR_GENERATING_UI: "{translations["ui_strings"]["Error generating UI:"][language_code]}",',
            'STATEMENT_NOT_FOUND: "Statement not found",': f'STATEMENT_NOT_FOUND: "{translations["ui_strings"]["Statement not found"][language_code]}",',
            'JSON_PARSING_ERROR: "JSON parsing error:",': f'JSON_PARSING_ERROR: "{translations["ui_strings"]["JSON parsing error:"][language_code]}",',
            'ERROR_PROCESSING_REQUEST: "Error processing request",': f'ERROR_PROCESSING_REQUEST: "{translations["ui_strings"]["Error processing request"][language_code]}",',
            'ERROR_LAZY_LOADING: "Error lazy loading",': f'ERROR_LAZY_LOADING: "{translations["ui_strings"]["Error lazy loading"][language_code]}",',
            'NO_EXECUTION_PLAN: "No execution plan available.",': f'NO_EXECUTION_PLAN: "{translations["ui_strings"]["No execution plan available."][language_code]}",',
            'NO_OPERATORS_FOUND: "No operators found in the execution plan.",': f'NO_OPERATORS_FOUND: "{translations["ui_strings"]["No operators found in the execution plan."][language_code]}",',
            
            # Additional common strings that might need translation
            '"Please paste your JSON data first"': f'"{translations["ui_strings"]["Please paste your JSON data first"][language_code]}"',
            '"Analyze Another Query"': f'"{translations["ui_strings"]["Analyze Another Query"][language_code]}"',
            '"Query data parsed successfully"': f'"{translations["ui_strings"]["Query data parsed successfully"][language_code]}"',
            '"No JSON data to analyze"': f'"{translations["ui_strings"]["No JSON data to analyze"][language_code]}"',
            '"Export Data"': f'"{translations["ui_strings"]["Export Data"][language_code]}"',
            '"Clear Data"': f'"{translations["ui_strings"]["Clear Data"][language_code]}"',
            '"Download"': f'"{translations["ui_strings"]["Download"][language_code]}"',
            '"Print"': f'"{translations["ui_strings"]["Print"][language_code]}"',
            '"Error"': f'"{translations["ui_strings"]["Error"][language_code]}"',
            '"Warning"': f'"{translations["ui_strings"]["Warning"][language_code]}"',
            '"Success"': f'"{translations["ui_strings"]["Success"][language_code]}"',
            '"Loading"': f'"{translations["ui_strings"]["Loading"][language_code]}"',
        }
        
        # Apply each translation
        for english_text, translated_text in new_translations.items():
            if english_text in content:
                old_content = content
                content = content.replace(english_text, translated_text)
                if content != old_content:
                    changes_made += 1
                    print(f"  ✅ Translated: {english_text[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} translations to {file_path}")
        else:
            print(f"  ℹ️ No missing translations found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply missing translations"""
    
    print("🌍 Applying Missing Translations to Localized Files")
    print("=" * 60)
    
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
            changes = apply_missing_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Missing translations have been applied!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All translations are already up to date!")

if __name__ == "__main__":
    main()
