#!/usr/bin/env python3
"""
Simple HTML Translator - The ONLY translation script needed

This script provides basic HTML text translation functionality while protecting
JavaScript, CSS classes, IDs, and technical elements.

Usage:
  python simple_html_translator.py [language_code]
"""

import sys
import os
import json

def load_translations():
    """Load translations from JSON file"""
    try:
        with open('settings/translations.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Error: settings/translations.json not found")
        return None

def translate_basic_html_content(file_path, language_code):
    """Apply basic HTML content translations only"""
    
    print(f"🔄 Translating {file_path} to {language_code.upper()}...")
    
    # Basic HTML translations - add more as needed
    basic_translations = {
        'de': {
            '<title>Query Analyzer v3.12.0</title>': '<title>Abfrage-Analyzer v3.12.0</title>',
            '>Dashboard</a>': '>Instrumententafel</a>',
            '>Timeline</a>': '>Zeitverlauf</a>',
            '>Query Groups</a>': '>Abfrage-Gruppen</a>',
            '>Every Query</a>': '>Jede Abfrage</a>',
            '>Index/Query Flow</a>': '>Index/Abfrage-Fluss</a>',
            '>Indexes</a>': '>Indizes</a>',
            'From:</label>': 'Von:</label>',
            'To:</label>': 'Bis:</label>',
        },
        'es': {
            '<title>Query Analyzer v3.12.0</title>': '<title>Analizador de Consultas v3.12.0</title>',
            '>Dashboard</a>': '>Panel de Control</a>',
            '>Timeline</a>': '>Línea de Tiempo</a>',
            '>Query Groups</a>': '>Grupos de Consultas</a>',
            '>Every Query</a>': '>Cada Consulta</a>',
            '>Index/Query Flow</a>': '>Flujo de Índice/Consulta</a>',
            '>Indexes</a>': '>Índices</a>',
            'From:</label>': 'Desde:</label>',
            'To:</label>': 'Hasta:</label>',
        },
        'pt': {
            '<title>Query Analyzer v3.12.0</title>': '<title>Analisador de Consultas v3.12.0</title>',
            '>Dashboard</a>': '>Painel de Controle</a>',
            '>Timeline</a>': '>Linha do Tempo</a>',
            '>Query Groups</a>': '>Grupos de Consultas</a>',
            '>Every Query</a>': '>Cada Consulta</a>',
            '>Index/Query Flow</a>': '>Fluxo de Índice/Consulta</a>',
            '>Indexes</a>': '>Índices</a>',
            'From:</label>': 'De:</label>',
            'To:</label>': 'Para:</label>',
        }
    }
    
    if language_code not in basic_translations:
        print(f"❌ Language code '{language_code}' not supported")
        return
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply translations
        changes_made = 0
        translations = basic_translations[language_code]
        
        for english, translated in translations.items():
            if english in content:
                content = content.replace(english, translated)
                changes_made += 1
                print(f"  ✅ Translated: {english[:30]}...")
        
        # Write back
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} translations")
        else:
            print(f"  ℹ️ No translations needed")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

def main():
    """Main function"""
    
    if len(sys.argv) != 2:
        print("Usage: python simple_html_translator.py [language_code]")
        print("Example: python simple_html_translator.py de")
        sys.exit(1)
    
    language_code = sys.argv[1].lower()
    file_path = f"{language_code}/index.html"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    translate_basic_html_content(file_path, language_code)
    print(f"\n✅ Translation complete for {language_code.upper()}")
    print("💡 Remember: TEXT_CONSTANTS should be translated manually in the JavaScript section")

if __name__ == "__main__":
    main()
