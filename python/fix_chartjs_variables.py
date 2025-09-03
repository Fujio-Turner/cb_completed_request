#!/usr/bin/env python3
"""
Fix Chart.js Variables Translation

This script fixes Chart.js API variables that were incorrectly translated.
Chart.js requires specific property names like "datasets" to remain in English.
"""

import os

def fix_chartjs_variables(file_path, language_code):
    """Fix Chart.js variables that were incorrectly translated"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} Chart.js fixes...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Chart.js API requires these exact property names
        chartjs_fixes = {
            # German fixes
            "Datensets:": "datasets:",
            "const Datensets": "const datasets", 
            "Datensets.push(": "datasets.push(",
            "Datensets: Datensets": "datasets: datasets",
            "Datensets.map(": "datasets.map(",
            "chart.Daten": "chart.data",
            "chart.data.Datensets": "chart.data.datasets",
            
            # Fix comment references
            "// Generate Datensets": "// Generate datasets",
            "// Handle regular statement type Datensets": "// Handle regular statement type datasets",
            "statement type Datensets": "statement type datasets",
            "for large Datensets": "for large datasets",
            "smaller Datensets": "smaller datasets",
            
            # Spanish fixes (if any)
            "conjuntos de datos:": "datasets:",
            "const conjuntosDeDatos": "const datasets",
            
            # Portuguese fixes (if any) 
            "conjuntos de dados:": "datasets:",
            "const conjuntosDeDados": "const datasets",
        }
        
        # Apply fixes for Chart.js API compliance
        for incorrect_var, correct_var in chartjs_fixes.items():
            if incorrect_var in content:
                content = content.replace(incorrect_var, correct_var)
                changes_made += 1
                print(f"  ✅ Fixed Chart.js variable: {incorrect_var} → {correct_var}")
        
        # Additional specific Chart.js property fixes
        if language_code == 'de':
            # Fix any other German Chart.js property issues
            additional_fixes = {
                "chart.Daten.Datensets": "chart.data.datasets",
                ".Datensets[": ".datasets[",
                "Datensets\\[": "datasets[",
            }
            
            for incorrect, correct in additional_fixes.items():
                if incorrect in content:
                    content = content.replace(incorrect, correct)
                    changes_made += 1
                    print(f"  ✅ Fixed Chart.js property: {incorrect} → {correct}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} Chart.js variables in {file_path}")
        else:
            print(f"  ℹ️ No Chart.js variable fixes needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix Chart.js variables"""
    
    print("🔧 Fixing Chart.js Variables Translation")
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
            changes = fix_chartjs_variables(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Chart.js Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Chart.js variables have been fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Test charts in browser to verify they work")
    else:
        print(f"\n✅ All Chart.js variables are correct!")

if __name__ == "__main__":
    main()
