#!/usr/bin/env python3
"""
Fix Features Description Translation

This script specifically targets the Features description that follows
the console.log for the 🔧 Features line.
"""

import json
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def fix_features_description(file_path, language_code, translations):
    """Fix features description in console.log"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} features description...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # Extract just the features description part
        features_text = ui_strings["🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system"][language_code]
        features_description = features_text.split(": ", 1)[1] if ": " in features_text else features_text
        
        # Find and replace the console.log with features description
        console_log_patterns = [
            # Pattern 1: console.log with TEXT_CONSTANTS.FEATURES and English description
            (
                'console.log(TEXT_CONSTANTS.FEATURES, "Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system");',
                f'console.log(TEXT_CONSTANTS.FEATURES, "{features_description}");'
            ),
            
            # Pattern 2: Template literal with features
            (
                '`🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system`',
                f'`{features_text}`'
            ),
            
            # Pattern 3: Direct string with features
            (
                '"🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system"',
                f'"{features_text}"'
            )
        ]
        
        # Apply each pattern
        for english_pattern, translated_pattern in console_log_patterns:
            if english_pattern in content:
                content = content.replace(english_pattern, translated_pattern)
                changes_made += 1
                print(f"  ✅ Fixed features description pattern")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} features descriptions in {file_path}")
        else:
            print(f"  ℹ️ No features description issues found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix features descriptions"""
    
    print("🌍 Fixing Features Description Translation")
    print("=" * 50)
    
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
            changes = fix_features_description(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Features Description Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Features descriptions have been fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All features descriptions are already translated!")

if __name__ == "__main__":
    main()
