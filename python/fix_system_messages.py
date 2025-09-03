#!/usr/bin/env python3
"""
Fix System Messages Translation

This script handles all the console.log, initialization, and system messages
that are still in English in the TEXT_CONSTANTS sections.
"""

import json
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def fix_system_messages(file_path, language_code, translations):
    """Fix system messages in a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} system message translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # System message translations
        system_message_replacements = {
            'INITIALIZING_ANALYZER: "🚀 Initializing Couchbase Query Analyzer...",': f'INITIALIZING_ANALYZER: "{ui_strings["🚀 Initializing Couchbase Query Analyzer..."][language_code]}",',
            'ANALYZER_INITIALIZED: "✅ Query Analyzer initialized successfully",': f'ANALYZER_INITIALIZED: "{ui_strings["✅ Query Analyzer initialized successfully"][language_code]}",',
            'INDEX_ANALYSIS_INITIALIZED: "✅ Index analysis initialized",': f'INDEX_ANALYSIS_INITIALIZED: "{ui_strings["✅ Index analysis initialized"][language_code]}",',
            'TIP_ABOUT: "💡 Tip: Type QueryAnalyzer.about() for full app info",': f'TIP_ABOUT: "{ui_strings["💡 Tip: Type QueryAnalyzer.about() for full app info"][language_code]}",',
            'PARSE_PERFORMANCE: "Parse performance:",': f'PARSE_PERFORMANCE: "{ui_strings["Parse performance:"][language_code]}",',
            'CACHE_STATS: "Cache stats - parseTime:",': f'CACHE_STATS: "{ui_strings["Cache stats - parseTime:"][language_code]}",',
            'MS_FOR: "ms for",': f'MS_FOR: "{ui_strings["ms for"][language_code]}",',
            'FILTERED_OUT_EARLY: "filtered out early",': f'FILTERED_OUT_EARLY: "{ui_strings["filtered out early"][language_code]}",',
            
            # Features description
            'FEATURES: "🔧 Features:",': f'FEATURES: "{ui_strings["🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system"][language_code].split(":")[0]}:",',
        }
        
        # Apply TEXT_CONSTANTS replacements
        for english_constant, translated_constant in system_message_replacements.items():
            if english_constant in content:
                content = content.replace(english_constant, translated_constant)
                changes_made += 1
                print(f"  ✅ Translated TEXT_CONSTANT: {english_constant[:50]}...")
        
        # Fix template literals and console.log messages that use these constants
        template_fixes = {
            # Fix version display template literal
            'console.log(`📦 Version: ${APP_VERSION} (Updated: ${LAST_UPDATED})`);': f'console.log(`{ui_strings["📦 Version:"][language_code]} ${{APP_VERSION}} ({ui_strings["Updated:"][language_code]} ${{LAST_UPDATED}})`);',
            
            # Fix console.log with features
            'console.log(TEXT_CONSTANTS.FEATURES, "Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system");': f'console.log(TEXT_CONSTANTS.FEATURES, "{ui_strings["🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system"][language_code].split(": ", 1)[1]}");',
            
            # Fix index extraction message template literal
            '`✅ Index extraction complete: ${usedIndexes.size} unique indexes, ${totalIndexReferences} total references`': f'`{ui_strings["✅ Index extraction complete:"][language_code]} ${{usedIndexes.size}} {ui_strings["unique indexes"][language_code]}, ${{totalIndexReferences}} {ui_strings["total references"][language_code]}`',
        }
        
        # Apply template literal fixes  
        for english_template, translated_template in template_fixes.items():
            if english_template in content:
                content = content.replace(english_template, translated_template)
                changes_made += 1
                print(f"  ✅ Fixed template literal: {english_template[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} system messages in {file_path}")
        else:
            print(f"  ℹ️ No system messages need fixing in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix system messages"""
    
    print("🌍 Fixing System Messages Translation")
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
            changes = fix_system_messages(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 System Messages Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ System messages have been fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All system messages are already translated!")

if __name__ == "__main__":
    main()
