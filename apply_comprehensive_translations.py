#!/usr/bin/env python3

import json
import re
import sys
import os

def apply_translations_to_file(file_path, language, translations):
    """Apply all translations from the translations.json file to a localized HTML file."""
    
    print(f"Processing {file_path} for language '{language}'...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = 0
    
    # Apply UI strings translations
    if 'ui_strings' in translations:
        for english_text, translations_dict in translations['ui_strings'].items():
            if language in translations_dict:
                localized_text = translations_dict[language]
                
                # Skip if it's the same text (like German "Query Analyzer")
                if english_text == localized_text:
                    continue
                    
                # Replace in various contexts
                patterns = [
                    f'>{english_text}<',  # Between tags
                    f'"{english_text}"',  # In attributes
                    f"'{english_text}'",  # In single quotes
                    f'`{english_text}`',  # In backticks
                    f'textContent = "{english_text}"',  # JavaScript assignments
                    f"textContent = '{english_text}'",
                    f'innerHTML = "{english_text}"',
                    f"innerHTML = '{english_text}'",
                    f'text: "{english_text}"',  # Chart configurations
                    f"text: '{english_text}'",
                    f'label: "{english_text}"',  # Chart labels
                    f"label: '{english_text}'",
                    f'title: "{english_text}"',  # Titles
                    f"title: '{english_text}'",
                ]
                
                for pattern in patterns:
                    new_pattern = pattern.replace(english_text, localized_text)
                    if pattern != new_pattern:
                        old_content = content
                        content = content.replace(pattern, new_pattern)
                        if content != old_content:
                            changes_made += 1
                            print(f"  ✓ Replaced: {pattern} → {new_pattern}")
    
    # Apply JavaScript variable translations
    if 'javascript_variables' in translations:
        for var_key, translations_dict in translations['javascript_variables'].items():
            if language in translations_dict:
                localized_text = translations_dict[language]
                
                # Handle Yes/No in scan counts
                if var_key == 'scanCounts_yes':
                    patterns = [
                        'scanCounts = { "Yes"',
                        "scanCounts = { 'Yes'",
                        'scanCounts["Yes"]',
                        "scanCounts['Yes']",
                        'data: [scanCounts.Yes',
                        'data: [scanCounts["Yes"]',
                        "data: [scanCounts['Yes']",
                    ]
                    replacements = [
                        f'scanCounts = {{ "{localized_text}"',
                        f"scanCounts = {{ '{localized_text}'",
                        f'scanCounts["{localized_text}"]',
                        f"scanCounts['{localized_text}']",
                        f'data: [scanCounts["{localized_text}"]',
                        f'data: [scanCounts["{localized_text}"]',
                        f"data: [scanCounts['{localized_text}']",
                    ]
                    
                elif var_key == 'scanCounts_no':
                    patterns = [
                        'scanCounts = { "Yes": yesCount, "No"',
                        "scanCounts = { 'Yes': yesCount, 'No'",
                        'scanCounts["No"]',
                        "scanCounts['No']",
                        'data: [scanCounts.Yes, scanCounts.No',
                        'data: [scanCounts["Yes"], scanCounts["No"]',
                        "data: [scanCounts['Yes'], scanCounts['No']",
                    ]
                    replacements = [
                        f'scanCounts = {{ "{translations["javascript_variables"]["scanCounts_yes"][language]}": yesCount, "{localized_text}"',
                        f"scanCounts = {{ '{translations['javascript_variables']['scanCounts_yes'][language]}': yesCount, '{localized_text}'",
                        f'scanCounts["{localized_text}"]',
                        f"scanCounts['{localized_text}']",
                        f'data: [scanCounts["{translations["javascript_variables"]["scanCounts_yes"][language]}"], scanCounts["{localized_text}"]',
                        f'data: [scanCounts["{translations["javascript_variables"]["scanCounts_yes"][language]}"], scanCounts["{localized_text}"]',
                        f"data: [scanCounts['{translations['javascript_variables']['scanCounts_yes'][language]}'], scanCounts['{localized_text}']]",
                    ]
                
                else:
                    continue
                
                for pattern, replacement in zip(patterns, replacements):
                    if pattern != replacement:
                        old_content = content
                        content = content.replace(pattern, replacement)
                        if content != old_content:
                            changes_made += 1
                            print(f"  ✓ Replaced JS variable: {pattern} → {replacement}")
    
    # Special handling for chart labels arrays
    chart_label_replacements = [
        ('labels: ["Yes", "No"]', f'labels: ["{translations["javascript_variables"]["scanCounts_yes"][language]}", "{translations["javascript_variables"]["scanCounts_no"][language]}"]'),
        ("labels: ['Yes', 'No']", f"labels: ['{translations['javascript_variables']['scanCounts_yes'][language]}', '{translations['javascript_variables']['scanCounts_no'][language]}']"),
    ]
    
    for old_pattern, new_pattern in chart_label_replacements:
        if old_pattern in content and old_pattern != new_pattern:
            content = content.replace(old_pattern, new_pattern)
            changes_made += 1
            print(f"  ✓ Replaced chart labels: {old_pattern} → {new_pattern}")
    
    # Write the updated content back to file
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Applied {changes_made} translations to {file_path}")
    else:
        print(f"ℹ️  No changes needed for {file_path}")
    
    return changes_made

def main():
    """Main function to apply translations to all language files."""
    
    # Load translations
    translations_file = '/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/settings/translations.json'
    with open(translations_file, 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    # Language file mappings
    language_files = {
        'de': '/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/de/index.html',
        'es': '/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/es/index.html',
        'pt': '/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/pt/index.html'
    }
    
    total_changes = 0
    
    for language, file_path in language_files.items():
        if os.path.exists(file_path):
            changes = apply_translations_to_file(file_path, language, translations)
            total_changes += changes
        else:
            print(f"❌ File not found: {file_path}")
    
    print(f"\n🎉 Localization complete! Applied {total_changes} total changes across all files.")
    
    # Additional manual fixes needed
    print("\n⚠️  Manual fixes still needed:")
    print("1. Check for remaining English text in tabs and buttons")
    print("2. Verify chart configurations are properly translated")
    print("3. Run validation commands to find missed content")
    print("4. Test functionality in each language")

if __name__ == '__main__':
    main()
