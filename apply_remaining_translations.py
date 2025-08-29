#!/usr/bin/env python3
"""
Final Translation Script - Handles Remaining Untranslated Content
Uses precise pattern matching to catch all missed translations
"""

import json
import re
import sys
from pathlib import Path

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_final_translations(html_content, language_code):
    """Apply final translations for specific problematic patterns"""
    
    translations = load_translations()
    
    # Language-specific translations
    lang_map = {
        'de': {
            'Search in SQL++ statements...': 'In SQL++ Anweisungen suchen...',
            'Database Operations Timeline: Index Scans vs Document Fetches': 'Datenbank-Operationen Timeline: Index-Scans vs Dokument-Abrufe',
            'Filter Operations Timeline: Efficiency Analysis (IN vs OUT)': 'Filter-Operationen Timeline: Effizienz-Analyse (EINGANG vs AUSGANG)',  
            'Query Performance Timeline: KernTime % of ExecutionTime': 'Abfrage-Performance Timeline: KernTime % der Ausführungszeit',
            'Yes': 'Ja',
            'No': 'Nein',
            'Dashboard': 'Instrumententafel',
            'Timeline': 'Zeitverlauf', 
            'Analysis': 'Analysieren',
            'Every Query': 'Jede Abfrage',
            'Index/Query Flow': 'Index/Abfrage-Fluss',
            'Indexes': 'Indizes',
            'Query Groups': 'Abfragegruppen'
        },
        'es': {
            'Search in SQL++ statements...': 'Buscar en declaraciones SQL++...',
            'Database Operations Timeline: Index Scans vs Document Fetches': 'Línea de Tiempo de Operaciones de Base de Datos: Escaneos de Índice vs Recuperación de Documentos',
            'Filter Operations Timeline: Efficiency Analysis (IN vs OUT)': 'Línea de Tiempo de Operaciones de Filtro: Análisis de Eficiencia (ENTRADA vs SALIDA)',
            'Query Performance Timeline: KernTime % of ExecutionTime': 'Línea de Tiempo de Rendimiento de Consultas: % de KernTime del Tiempo de Ejecución',
            'Yes': 'Sí',
            'No': 'No',
            'Dashboard': 'Panel de Control',
            'Timeline': 'Línea de Tiempo',
            'Analysis': 'Análisis',
            'Every Query': 'Cada Consulta',
            'Index/Query Flow': 'Flujo de Índice/Consulta',
            'Indexes': 'Índices',
            'Query Groups': 'Grupos de Consulta'
        },
        'pt': {
            'Search in SQL++ statements...': 'Buscar em declarações SQL++...',
            'Database Operations Timeline: Index Scans vs Document Fetches': 'Linha do Tempo de Operações de Banco de Dados: Varreduras de Índice vs Recuperação de Documentos',
            'Filter Operations Timeline: Efficiency Analysis (IN vs OUT)': 'Linha do Tempo de Operações de Filtro: Análise de Eficiência (ENTRADA vs SAÍDA)',
            'Query Performance Timeline: KernTime % of ExecutionTime': 'Linha do Tempo de Desempenho de Consultas: % de KernTime do Tempo de Execução',
            'Yes': 'Sim',
            'No': 'Não',
            'Dashboard': 'Painel de Controle',
            'Timeline': 'Linha do Tempo',
            'Analysis': 'Análise',
            'Every Query': 'Cada Consulta', 
            'Index/Query Flow': 'Fluxo de Índice/Consulta',
            'Indexes': 'Índices',
            'Query Groups': 'Grupos de Consulta'
        }
    }
    
    if language_code not in lang_map:
        return html_content
    
    # Apply translations using simple string replacement
    for english, target in lang_map[language_code].items():
        
        # Multiple replacement patterns to catch all instances
        patterns = [
            f'>{english}<',  # Between HTML tags
            f'"{english}"',  # In quotes  
            f"'{english}'",  # In single quotes
            f'placeholder="{english}"',  # Placeholder attributes
            f'title="{english}"',  # Title attributes
            f'text: "{english}"',  # Chart configurations
            f'label: "{english}"',  # Chart labels
            f'textContent = "{english}"',  # JavaScript assignments
            f'innerHTML = "{english}"',  # JavaScript innerHTML
        ]
        
        for pattern in patterns:
            replacement = pattern.replace(english, target)
            html_content = html_content.replace(pattern, replacement)
    
    return html_content

def process_file(file_path, language_code):
    """Process a single language file"""
    
    language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
    language_name = language_names.get(language_code, language_code)
    
    if not file_path.exists():
        print(f"❌ {file_path} not found")
        return False
    
    print(f"🌍 Processing final {language_name} translations...")
    
    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Apply final translations
    translated_content = apply_final_translations(content, language_code)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(translated_content)
    
    print(f"✅ {language_name} final translations applied")
    return True

def main():
    """Main function"""
    
    print("🎯 Applying final translations to catch remaining English text...")
    
    languages = ['de', 'es', 'pt']
    
    for lang in languages:
        file_path = Path(f'{lang}/index.html')
        process_file(file_path, lang)
    
    print("\n🎉 Final translation pass completed!")

if __name__ == '__main__':
    main()
