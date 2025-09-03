#!/usr/bin/env python3
"""
Apply Protected Translations

This script applies translations while protecting JavaScript API properties
and other critical technical elements from being translated.
"""

import json
import os
import re

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_protected_translations(file_path, language_code, translations):
    """Apply translations with protection for technical elements"""
    
    print(f"🔄 Processing {file_path} with protected {language_code.upper()} translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changes_made = 0
        
        # Protected patterns - these should NEVER be translated
        protected_patterns = [
            r'\bid\s*=\s*["\'][^"\']+["\']',  # HTML id attributes
            r'\bclass\s*=\s*["\'][^"\']+["\']',  # HTML class attributes
            r'\baria-[a-z]+\s*=\s*["\'][^"\']+["\']',  # ARIA attributes
            r'\bdata-[a-z-]+\s*=\s*["\'][^"\']+["\']',  # Data attributes
            r'\bonclick\s*=\s*["\'][^"\']+["\']',  # Event handlers
            r'getElementById\(["\'][^"\']+["\']\)',  # DOM selectors
            r'querySelector\(["\'][^"\']+["\']\)',  # CSS selectors
            r'\.data\b',  # Chart.js .data property
            r'\.dataset\b',  # Chart.js .dataset property
            r'\.dataIndex\b',  # Chart.js .dataIndex property
            r'\.options\b',  # Chart.js .options property
            r'\.plugins\b',  # Chart.js .plugins property
            r'\.forEach\b',  # JavaScript .forEach method
            r'\.map\b',  # JavaScript .map method
            r'\.filter\b',  # JavaScript .filter method
            r'function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(',  # Function names
        ]
        
        # Mark protected regions
        protected_regions = []
        for pattern in protected_patterns:
            for match in re.finditer(pattern, content):
                protected_regions.append((match.start(), match.end()))
        
        # Sort regions by start position
        protected_regions.sort()
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # Apply only safe TEXT_CONSTANTS translations
        safe_translations = {
            'INITIALIZING_ANALYZER: "🚀 Initializing Couchbase Query Analyzer...",': f'INITIALIZING_ANALYZER: "{ui_strings["🚀 Initializing Couchbase Query Analyzer..."][language_code]}",',
            'ANALYZER_INITIALIZED: "✅ Query Analyzer initialized successfully",': f'ANALYZER_INITIALIZED: "{ui_strings["✅ Query Analyzer initialized successfully"][language_code]}",',
            'INDEX_ANALYSIS_INITIALIZED: "✅ Index analysis initialized",': f'INDEX_ANALYSIS_INITIALIZED: "{ui_strings["✅ Index analysis initialized"][language_code]}",',
            'TIP_ABOUT: "💡 Tip: Type QueryAnalyzer.about() for full app info",': f'TIP_ABOUT: "{ui_strings["💡 Tip: Type QueryAnalyzer.about() for full app info"][language_code]}",',
            'PARSE_PERFORMANCE: "Parse performance:",': f'PARSE_PERFORMANCE: "{ui_strings["Parse performance:"][language_code]}",',
            'CACHE_STATS: "Cache stats - parseTime:",': f'CACHE_STATS: "{ui_strings["Cache stats - parseTime:"][language_code]}",',
            'ALL_CACHES_CLEARED: "All caches cleared for new JSON parse",': f'ALL_CACHES_CLEARED: "{ui_strings["All caches cleared for new JSON parse"][language_code]}",',
            'FAILED_COPY_CLIPBOARD: "Failed to copy to clipboard",': f'FAILED_COPY_CLIPBOARD: "{ui_strings["Failed to copy to clipboard"][language_code]}",',
        }
        
        # Apply each safe translation, checking for protected regions
        for english_text, translated_text in safe_translations.items():
            if english_text in content:
                # Find position of this text
                pos = content.find(english_text)
                if pos != -1:
                    # Check if this position overlaps with protected regions
                    is_protected = any(start <= pos < end for start, end in protected_regions)
                    
                    if not is_protected:
                        content = content.replace(english_text, translated_text)
                        changes_made += 1
                        print(f"  ✅ Safely translated: {english_text[:50]}...")
                    else:
                        print(f"  🛡️ Protected from translation: {english_text[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} protected translations to {file_path}")
        else:
            print(f"  ℹ️ No safe translations needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply protected translations"""
    
    print("🛡️ Applying Protected Translations")
    print("=" * 45)
    
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
            changes = apply_protected_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Protected Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Protected translations applied!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
    else:
        print(f"\n✅ All protected translations are up to date!")

if __name__ == "__main__":
    main()
