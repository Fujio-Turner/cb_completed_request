#!/usr/bin/env python3
"""
Translate Tab Headers

This script specifically handles the main navigation tab headers
which are critical for the localization verification.
"""

import json
import os

def translate_tab_headers(file_path, language_code):
    """Translate main tab headers safely"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} tab header translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changes_made = 0
        
        # Define tab header translations
        if language_code == 'de':
            tab_translations = {
                '>Dashboard<': '>Instrumententafel<',
                '>Timeline<': '>Zeitverlauf<',
                '>Analysis<': '>Analysieren<',
                '>Insights<': '>Erkenntnisse<',
                '>Every Query<': '>Jede Abfrage<',
                '>Index/Query Flow<': '>Index/Abfrage-Fluss<',
                '>Indexes<': '>Indizes<',
            }
        elif language_code == 'es':
            tab_translations = {
                '>Dashboard<': '>Panel de Control<',
                '>Timeline<': '>Línea de Tiempo<',
                '>Analysis<': '>Análisis<',
                '>Insights<': '>Perspectivas<',
                '>Every Query<': '>Cada Consulta<',
                '>Index/Query Flow<': '>Flujo de Índice/Consulta<',
                '>Indexes<': '>Índices<',
            }
        elif language_code == 'pt':
            tab_translations = {
                '>Dashboard<': '>Painel de Controle<',
                '>Timeline<': '>Linha do Tempo<',
                '>Analysis<': '>Análise<',
                '>Insights<': '>Insights<',
                '>Every Query<': '>Cada Consulta<',
                '>Index/Query Flow<': '>Fluxo de Índice/Consulta<',
                '>Indexes<': '>Índices<',
            }
        else:
            return 0
        
        # Apply tab header translations
        for english_tab, translated_tab in tab_translations.items():
            if english_tab in content:
                content = content.replace(english_tab, translated_tab)
                changes_made += 1
                print(f"  ✅ Translated tab: {english_tab} → {translated_tab}")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} tab header translations to {file_path}")
        else:
            print(f"  ℹ️ No tab header translations needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to translate tab headers"""
    
    print("🌍 Translating Tab Headers")
    print("=" * 35)
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'),
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = translate_tab_headers(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Tab Header Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Tab headers translated!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All tab headers are already translated!")

if __name__ == "__main__":
    main()
