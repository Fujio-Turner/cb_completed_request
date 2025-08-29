#!/usr/bin/env python3
"""
German Translation Script for Couchbase Query Analyzer
Applies all German translations from settings/translations.json to de/index.html
"""

import json
import re
import sys

def load_translations():
    """Load translations from JSON file"""
    try:
        with open('settings/translations.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Error: settings/translations.json not found")
        sys.exit(1)

def apply_translations(html_content, translations):
    """Apply all German translations to HTML content"""
    
    # Apply UI strings translations
    for english, translations_dict in translations['ui_strings'].items():
        if 'de' in translations_dict:
            german = translations_dict['de']
            
            # HTML text content (between tags)
            html_content = re.sub(f'>{re.escape(english)}<', f'>{german}<', html_content)
            
            # Button text
            html_content = re.sub(f'<button[^>]*>{re.escape(english)}</button>', lambda m: m.group(0).replace(english, german), html_content)
            
            # Placeholder attributes
            html_content = re.sub(f'placeholder="{re.escape(english)}"', f'placeholder="{german}"', html_content)
            
            # Title attributes  
            html_content = re.sub(f'title="{re.escape(english)}"', f'title="{german}"', html_content)
            
            # JavaScript string literals
            html_content = re.sub(f'"{re.escape(english)}"', f'"{german}"', html_content)
            html_content = re.sub(f"'{re.escape(english)}'", f"'{german}'", html_content)
            
            # Template literals
            html_content = re.sub(f'`{re.escape(english)}`', f'`{german}`', html_content)
            
            # Chart configurations - handle special patterns
            if 'title' in english.lower() or 'text' in english.lower():
                html_content = re.sub(f'text:\\s*"{re.escape(english)}"', f'text: "{german}"', html_content)
            
            if 'label' in english.lower():
                html_content = re.sub(f'label:\\s*"{re.escape(english)}"', f'label: "{german}"', html_content)

    # Apply JavaScript variable translations
    for var_name, translations_dict in translations['javascript_variables'].items():
        if 'de' in translations_dict:
            german = translations_dict['de']
            # Handle special variables like scanCounts
            if 'scanCounts_' in var_name:
                original_key = var_name.split('_')[1].title()  # yes -> Yes, no -> No
                html_content = re.sub(f'"{original_key}"', f'"{german}"', html_content)
                html_content = re.sub(f"'{original_key}'", f"'{german}'", html_content)

    return html_content

def main():
    """Main function to apply German translations"""
    
    # Load translations
    translations = load_translations()
    
    # Read the German HTML file
    try:
        with open('de/index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print("Error: de/index.html not found")
        sys.exit(1)
    
    print("Applying German translations...")
    
    # Apply translations
    translated_content = apply_translations(html_content, translations)
    
    # Write the translated content back
    try:
        with open('de/index.html', 'w', encoding='utf-8') as f:
            f.write(translated_content)
        print("✅ German translations applied successfully to de/index.html")
    except Exception as e:
        print(f"Error writing translated file: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
