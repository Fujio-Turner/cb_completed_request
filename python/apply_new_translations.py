#!/usr/bin/env python3
"""
Apply New Translation Content
Applies specific new translations that weren't caught by the main translation process
"""

import json
import re
import sys

def apply_insights_translations():
    """Apply Insights tab translations specifically"""
    
    # Load translation mappings
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    ui_strings = translations['ui_strings']
    
    # Define Insights-specific translations to apply
    insights_translations = [
        "High Kernel Time in Queries",
        "High Memory Usage Detected", 
        "Inefficient Index Scans",
        "Slow Index Scan Times",
        "Index Performance Issues",
        "🚧 INSIGHTS IN DEVELOPMENT 🚧",
        "Some insights show",
        "insights are work in progress (might have false positives), others display placeholder content."
    ]
    
    languages = ['de', 'es', 'pt']
    
    for lang in languages:
        filepath = f'{lang}/index.html'
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"🔄 Applying Insights translations to {filepath}")
            
            # Apply each translation
            for english_text in insights_translations:
                if english_text in ui_strings:
                    if lang in ui_strings[english_text]:
                        translated_text = ui_strings[english_text][lang]
                        
                        # Replace in content
                        if english_text in content:
                            content = content.replace(english_text, translated_text)
                            print(f"   ✅ {english_text} → {translated_text}")
                        else:
                            print(f"   ⚠️  '{english_text}' not found in {filepath}")
                    else:
                        print(f"   ❌ No {lang} translation for: {english_text}")
                else:
                    print(f"   ❌ Translation key missing: {english_text}")
                    # Show what keys are available near this term
                    for key in ui_strings.keys():
                        if english_text.split()[0].lower() in key.lower():
                            print(f"       Similar key found: {key}")
            
            # Write back to file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"✅ {filepath} updated with Insights translations")
            
        except Exception as e:
            print(f"❌ Error updating {filepath}: {e}")

def main():
    """Main function"""
    print("🌍 Applying New Insights Translations")
    print("=" * 50)
    
    apply_insights_translations()
    
    print("\n🎉 New translation application complete!")
    print("💡 Next: Run 'python3 settings/validate_js_syntax.py' to verify")

if __name__ == "__main__":
    main()
