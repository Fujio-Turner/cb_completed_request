#!/usr/bin/env python3
"""
Safe Translation Script - Preserves JavaScript Syntax
Translates content while preserving \n escape sequences in JavaScript strings
"""

import json
import re

def safe_translate_file(source_file, target_file, language):
    """Safely translate file while preserving JavaScript syntax"""
    
    # Load translations
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    ui_strings = translations['ui_strings']
    
    # Read source file
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Set language attribute
    content = re.sub(r'<html lang="[^"]*">', f'<html lang="{language}">', content)
    
    # Translate UI strings, but preserve JavaScript syntax
    for english_text, lang_translations in ui_strings.items():
        if language in lang_translations:
            translated_text = lang_translations[language]
            
            # Only translate if the English text exists and it's not part of JavaScript string syntax
            if english_text in content:
                # Check if this is inside a JavaScript string with \n - if so, preserve \n
                if '\\n' in english_text:
                    # This is a JavaScript string with escape sequences - translate carefully
                    # Split by \n, translate parts, rejoin with \n
                    english_parts = english_text.split('\\n')
                    translated_parts = translated_text.split('\\n') if '\\n' in translated_text else [translated_text]
                    
                    # If translation doesn't have \n but original does, we need to preserve structure
                    if len(english_parts) > 1 and len(translated_parts) == 1:
                        # Split translation by common separators to match structure
                        if ' ' in translated_text:
                            words = translated_text.split(' ')
                            if len(words) >= len(english_parts):
                                mid_point = len(words) // 2
                                translated_parts = [' '.join(words[:mid_point]), ' '.join(words[mid_point:])]
                            else:
                                translated_parts = [translated_text]
                    
                    # Reconstruct with proper \n
                    if len(translated_parts) == len(english_parts):
                        final_translated = '\\n'.join(translated_parts)
                    else:
                        final_translated = translated_text  # Fallback
                    
                    content = content.replace(english_text, final_translated)
                else:
                    # Normal translation
                    content = content.replace(english_text, translated_text)
    
    # Write translated file
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return f"Translated {source_file} → {target_file}"

def main():
    """Main translation function"""
    print("🛡️ Safe Translation - Preserving JavaScript Syntax")
    print("=" * 55)
    
    languages = {
        'de': 'German',
        'es': 'Spanish', 
        'pt': 'Portuguese'
    }
    
    for lang_code, lang_name in languages.items():
        result = safe_translate_file('en/index.html', f'{lang_code}/index.html', lang_code)
        print(f"✅ {lang_name}: {result}")
    
    print("\n🧪 Running JavaScript syntax validation...")
    import subprocess
    result = subprocess.run(['python3', 'settings/validate_js_syntax.py'], 
                          capture_output=True, text=True)
    print(result.stdout)
    
    if result.returncode == 0:
        print("🎉 Safe translation completed successfully!")
    else:
        print("⚠️ JavaScript validation failed - manual fixes needed")

if __name__ == "__main__":
    main()
