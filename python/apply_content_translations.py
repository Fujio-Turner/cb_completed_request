#!/usr/bin/env python3
"""
Content Translation Script

This script specifically targets the hardcoded English content like insights text,
explanations, and instructions that appear directly in HTML.
"""

import json
import re
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_content_translations(file_path, language_code, translations):
    """Apply content translations to a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} content translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # Direct text replacements from the examples provided
        replacements = {
            # Insights header
            "🚧 INSIGHTS IN DEVELOPMENT 🚧": ui_strings["🚧 INSIGHTS IN DEVELOPMENT 🚧"][language_code],
            
            # Insights explanation text
            "Some insights show LIVE data": f"Alguns insights mostram {ui_strings['LIVE data'][language_code]}" if language_code == 'pt' else f"Algunos insights muestran {ui_strings['LIVE data'][language_code]}" if language_code == 'es' else f"Einige Erkenntnisse zeigen {ui_strings['LIVE data'][language_code]}" if language_code == 'de' else f"Some insights show {ui_strings['LIVE data'][language_code]}",
            
            "BETA insights are work in progress (might have false positives), others display placeholder content.": f"{ui_strings['BETA insights are work in progress'][language_code]} ({ui_strings['might have false positives'][language_code]}), {ui_strings['others display placeholder content'][language_code]}.",
            
            # Performance recommendations  
            "💡 Consider creating more selective indexes to reduce scan overhead": f"💡 {ui_strings['Consider creating more selective indexes to reduce scan overhead'][language_code]}",
            "💡 Check kernel time on index nodes - high kernel time may indicate resource contention": f"💡 {ui_strings['Check kernel time on index nodes - high kernel time may indicate resource contention'][language_code]}",
            "💡 Review your indexing strategy - create selective secondary indexes": f"💡 {ui_strings['Review your indexing strategy - create selective secondary indexes'][language_code]}",
            "💡 Is the Query Service co-located with other services?": f"💡 {ui_strings['Is the Query Service co-located with other services?'][language_code]}",
            "💡 Consider increasing query memory limits or optimizing queries": f"💡 {ui_strings['Consider increasing query memory limits or optimizing queries'][language_code]}",
            "💡 Is the Data Service and/or Query Service co-located with other services?": f"💡 {ui_strings['Is the Data Service and/or Query Service co-located with other services?'][language_code]}",
            "💡 Consider denormalizing frequently joined data": f"💡 {ui_strings['Consider denormalizing frequently joined data'][language_code]}",
            "💡 Consider implementing pagination for large result sets": f"💡 {ui_strings['Consider implementing pagination for large result sets'][language_code]}",
            "💡 Large result sets can impact performance and resource usage": f"💡 {ui_strings['Large result sets can impact performance and resource usage'][language_code]}",
            "💡 Review query scheduling and resource allocation": f"💡 {ui_strings['Review query scheduling and resource allocation'][language_code]}",
            
            # Index tab content
            "No Index Data Loaded": ui_strings["No Index Data Loaded"][language_code],
            
            # Instructions
            "To analyze indexes, run this query in your Couchbase Query Workbench and paste the results in the second textarea above:": ui_strings["To analyze indexes, run this query in your Couchbase Query Workbench and paste the results in the second textarea above:"][language_code],
            "Steps:": ui_strings["Steps:"][language_code],
            "1. Copy the query above": f"1. {ui_strings['Copy the query above'][language_code]}",
            "2. Run it in Couchbase Query Workbench": f"2. {ui_strings['Run it in Couchbase Query Workbench'][language_code]}",  
            "3. Copy the JSON results": f"3. {ui_strings['Copy the JSON results'][language_code]}",
            "4. Paste into the second textarea at the top": f"4. {ui_strings['Paste into the second textarea at the top'][language_code]}",
            "5. Click \"Parse JSON\" again": f"5. {ui_strings['Click'][language_code]} \"Parse JSON\" {ui_strings['again'][language_code]}",
            
            # Additional technical phrases
            "possibily a query with `USE KEYS()`": "possivelmente uma consulta com `USE KEYS()`" if language_code == 'pt' else "posiblemente una consulta con `USE KEYS()`" if language_code == 'es' else "möglicherweise eine Abfrage mit `USE KEYS()`",
            "preventing index usage and causing full scans": "impedindo o uso de índice e causando varreduras completas" if language_code == 'pt' else "impidiendo el uso de índices y causando escaneos completos" if language_code == 'es' else "verhindern die Indexnutzung und verursachen vollständige Scans",
            "(Default query timeout: 75 seconds / 1m15s)": "(Timeout padrão da consulta: 75 segundos / 1m15s)" if language_code == 'pt' else "(Timeout predeterminado de consulta: 75 segundos / 1m15s)" if language_code == 'es' else "(Standard-Abfrage-Timeout: 75 Sekunden / 1m15s)",
        }
        
        # Apply each replacement
        for english_text, translated_text in replacements.items():
            if english_text in content:
                content = content.replace(english_text, translated_text)
                changes_made += 1
                print(f"  ✅ Translated: {english_text[:50]}...")
        
        # Handle status badges that appear inline
        status_replacements = {
            'pt': {'Live': 'Ao Vivo', 'Beta': 'Beta', 'Dev': 'Desenvolvimento'},
            'es': {'Live': 'En Vivo', 'Beta': 'Beta', 'Dev': 'Desarrollo'}, 
            'de': {'Live': 'Live', 'Beta': 'Beta', 'Dev': 'Entwicklung'}
        }
        
        # Replace status badges when they appear after content
        for english_status, translated_status in status_replacements[language_code].items():
            pattern = f'>{english_status}<'
            replacement = f'>{translated_status}<'
            if pattern in content:
                content = content.replace(pattern, replacement)
                changes_made += 1
                print(f"  ✅ Translated status badge: {english_status} -> {translated_status}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} content translations to {file_path}")
        else:
            print(f"  ℹ️ No missing content translations found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply content translations"""
    
    print("🌍 Applying Content Translations to Localized Files")
    print("=" * 65)
    
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
            changes = apply_content_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Content Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Content translations have been applied!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All content translations are already up to date!")

if __name__ == "__main__":
    main()
