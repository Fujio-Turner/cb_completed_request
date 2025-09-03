#!/usr/bin/env python3
"""
Complete Chart.js Fix

This script fixes ALL Chart.js API compliance issues including
property names and variable references.
"""

import os
import re

def fix_chartjs_complete(file_path, language_code):
    """Complete Chart.js fixes for a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} Chart.js complete fixes...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Chart.js API requires these exact property names - NEVER translate these
        chartjs_api_fixes = {
            # Property names (Chart.js API requirements)
            "Daten:": "data:",
            "datasets: Datensets": "datasets: datasets",
            "Optionen:": "options:",
            "Plugins:": "plugins:", 
            "Scales:": "scales:",
            "Titel:": "title:",
            "Legende:": "legend:",
            
            # Variable names that reference Chart.js objects
            "Datensets": "datasets",
            "chartDaten": "chartData",
            "chartOptionen": "chartOptions",
            
            # Spanish equivalents
            "datos:": "data:",
            "opciones:": "options:",
            "escalas:": "scales:",
            "título:": "title:",
            "leyenda:": "legend:",
            "conjuntosDatos": "datasets",
            
            # Portuguese equivalents  
            "dados:": "data:",
            "opções:": "options:",
            "escalas:": "scales:",
            "título:": "title:",
            "legenda:": "legend:",
            "conjuntosDados": "datasets",
        }
        
        # Apply Chart.js API fixes
        for incorrect, correct in chartjs_api_fixes.items():
            if incorrect in content:
                content = content.replace(incorrect, correct)
                changes_made += 1
                print(f"  ✅ Fixed Chart.js API: {incorrect} → {correct}")
        
        # Fix any remaining variable declaration issues
        variable_fixes = {
            "const Datensets =": "const datasets =",
            "let Datensets =": "let datasets =",
            "var Datensets =": "var datasets =",
            "Datensets.push(": "datasets.push(",
            "Datensets.map(": "datasets.map(",
            "Datensets.forEach(": "datasets.forEach(",
            "Datensets[": "datasets[",
            "...Datensets": "...datasets",
        }
        
        for incorrect, correct in variable_fixes.items():
            if incorrect in content:
                content = content.replace(incorrect, correct)
                changes_made += 1
                print(f"  ✅ Fixed variable reference: {incorrect} → {correct}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} Chart.js complete fixes to {file_path}")
        else:
            print(f"  ℹ️ No Chart.js fixes needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply complete Chart.js fixes"""
    
    print("🔧 Applying Complete Chart.js Fixes")
    print("=" * 50)
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'), 
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = fix_chartjs_complete(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Complete Chart.js Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Complete Chart.js fixes applied!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Test in browser to verify charts work")
    else:
        print(f"\n✅ All Chart.js variables are already correct!")

if __name__ == "__main__":
    main()
