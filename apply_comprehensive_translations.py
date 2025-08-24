#!/usr/bin/env python3
"""
Comprehensive Translation Applier for Couchbase Query Analyzer
Applies ALL translations from settings/translations.json to localized HTML files
"""
import json
import re
import os
from pathlib import Path

# Load translations
with open('settings/translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

def apply_translations_to_file(source_file, target_file, language_code):
    """Apply comprehensive translations to a specific file"""
    print(f"\n🌍 Processing {target_file} for language: {language_code}")
    
    # Read the file content
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    translation_count = 0
    
    # Apply UI string translations
    ui_strings = translations.get('ui_strings', {})
    for english_text, lang_translations in ui_strings.items():
        if language_code in lang_translations:
            translated_text = lang_translations[language_code]
            
            # Multiple replacement patterns for different contexts
            patterns = [
                # HTML content between tags
                f'>{re.escape(english_text)}<',
                # Button text content
                f'>{re.escape(english_text)}</button>',
                f'>{re.escape(english_text)}</a>',
                # Placeholder attributes
                f'placeholder="{re.escape(english_text)}"',
                # Title attributes
                f'title="{re.escape(english_text)}"',
                # JavaScript string literals (single quotes)
                f"'{re.escape(english_text)}'",
                # JavaScript string literals (double quotes)
                f'"{re.escape(english_text)}"',
                # Template literals in backticks
                f'`{re.escape(english_text)}`',
                # Chart titles and labels
                f'text: "{re.escape(english_text)}"',
                f'title: "{re.escape(english_text)}"',
                f'label: "{re.escape(english_text)}"',
                # innerHTML and textContent assignments
                f'= "{re.escape(english_text)}";',
                f"= '{re.escape(english_text)}';",
            ]
            
            for pattern in patterns:
                if english_text in content:
                    # Create corresponding replacement pattern
                    if pattern.startswith('>') and pattern.endswith('<'):
                        replacement = f'>{translated_text}<'
                    elif pattern.endswith('</button>'):
                        replacement = f'>{translated_text}</button>'
                    elif pattern.endswith('</a>'):
                        replacement = f'>{translated_text}</a>'
                    elif pattern.startswith('placeholder='):
                        replacement = f'placeholder="{translated_text}"'
                    elif pattern.startswith('title='):
                        replacement = f'title="{translated_text}"'
                    elif pattern.startswith("'") and pattern.endswith("'"):
                        replacement = f"'{translated_text}'"
                    elif pattern.startswith('"') and pattern.endswith('"'):
                        replacement = f'"{translated_text}"'
                    elif pattern.startswith('`') and pattern.endswith('`'):
                        replacement = f'`{translated_text}`'
                    elif 'text: "' in pattern:
                        replacement = f'text: "{translated_text}"'
                    elif 'title: "' in pattern:
                        replacement = f'title: "{translated_text}"'
                    elif 'label: "' in pattern:
                        replacement = f'label: "{translated_text}"'
                    elif pattern.endswith('";'):
                        replacement = f'= "{translated_text}";'
                    elif pattern.endswith("';"):
                        replacement = f"= '{translated_text}';"
                    else:
                        continue
                    
                    # Apply the replacement
                    old_content = content
                    content = content.replace(pattern.replace('\\', ''), replacement)
                    if content != old_content:
                        translation_count += 1
                        print(f"  ✅ Translated: {english_text} → {translated_text}")
    
    # Apply JavaScript variable translations 
    js_vars = translations.get('javascript_variables', {})
    for var_key, lang_translations in js_vars.items():
        if language_code in lang_translations:
            translated_text = lang_translations[language_code]
            
            # Handle specific patterns for Yes/No values in JavaScript
            if 'yes' in var_key.lower():
                patterns = [
                    'scanCounts.Yes',
                    'labels: ["Yes"',
                    '"Yes"',
                    "'Yes'",
                ]
                replacement_base = translated_text
                
                for pattern in patterns:
                    if pattern in content:
                        if pattern == 'scanCounts.Yes':
                            content = content.replace(pattern, f'scanCounts.{translated_text}')
                        elif 'labels: [' in pattern:
                            content = content.replace(pattern, f'labels: ["{translated_text}"')
                        elif pattern.startswith('"'):
                            content = content.replace(pattern, f'"{translated_text}"')
                        elif pattern.startswith("'"):
                            content = content.replace(pattern, f"'{translated_text}'")
                        
                        translation_count += 1
                        print(f"  ✅ JS Variable: {pattern} → {translated_text}")
            
            elif 'no' in var_key.lower():
                patterns = [
                    'scanCounts.No',
                    '"No"',
                    "'No'",
                ]
                
                for pattern in patterns:
                    if pattern in content:
                        if pattern == 'scanCounts.No':
                            content = content.replace(pattern, f'scanCounts.{translated_text}')
                        elif pattern.startswith('"'):
                            content = content.replace(pattern, f'"{translated_text}"')
                        elif pattern.startswith("'"):
                            content = content.replace(pattern, f"'{translated_text}'")
                        
                        translation_count += 1
                        print(f"  ✅ JS Variable: {pattern} → {translated_text}")
    
    # Apply comprehensive JavaScript textContent and innerHTML patterns
    js_patterns = {
        # Button text updates
        'button.textContent = "Copy"': f'button.textContent = "{ui_strings.get("Copy", {}).get(language_code, "Copy")}"',
        'button.textContent = "Copied!"': f'button.textContent = "Kopiert!"',
        'button.textContent = "copied!"': f'button.textContent = "kopiert!"',
        'button.textContent = "Reset Zoom"': f'button.textContent = "{ui_strings.get("Reset Zoom", {}).get(language_code, "Reset Zoom")}"',
        'button.textContent = "Copy Stats"': 'button.textContent = "Statistiken Kopieren"',
        'button.textContent = "Error"': 'button.textContent = "Fehler"',
        
        # Sort indicators
        'sortHint.textContent = "↕ Sort"': 'sortHint.textContent = "↕ Sortieren"',
        'arrow.textContent = "▲ ASC"': 'arrow.textContent = "▲ AUF"',
        'arrow.textContent = "▼ DESC"': 'arrow.textContent = "▼ AB"',
        
        # Status messages
        'jumpLabel.textContent = "Go to page: "': 'jumpLabel.textContent = "Zu Seite: "',
    }
    
    for js_pattern, js_replacement in js_patterns.items():
        if js_pattern in content:
            content = content.replace(js_pattern, js_replacement)
            translation_count += 1
            print(f"  ✅ JS Pattern: {js_pattern.split('=')[0].strip()} updated")
    
    # Write the translated content
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"🎯 Applied {translation_count} translations to {target_file}")
    return translation_count

def main():
    """Main execution function"""
    print("🚀 Starting Comprehensive Translation Process")
    
    languages = [
        ('de', 'de/index.html'),
        ('es', 'es/index.html'),
        ('pt', 'pt/index.html'),
    ]
    
    total_translations = 0
    
    for lang_code, target_file in languages:
        if os.path.exists(target_file):
            count = apply_translations_to_file(target_file, target_file, lang_code)
            total_translations += count
        else:
            print(f"❌ File not found: {target_file}")
    
    print(f"\n🎉 Translation Complete!")
    print(f"📊 Total translations applied: {total_translations}")
    print("\n🔍 Next Steps:")
    print("1. Run validation commands to find any missed translations")
    print("2. Test functionality in each language")
    print("3. Check for broken JavaScript")

if __name__ == '__main__':
    main()
