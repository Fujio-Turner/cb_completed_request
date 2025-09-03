#!/usr/bin/env python3
"""
Fix Features Array Translation

This script translates the features array in the getVersionInfo() function
which is displayed in the console.log.
"""

import os

def fix_features_array(file_path, language_code):
    """Fix features array in getVersionInfo function"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} features array...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Define translated features arrays
        if language_code == 'de':
            features_array = '''                features: [
                    "Globaler Systemabfrage-Ausschluss",
                    "Verbesserte Barrierefreiheit (ARIA)",
                    "Chart-Performance-Optimierungen", 
                    "Zeitbereich-Filterung mit Puffern",
                    "Index/Abfrage-Flussanalyse",
                    "Toast-Benachrichtigungssystem",
                ],'''
        elif language_code == 'es':
            features_array = '''                features: [
                    "Exclusión global de consultas del sistema",
                    "Accesibilidad mejorada (ARIA)",
                    "Optimizaciones de rendimiento de gráficos",
                    "Filtrado de rango de tiempo con buffers", 
                    "Análisis de flujo de índice/consulta",
                    "Sistema de notificaciones toast",
                ],'''
        elif language_code == 'pt':
            features_array = '''                features: [
                    "Exclusão global de consultas do sistema",
                    "Acessibilidade aprimorada (ARIA)",
                    "Otimizações de performance de gráficos",
                    "Filtragem de intervalo de tempo com buffers",
                    "Análise de fluxo de índice/consulta", 
                    "Sistema de notificações toast",
                ],'''
        else:
            print(f"  ⚠️ Unknown language code: {language_code}")
            return 0
        
        # Replace the English features array
        english_features_pattern = '''                features: [
                    "Global system query exclusion",
                    "Enhanced accessibility (ARIA)",
                    "Chart performance optimizations",
                    "Time range filtering with buffers",
                    "Index/Query Flow analysis",
                    "Toast notification system",
                ],'''
        
        if english_features_pattern in content:
            content = content.replace(english_features_pattern, features_array)
            changes_made += 1
            print(f"  ✅ Translated features array to {language_code.upper()}")
        else:
            print(f"  ℹ️ Features array pattern not found in {file_path}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} features array in {file_path}")
        else:
            print(f"  ℹ️ No features array fixes needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix features arrays"""
    
    print("🌍 Fixing Features Array Translation")
    print("=" * 45)
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'),
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = fix_features_array(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Features Array Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Features arrays have been fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
    else:
        print(f"\n✅ All features arrays are already translated!")

if __name__ == "__main__":
    main()
