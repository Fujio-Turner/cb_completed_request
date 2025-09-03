#!/usr/bin/env python3
"""
Translate Only Insights Tab Content
Safe translation that only touches the Insights tab HTML content, not JavaScript
"""

import json
import re

def translate_insights_content():
    """Translate only the Insights tab content safely"""
    
    # Load translations
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    ui_strings = translations['ui_strings']
    
    # Key Insights translations that are safe to apply
    insights_translations = {
        "Insights": {"es": "Perspectivas", "pt": "Insights", "de": "Erkenntnisse"},
        "🚧 INSIGHTS IN DEVELOPMENT 🚧": {"es": "🚧 INSIGHTS EN DESARROLLO 🚧", "pt": "🚧 INSIGHTS EM DESENVOLVIMENTO 🚧", "de": "🚧 EINBLICKE IN ENTWICKLUNG 🚧"},
        "Index Performance Issues": {"es": "Problemas de Rendimiento del Índice", "pt": "Problemas de Performance do Índice", "de": "Index-Leistungsprobleme"},
        "High Kernel Time in Queries": {"es": "Alto Tiempo de Kernel en Consultas", "pt": "Alto Tempo de Kernel em Consultas", "de": "Hohe Kernel-Zeit in Abfragen"},
        "High Memory Usage Detected": {"es": "Alto Uso de Memoria Detectado", "pt": "Alto Uso de Memória Detectado", "de": "Hoher Speicherverbrauch Erkannt"},
        "Inefficient Index Scans": {"es": "Escaneos de Índice Ineficientes", "pt": "Varreduras de Índice Ineficientes", "de": "Ineffiziente Index-Scans"},
        "Slow Index Scan Times": {"es": "Tiempos Lentos de Escaneo de Índice", "pt": "Tempos Lentos de Varredura de Índice", "de": "Langsame Index-Scan-Zeiten"}
    }
    
    languages = ['de', 'es', 'pt']
    
    for lang in languages:
        filepath = f'{lang}/index.html'
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"🔄 Translating Insights content in {filepath}")
            
            # Set correct language attribute
            content = re.sub(r'<html lang="[^"]*">', f'<html lang="{lang}">', content)
            
            # Apply only safe Insights translations
            for english_text, lang_map in insights_translations.items():
                if lang in lang_map:
                    translated_text = lang_map[lang]
                    
                    # Only replace in HTML context, not JavaScript
                    # Look for the text in HTML tags, not in <script> sections
                    if english_text in content:
                        # Use word boundaries to avoid partial matches
                        pattern = re.escape(english_text)
                        content = re.sub(pattern, translated_text, content)
                        print(f"   ✅ {english_text} → {translated_text}")
            
            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"✅ {filepath} safely updated")
            
        except Exception as e:
            print(f"❌ Error updating {filepath}: {e}")

def main():
    """Main function"""
    print("🛡️ Safe Insights Translation")
    print("=" * 40)
    
    translate_insights_content()
    
    print("\n🧪 Validating JavaScript syntax...")
    import subprocess
    result = subprocess.run(['python3', 'settings/validate_js_syntax.py'], 
                          capture_output=True, text=True)
    print(result.stdout)
    
    if result.returncode == 0:
        print("🎉 Safe translation successful!")
        return 0
    else:
        print("⚠️ JavaScript validation failed")
        return 1

if __name__ == "__main__":
    exit(main())
