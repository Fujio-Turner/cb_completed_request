#!/usr/bin/env python3
"""
Comprehensive Translation Script

This script applies extensive translations to catch hardcoded English text
that appears in both TEXT_CONSTANTS and directly in HTML content.
"""

import json
import re
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_comprehensive_translations(file_path, language_code, translations):
    """Apply comprehensive translations to a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} comprehensive translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        original_content = content
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # Apply translations for all the new entries we added
        translation_pairs = [
            # Insights header and development text
            ("🚧 INSIGHTS IN DEVELOPMENT 🚧", "🚧 INSIGHTS IN DEVELOPMENT 🚧"),
            ("LIVE data", "LIVE data"),
            ("BETA insights are work in progress", "BETA insights are work in progress"),
            ("might have false positives", "might have false positives"),
            ("others display placeholder content", "others display placeholder content"),
            
            # Performance recommendations
            ("Consider creating more selective indexes to reduce scan overhead", "Consider creating more selective indexes to reduce scan overhead"),
            ("Check kernel time on index nodes - high kernel time may indicate resource contention", "Check kernel time on index nodes - high kernel time may indicate resource contention"),
            ("Review your indexing strategy - create selective secondary indexes", "Review your indexing strategy - create selective secondary indexes"),
            ("Is the Query Service co-located with other services?", "Is the Query Service co-located with other services?"),
            ("Consider increasing query memory limits or optimizing queries", "Consider increasing query memory limits or optimizing queries"),
            ("Is the Data Service and/or Query Service co-located with other services?", "Is the Data Service and/or Query Service co-located with other services?"),
            ("Consider denormalizing frequently joined data", "Consider denormalizing frequently joined data"),
            ("Consider implementing pagination for large result sets", "Consider implementing pagination for large result sets"),
            ("Large result sets can impact performance and resource usage", "Large result sets can impact performance and resource usage"),
            ("Review query scheduling and resource allocation", "Review query scheduling and resource allocation"),
            
            # Index tab content
            ("No Index Data Loaded", "No Index Data Loaded"),
            ("Steps:", "Steps:"),
            ("Copy the query above", "Copy the query above"),
            ("Run it in Couchbase Query Workbench", "Run it in Couchbase Query Workbench"),
            ("Copy the JSON results", "Copy the JSON results"),
            ("Paste into the second textarea at the top", "Paste into the second textarea at the top"),
            ("Click", "Click"),
            ("again", "again"),
            
            # Additional insights content
            ("possibily a query with", "possivelmente uma consulta com" if language_code == 'pt' else "posiblemente una consulta con" if language_code == 'es' else "möglicherweise eine Abfrage mit"),
            ("preventing index usage and causing full scans", "impedindo o uso de índice e causando varreduras completas" if language_code == 'pt' else "impidiendo el uso de índices y causando escaneos completos" if language_code == 'es' else "verhindern die Indexnutzung und verursachen vollständige Scans"),
            ("Default query timeout: 75 seconds / 1m15s", "Timeout padrão da consulta: 75 segundos / 1m15s" if language_code == 'pt' else "Timeout predeterminado de consulta: 75 segundos / 1m15s" if language_code == 'es' else "Standard-Abfrage-Timeout: 75 Sekunden / 1m15s"),
        ]
        
        # Apply each translation pair
        for english_text, translation_key in translation_pairs:
            if english_text in content and translation_key in ui_strings:
                translated_text = ui_strings[translation_key][language_code]
                content = content.replace(english_text, translated_text)
                if content != original_content:
                    changes_made += 1
                    print(f"  ✅ Translated: {english_text[:50]}...")
                    original_content = content
        
        # Handle specific patterns with regex
        patterns_to_translate = [
            # Status badges: "Live", "Beta", "Development"
            (r'\b(Live|Beta|Development)\b(?!</)', lambda m: {
                'Live': {'pt': 'Ao Vivo', 'es': 'En Vivo', 'de': 'Live'},
                'Beta': {'pt': 'Beta', 'es': 'Beta', 'de': 'Beta'},
                'Development': {'pt': 'Desenvolvimento', 'es': 'Desarrollo', 'de': 'Entwicklung'}
            }[m.group(1)][language_code]),
            
            # Number patterns with "queries" or "indexes"
            (r'(\d+)\s+queries?\b', lambda m: f"{m.group(1)} {'consultas' if language_code in ['pt', 'es'] else 'Abfragen' if language_code == 'de' else 'queries'}"),
            (r'(\d+)\s+indexes?\b', lambda m: f"{m.group(1)} {'índices' if language_code in ['pt', 'es'] else 'Indizes' if language_code == 'de' else 'indexes'}"),
            
            # Time units
            (r'\b(\d+)\s+seconds?\b', lambda m: f"{m.group(1)} {'segundos' if language_code in ['pt', 'es'] else 'Sekunden' if language_code == 'de' else 'seconds'}"),
            (r'\b(\d+)\s+minutes?\b', lambda m: f"{m.group(1)} {'minutos' if language_code in ['pt', 'es'] else 'Minuten' if language_code == 'de' else 'minutes'}"),
        ]
        
        # Apply regex-based translations
        for pattern, replacement_func in patterns_to_translate:
            new_content = re.sub(pattern, replacement_func, content)
            if new_content != content:
                changes_made += 1
                content = new_content
                print(f"  ✅ Applied pattern translation: {pattern}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} comprehensive translations to {file_path}")
        else:
            print(f"  ℹ️ No additional translations needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply comprehensive translations"""
    
    print("🌍 Applying Comprehensive Translations to Localized Files")
    print("=" * 70)
    
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
            changes = apply_comprehensive_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Comprehensive Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Comprehensive translations have been applied!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All comprehensive translations are already up to date!")

if __name__ == "__main__":
    main()
