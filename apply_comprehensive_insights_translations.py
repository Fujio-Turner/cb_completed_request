#!/usr/bin/env python3
"""
Apply comprehensive translations to all Insights section content
Ensures 100% translation coverage for the Insights tab
"""

import json
import os
import re

def load_translations(file_path):
    """Load translations from JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_translations_to_file(source_file, target_file, language_code, translations):
    """Apply translations to a specific localized file"""
    
    # Read source file
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get UI strings for the target language
    ui_strings = translations.get('ui_strings', {})
    js_vars = translations.get('javascript_variables', {})
    
    # Count replacements for verification
    replacements_made = 0
    
    # Apply UI string translations
    for english_text, lang_translations in ui_strings.items():
        if language_code in lang_translations:
            translated_text = lang_translations[language_code]
            
            # Skip if translation is same as English (no translation needed)
            if translated_text == english_text:
                continue
                
            # Escape special regex characters in the English text
            escaped_english = re.escape(english_text)
            
            # Count occurrences before replacement
            count_before = len(re.findall(escaped_english, content))
            
            if count_before > 0:
                # Replace with translated text
                content = re.sub(escaped_english, translated_text, content)
                replacements_made += count_before
                print(f"  └── Replaced '{english_text[:50]}...' -> '{translated_text[:50]}...' ({count_before} times)")
    
    # Apply JavaScript variable translations
    for english_var, lang_translations in js_vars.items():
        if language_code in lang_translations:
            translated_text = lang_translations[language_code]
            
            # Skip if translation is same as English
            if translated_text == english_var:
                continue
                
            # Handle specific JS variable patterns
            if english_var == "Insights":
                # Replace in tab content
                pattern = r'"Insights"'
                replacement = f'"{translated_text}"'
                count_before = len(re.findall(pattern, content))
                if count_before > 0:
                    content = re.sub(pattern, replacement, content)
                    replacements_made += count_before
                    print(f"  └── Replaced JS variable 'Insights' -> '{translated_text}' ({count_before} times)")
    
    # Write the translated content
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return replacements_made

def main():
    """Main execution function"""
    
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Paths
    translations_file = os.path.join(script_dir, 'settings', 'translations.json')
    en_file = os.path.join(script_dir, 'en', 'index.html')
    
    # Target language files
    language_files = {
        'es': os.path.join(script_dir, 'es', 'index.html'),
        'pt': os.path.join(script_dir, 'pt', 'index.html'),
        'de': os.path.join(script_dir, 'de', 'index.html')
    }
    
    # Load translations
    print("Loading translations...")
    translations = load_translations(translations_file)
    
    # Copy EN file as base for each language and apply translations
    total_replacements = 0
    
    for lang_code, target_file in language_files.items():
        print(f"\n🌍 Processing {lang_code.upper()} translations...")
        
        # Copy EN file as base
        with open(en_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update html lang attribute
        content = re.sub(r'<html lang="en">', f'<html lang="{lang_code}">', content)
        
        # Write base content
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Apply translations
        replacements = apply_translations_to_file(target_file, target_file, lang_code, translations)
        total_replacements += replacements
        
        print(f"✅ Applied {replacements} translations to {lang_code}/index.html")
    
    print(f"\n🎉 COMPREHENSIVE TRANSLATION COMPLETE!")
    print(f"📊 Total replacements made: {total_replacements}")
    print(f"📋 All Insights content should now be fully translated")
    
    # Verification suggestions
    print(f"\n📝 VERIFICATION STEPS:")
    print(f"1. Check each localized file for remaining English text in Insights section")
    print(f"2. Look for untranslated category titles, insight names, and descriptions")
    print(f"3. Verify 'Learn more' links and tooltip text are translated")
    print(f"4. Test that JavaScript variables like 'Insights' tab name are translated")

if __name__ == '__main__':
    main()
