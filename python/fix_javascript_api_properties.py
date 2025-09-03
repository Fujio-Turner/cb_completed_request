#!/usr/bin/env python3
"""
Fix JavaScript API Properties

This script fixes JavaScript API property names that were incorrectly translated.
JavaScript APIs (Chart.js, DOM, etc.) require specific property names in English.
"""

import os
import re

def fix_javascript_api_properties(file_path, language_code):
    """Fix JavaScript API properties that were incorrectly translated"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} JavaScript API fixes...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # JavaScript API property fixes - these must NEVER be translated
        if language_code == 'de':
            api_fixes = {
                # Chart.js API properties
                ".Daten": ".data",
                ".Optionen": ".options", 
                ".Plugins": ".plugins",
                ".Scales": ".scales",
                ".Legende": ".legend",
                ".Titel": ".title",
                "context.Datenset": "context.dataset",
                "context.DatenIndex": "context.dataIndex",
                "tooltipItems[0].DatenIndex": "tooltipItems[0].dataIndex",
                
                # DOM API properties
                "chart.Daten(": "chart.data(",
                ".Daten(": ".data(",
                
                # JavaScript method names
                ".forEach": ".forEach",  # Make sure this isn't translated
                ".map": ".map",
                ".filter": ".filter",
                ".reduce": ".reduce",
                ".sort": ".sort",
                ".includes": ".includes",
                ".indexOf": ".indexOf",
                
                # Chart.js dataset properties
                "DatensetLabel": "datasetLabel", 
                "DatenIndex": "dataIndex",
                
                # Common JavaScript objects/properties
                "Daten]": "data]",
                "Daten.": "data.",
                "Daten,": "data,",
                "Daten)": "data)",
                "...Daten": "...data",
                
                # Function parameters 
                "(Daten)": "(data)",
                "(Daten,": "(data,",
            }
            
        elif language_code == 'es':
            api_fixes = {
                # Spanish API fixes
                ".datos": ".data",
                ".opciones": ".options",
                ".plugins": ".plugins", 
                ".escalas": ".scales",
                ".leyenda": ".legend",
                ".título": ".title",
                "context.conjuntoDatos": "context.dataset",
                "context.índiceDatos": "context.dataIndex",
                
                # Common patterns
                "datos]": "data]",
                "datos.": "data.",
                "datos,": "data,",
                "datos)": "data)",
            }
            
        elif language_code == 'pt':
            api_fixes = {
                # Portuguese API fixes  
                ".dados": ".data",
                ".opções": ".options",
                ".plugins": ".plugins",
                ".escalas": ".scales", 
                ".legenda": ".legend",
                ".título": ".title",
                "context.conjuntoDados": "context.dataset",
                "context.índiceDados": "context.dataIndex",
                
                # Common patterns
                "dados]": "data]",
                "dados.": "data.",
                "dados,": "data,", 
                "dados)": "data)",
            }
        else:
            api_fixes = {}
        
        # Apply API fixes
        for incorrect, correct in api_fixes.items():
            if incorrect in content:
                content = content.replace(incorrect, correct)
                changes_made += 1
                print(f"  ✅ Fixed JS API: {incorrect} → {correct}")
        
        # Additional comprehensive fixes using regex for context-sensitive patterns
        regex_fixes = [
            # Fix data property in object literals: { data: ... } not { Daten: ... }
            (r'\{\s*Daten:', '{ data:'),
            (r',\s*Daten:', ', data:'),
            
            # Fix dataset property access
            (r'\.Datenset\b', '.dataset'),
            (r'\.DatenIndex\b', '.dataIndex'),
            
            # Fix Chart.js configuration properties
            (r'\btype:\s*"([^"]+)",\s*Daten:', r'type: "\1", data:'),
        ]
        
        for pattern, replacement in regex_fixes:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes_made += 1
                content = new_content
                print(f"  ✅ Applied regex fix: {pattern}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} JavaScript API fixes to {file_path}")
        else:
            print(f"  ℹ️ No JavaScript API fixes needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix JavaScript API properties"""
    
    print("🔧 Fixing JavaScript API Properties Translation")
    print("=" * 55)
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'),
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = fix_javascript_api_properties(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 JavaScript API Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ JavaScript API properties fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Test charts in browser - should work without errors now")
    else:
        print(f"\n✅ All JavaScript API properties are correct!")

if __name__ == "__main__":
    main()
