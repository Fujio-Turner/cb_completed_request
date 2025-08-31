#!/usr/bin/env python3
"""
HTML-Only Translation Script
Translates only HTML content, preserves all JavaScript code exactly as-is
"""

import json
import re

def translate_html_only(source_file, target_file, language):
    """Translate only HTML elements, preserve JavaScript sections intact"""
    
    # Load translations
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    ui_strings = translations['ui_strings']
    
    # Read source file
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Set language attribute
    content = re.sub(r'<html lang="[^"]*">', f'<html lang="{language}">', content)
    
    # Extract and preserve all JavaScript sections
    js_sections = []
    def preserve_js(match):
        js_sections.append(match.group(0))
        return f"__JS_PLACEHOLDER_{len(js_sections)-1}__"
    
    # Replace all <script> sections with placeholders
    content_with_placeholders = re.sub(r'<script(?![^>]*src=)[^>]*>.*?</script>', preserve_js, content, flags=re.DOTALL)
    
    # Now safely translate only HTML content
    translated_content = content_with_placeholders
    
    # Apply translations to HTML-only content
    translation_count = 0
    for english_text, lang_translations in ui_strings.items():
        if language in lang_translations:
            translated_text = lang_translations[language]
            
            # Only translate in non-JavaScript context
            if english_text in translated_content:
                # Count how many times we'll replace
                count = translated_content.count(english_text)
                if count > 0:
                    translated_content = translated_content.replace(english_text, translated_text)
                    translation_count += count
    
    # Restore JavaScript sections exactly as they were
    for i, js_section in enumerate(js_sections):
        translated_content = translated_content.replace(f"__JS_PLACEHOLDER_{i}__", js_section)
    
    # Write translated file
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(translated_content)
    
    return translation_count

def main():
    """Main translation function"""
    print("🛡️ HTML-Only Translation (JavaScript Protected)")
    print("=" * 55)
    
    languages = {
        'de': 'German',
        'es': 'Spanish', 
        'pt': 'Portuguese'
    }
    
    for lang_code, lang_name in languages.items():
        count = translate_html_only('en/index.html', f'{lang_code}/index.html', lang_code)
        print(f"✅ {lang_name}: {count} translations applied")
    
    print("\n🧪 Running JavaScript syntax validation...")
    import subprocess
    result = subprocess.run(['python3', 'settings/validate_js_syntax.py'], 
                          capture_output=True, text=True)
    print(result.stdout)
    
    if result.returncode == 0:
        print("🎉 HTML-only translation completed successfully!")
        return 0
    else:
        print("⚠️ JavaScript validation failed")
        return 1

if __name__ == "__main__":
    exit(main())
