#!/usr/bin/env python3
"""
Protected Translation Script
Translates visible content while protecting HTML attributes, JavaScript, and CSS
"""

import json
import re

def translate_with_protection(source_file, target_file, language):
    """Safely translate HTML content while protecting critical attributes"""
    
    # Load translations
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    ui_strings = translations['ui_strings']
    
    # Read source file
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Set language attribute
    content = re.sub(r'<html lang="[^"]*">', f'<html lang="{language}">', content)
    
    # STEP 1: Protect JavaScript sections
    js_sections = []
    def preserve_js(match):
        js_sections.append(match.group(0))
        return f"__JS_PLACEHOLDER_{len(js_sections)-1}__"
    
    content = re.sub(r'<script(?![^>]*src=)[^>]*>.*?</script>', preserve_js, content, flags=re.DOTALL)
    
    # STEP 2: Protect CSS sections  
    css_sections = []
    def preserve_css(match):
        css_sections.append(match.group(0))
        return f"__CSS_PLACEHOLDER_{len(css_sections)-1}__"
    
    content = re.sub(r'<style[^>]*>.*?</style>', preserve_css, content, flags=re.DOTALL)
    
    # STEP 3: Protect HTML attributes
    attribute_sections = []
    def preserve_attributes(match):
        attribute_sections.append(match.group(0))
        return f"__ATTR_PLACEHOLDER_{len(attribute_sections)-1}__"
    
    # Protect critical attributes that should never be translated
    protected_patterns = [
        r'id="[^"]*"',
        r'class="[^"]*"', 
        r'aria-controls="[^"]*"',
        r'aria-label="[^"]*"',
        r'data-[^=]*="[^"]*"',
        r'onclick="[^"]*"',
        r'onchange="[^"]*"',
        r'href="#[^"]*"',
        r'for="[^"]*"'
    ]
    
    for pattern in protected_patterns:
        content = re.sub(pattern, preserve_attributes, content)
    
    # STEP 4: Apply translations to remaining content
    translation_count = 0
    for english_text, lang_translations in ui_strings.items():
        if language in lang_translations:
            translated_text = lang_translations[language]
            
            if english_text in content:
                count = content.count(english_text)
                content = content.replace(english_text, translated_text)
                translation_count += count
    
    # STEP 5: Restore protected sections
    # Restore attributes
    for i, attr_section in enumerate(attribute_sections):
        content = content.replace(f"__ATTR_PLACEHOLDER_{i}__", attr_section)
    
    # Restore CSS
    for i, css_section in enumerate(css_sections):
        content = content.replace(f"__CSS_PLACEHOLDER_{i}__", css_section)
    
    # Restore JavaScript
    for i, js_section in enumerate(js_sections):
        content = content.replace(f"__JS_PLACEHOLDER_{i}__", js_section)
    
    # Write translated file
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return translation_count

def main():
    """Main translation function with full protection"""
    print("🛡️ Protected Translation (HTML Attributes + JavaScript Safe)")
    print("=" * 65)
    
    languages = {
        'de': 'German',
        'es': 'Spanish', 
        'pt': 'Portuguese'
    }
    
    for lang_code, lang_name in languages.items():
        count = translate_with_protection('en/index.html', f'{lang_code}/index.html', lang_code)
        print(f"✅ {lang_name}: {count} translations applied")
    
    print("\n🧪 Running validation checks...")
    
    # JavaScript syntax validation
    import subprocess
    js_result = subprocess.run(['python3', 'settings/validate_js_syntax.py'], 
                             capture_output=True, text=True)
    
    # HTML attribute validation  
    attr_result = subprocess.run(['python3', 'settings/validate_html_attributes.py'],
                                capture_output=True, text=True)
    
    print("JavaScript Validation:")
    print(js_result.stdout)
    
    print("HTML Attribute Validation:")
    print(attr_result.stdout)
    
    if js_result.returncode == 0 and attr_result.returncode == 0:
        print("🎉 Protected translation completed successfully!")
        return 0
    else:
        print("⚠️ Validation failed - manual fixes needed")
        return 1

if __name__ == "__main__":
    exit(main())
