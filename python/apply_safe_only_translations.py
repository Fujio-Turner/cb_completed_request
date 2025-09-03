#!/usr/bin/env python3
"""
Apply Safe-Only Translations

This script applies ONLY safe translations that will NOT break JavaScript functionality.
It focuses on user-facing content while protecting all JavaScript APIs.
"""

import json
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_safe_translations(file_path, language_code, translations):
    """Apply only safe translations to a file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} SAFE translations only...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changes_made = 0
        ui_strings = translations["ui_strings"]
        js_variables = translations["javascript_variables"]
        
        # CATEGORY 1: TEXT_CONSTANTS (User-facing strings only)
        safe_text_constants = {
            # System messages (user-facing)
            'INITIALIZING_ANALYZER: "🚀 Initializing Couchbase Query Analyzer...",': f'INITIALIZING_ANALYZER: "{ui_strings["🚀 Initializing Couchbase Query Analyzer..."][language_code]}",',
            'ANALYZER_INITIALIZED: "✅ Query Analyzer initialized successfully",': f'ANALYZER_INITIALIZED: "{ui_strings["✅ Query Analyzer initialized successfully"][language_code]}",',
            'INDEX_ANALYSIS_INITIALIZED: "✅ Index analysis initialized",': f'INDEX_ANALYSIS_INITIALIZED: "{ui_strings["✅ Index analysis initialized"][language_code]}",',
            'TIP_ABOUT: "💡 Tip: Type QueryAnalyzer.about() for full app info",': f'TIP_ABOUT: "{ui_strings["💡 Tip: Type QueryAnalyzer.about() for full app info"][language_code]}",',
            
            # Performance messages (user-facing)
            'PARSE_PERFORMANCE: "Parse performance:",': f'PARSE_PERFORMANCE: "{ui_strings["Parse performance:"][language_code]}",',
            'ALL_CACHES_CLEARED: "All caches cleared for new JSON parse",': f'ALL_CACHES_CLEARED: "{ui_strings["All caches cleared for new JSON parse"][language_code]}",',
            
            # User interaction messages
            'FAILED_COPY_CLIPBOARD: "Failed to copy to clipboard",': f'FAILED_COPY_CLIPBOARD: "{ui_strings["Failed to copy to clipboard"][language_code]}",',
            'SHOW_SAMPLE_QUERIES: "Show Sample Queries",': f'SHOW_SAMPLE_QUERIES: "{ui_strings["Show Sample Queries"][language_code]}",',
            'COPY_STATS: "Copy Stats",': f'COPY_STATS: "{ui_strings["Copy Stats"][language_code]}",',
            'COPY: "Copy",': f'COPY: "{ui_strings["Copy"][language_code]}",',
            'COPY_ALL: "Copy All",': f'COPY_ALL: "{ui_strings["Copy All"][language_code]}",',
            'SHOW_MORE: "Show More",': f'SHOW_MORE: "{ui_strings["Show More"][language_code]}",',
            'HIDE: "Hide",': f'HIDE: "{ui_strings["Hide"][language_code]}",',
            
            # Error messages  
            'ERROR_GENERATING_UI: "Error generating UI:",': f'ERROR_GENERATING_UI: "{ui_strings["Error generating UI:"][language_code]}",',
            'STATEMENT_NOT_FOUND: "Statement not found",': f'STATEMENT_NOT_FOUND: "{ui_strings["Statement not found"][language_code]}",',
            'JSON_PARSING_ERROR: "JSON parsing error:",': f'JSON_PARSING_ERROR: "{ui_strings["JSON parsing error:"][language_code]}",',
        }
        
        # CATEGORY 2: HTML Content (Between tags only)
        safe_html_content = {
            # Tab headers
            '<button class="tablinks active" onclick="openTab(event, \'dashboard\')">Dashboard</button>': f'<button class="tablinks active" onclick="openTab(event, \'dashboard\')">{ui_strings["Dashboard"][language_code]}</button>',
            '<button class="tablinks" onclick="openTab(event, \'timeline\')">Timeline</button>': f'<button class="tablinks" onclick="openTab(event, \'timeline\')">{ui_strings["Timeline"][language_code]}</button>',
            '<button class="tablinks" onclick="openTab(event, \'analysis\')">Analysis</button>': f'<button class="tablinks" onclick="openTab(event, \'analysis\')">{ui_strings["Analysis"][language_code]}</button>',
            '<button class="tablinks" onclick="openTab(event, \'insights\')">Insights</button>': f'<button class="tablinks" onclick="openTab(event, \'insights\')">{js_variables["Insights"][language_code]}</button>',
            
            # Chart titles (only content, not attributes)
            '<h3 class="chart-title fixed-height">Index Type Usage</h3>': f'<h3 class="chart-title fixed-height">{ui_strings["Index Type Usage"][language_code]}</h3>',
            '<h3 class="chart-card-header">Index Scan Consistency</h3>': f'<h3 class="chart-card-header">{ui_strings["Index Scan Consistency"][language_code]}</h3>',
            
            # Button content (only text, not attributes)
            '>Copy<': f'>{ui_strings["Copy"][language_code]}<',
            '>Show More<': f'>{ui_strings["Show More"][language_code]}<',
            '>Hide<': f'>{ui_strings["Hide"][language_code]}<',
        }
        
        # Apply safe TEXT_CONSTANTS translations
        print("  🔒 Applying safe TEXT_CONSTANTS translations...")
        for english_constant, translated_constant in safe_text_constants.items():
            if english_constant in content:
                content = content.replace(english_constant, translated_constant) 
                changes_made += 1
                print(f"    ✅ {english_constant[:40]}...")
        
        # Apply safe HTML content translations
        print("  🔒 Applying safe HTML content translations...")
        for english_html, translated_html in safe_html_content.items():
            if english_html in content:
                content = content.replace(english_html, translated_html)
                changes_made += 1
                print(f"    ✅ HTML: {english_html[:40]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} SAFE translations to {file_path}")
        else:
            print(f"  ℹ️ No safe translations needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply safe translations"""
    
    print("🛡️ Applying SAFE-ONLY Translations")
    print("=" * 50)
    print("🎯 This script ONLY translates user-facing content")
    print("🚨 JavaScript APIs and technical elements are PROTECTED")
    print()
    
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
            changes = apply_safe_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Safe Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Safe translations applied!")
        print(f"   🔍 CRITICAL: Run validation: python3 python/validate_js_syntax.py")
        print(f"   🧪 CRITICAL: Test in browser to verify charts work")
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All safe translations are already applied!")

if __name__ == "__main__":
    main()
