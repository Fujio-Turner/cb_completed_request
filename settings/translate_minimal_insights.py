#!/usr/bin/env python3
"""
Minimal Insights Translation
Only translates tab name and main section headings to avoid JavaScript conflicts
"""

def translate_minimal_insights():
    """Apply minimal safe translations for Insights"""
    
    # Only translate these specific items that are safe
    translations = {
        'de': {
            '>Insights<': '>Erkenntnisse<',  # Tab name
            'aria-controls="insights"': 'aria-controls="insights"',  # Keep aria unchanged
        },
        'es': {
            '>Insights<': '>Perspectivas<',  # Tab name
            'aria-controls="insights"': 'aria-controls="insights"',  # Keep aria unchanged
        },
        'pt': {
            '>Insights<': '>Insights<',  # Tab name stays same in Portuguese
            'aria-controls="insights"': 'aria-controls="insights"',  # Keep aria unchanged
        }
    }
    
    for lang, lang_translations in translations.items():
        filepath = f'{lang}/index.html'
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Set language attribute
            content = content.replace('<html lang="en">', f'<html lang="{lang}">')
            
            print(f"🔄 Applying minimal translations to {filepath}")
            
            # Apply only safe translations
            for find_text, replace_text in lang_translations.items():
                if find_text in content:
                    content = content.replace(find_text, replace_text)
                    print(f"   ✅ {find_text} → {replace_text}")
            
            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"✅ {filepath} updated with minimal safe translations")
            
        except Exception as e:
            print(f"❌ Error updating {filepath}: {e}")

def main():
    """Main function"""
    print("🎯 Minimal Safe Insights Translation")
    print("=" * 40)
    
    translate_minimal_insights()
    
    print("\n🧪 Validating JavaScript syntax...")
    import subprocess
    result = subprocess.run(['python3', 'settings/validate_js_syntax.py'], 
                          capture_output=True, text=True)
    print(result.stdout)
    
    if result.returncode == 0:
        print("🎉 Minimal translation successful!")
        return 0
    else:
        print("⚠️ Even minimal translation failed")
        return 1

if __name__ == "__main__":
    exit(main())
