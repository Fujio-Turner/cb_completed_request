#!/usr/bin/env python3
"""
Insights Translation Script

This script handles the complex insights content that includes
performance explanations, recommendations, and technical descriptions.
"""

import json
import re
import os

def load_translations():
    """Load translations from JSON file"""
    with open('settings/translations.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def apply_insights_translations(file_path, language_code, translations):
    """Apply insights content translations to a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} insights translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Get UI strings for this language
        ui_strings = translations["ui_strings"]
        
        # Complex insights explanations with dynamic data
        complex_patterns = [
            # Pattern: "X queries scan an average of Y index entries but returned back an avg Z records per query or a selectivity of W%"
            (
                r'(\d+) queries scan an average of ([\d,]+) index entries but returned back an avg ([\d,]+) records per query or a selectivity of ([\d.]+%)',
                {
                    'pt': r'\1 consultas verificam uma média de \2 entradas de índice mas retornaram uma média de \3 registros por consulta ou uma seletividade de \4',
                    'es': r'\1 consultas escanean un promedio de \2 entradas de índice pero devolvieron un promedio de \3 registros por consulta o una selectividad de \4',
                    'de': r'\1 Abfragen scannen durchschnittlich \2 Index-Einträge, gaben aber durchschnittlich \3 Datensätze pro Abfrage oder eine Selektivität von \4 zurück'
                }
            ),
            
            # Pattern: "X total indexes: Y indexes with an avg scan time between 2-10 seconds Z indexes with an avg scan time of 10+ seconds W #primary indexes with an avg scan time of 2+ seconds"
            (
                r'(\d+) total indexes:[\s\n]*(\d+) indexes with an avg scan time between 2-10 seconds[\s\n]*(\d+) indexes with an avg scan time of 10\+ seconds[\s\n]*(\d+) #primary indexes with an avg scan time of 2\+ seconds',
                {
                    'pt': r'\1 índices totais:\n\2 índices com tempo médio de varredura entre 2-10 segundos\n\3 índices com tempo médio de varredura de 10+ segundos\n\4 índices #primary com tempo médio de varredura de 2+ segundos',
                    'es': r'\1 índices totales:\n\2 índices con tiempo promedio de escaneo entre 2-10 segundos\n\3 índices con tiempo promedio de escaneo de 10+ segundos\n\4 índices #primary con tiempo promedio de escaneo de 2+ segundos',
                    'de': r'\1 Indizes insgesamt:\n\2 Indizes mit durchschnittlicher Scan-Zeit zwischen 2-10 Sekunden\n\3 Indizes mit durchschnittlicher Scan-Zeit von 10+ Sekunden\n\4 #primary Indizes mit durchschnittlicher Scan-Zeit von 2+ Sekunden'
                }
            ),
            
            # Pattern: "Primary indexes on avg are scanning X items with an avg scan time of Yms. These could benefit from secondary indexes."
            (
                r'Primary indexes on avg are scanning ([\d,]+) items with an avg scan time of (\d+)ms\. These could benefit from secondary indexes\.',
                {
                    'pt': r'Os índices primários em média estão verificando \1 itens com tempo médio de varredura de \2ms. Estes poderiam se beneficiar de índices secundários.',
                    'es': r'Los índices primarios en promedio están escaneando \1 elementos con un tiempo promedio de escaneo de \2ms. Estos podrían beneficiarse de índices secundarios.',
                    'de': r'Primäre Indizes scannen durchschnittlich \1 Elemente mit einer durchschnittlichen Scan-Zeit von \2ms. Diese könnten von sekundären Indizes profitieren.'
                }
            ),
            
            # Pattern: "X queries whose average percentage of sum of their core execTime / kernTime is Y%."
            (
                r'(\d+) queries whose average percentage of sum of their (.+?) / kernTime is ([\d.]+%)\.',
                {
                    'pt': r'\1 consultas cuja porcentagem média da soma de seu \2 / kernTime é \3.',
                    'es': r'\1 consultas cuyo porcentaje promedio de la suma de su \2 / kernTime es \3.',
                    'de': r'\1 Abfragen, deren durchschnittlicher Prozentsatz der Summe ihrer \2 / kernTime \3 beträgt.'
                }
            ),
            
            # Pattern: "X queries are using avg YGB of memory each, indicating potential memory optimization opportunities."
            (
                r'(\d+) queries are using avg ([\d.]+)GB of memory each, indicating potential memory optimization opportunities\.',
                {
                    'pt': r'\1 consultas estão usando uma média de \2GB de memória cada, indicando oportunidades potenciais de otimização de memória.',
                    'es': r'\1 consultas están usando un promedio de \2GB de memoria cada una, indicando oportunidades potenciales de optimización de memoria.',
                    'de': r'\1 Abfragen verwenden durchschnittlich \2GB Speicher jeweils, was auf potenzielle Speicheroptimierungsmöglichkeiten hinweist.'
                }
            ),
            
            # Pattern: "X USE KEY queries with avg query time of YY:YY.YYY, suggesting potential KV service bottlenecks."
            (
                r'(\d+) USE KEY queries with avg query time of (\d+:\d+\.\d+), suggesting potential KV service bottlenecks\.',
                {
                    'pt': r'\1 consultas USE KEY com tempo médio de consulta de \2, sugerindo possíveis gargalos do serviço KV.',
                    'es': r'\1 consultas USE KEY con tiempo promedio de consulta de \2, sugiriendo posibles cuellos de botella del servicio KV.',
                    'de': r'\1 USE KEY Abfragen mit durchschnittlicher Abfragezeit von \2, was auf potenzielle KV-Service-Engpässe hindeutet.'
                }
            ),
            
            # Pattern: "X queries (Y%) lack WHERE clauses, potentially scanning entire collections unnecessarily."
            (
                r'(\d+) queries \(([\d.]+%)\) lack WHERE clauses, potentially scanning entire collections unnecessarily\.',
                {
                    'pt': r'\1 consultas (\2) carecem de cláusulas WHERE, potencialmente verificando coleções inteiras desnecessariamente.',
                    'es': r'\1 consultas (\2) carecen de cláusulas WHERE, potencialmente escaneando colecciones enteras innecesariamente.',
                    'de': r'\1 Abfragen (\2) fehlen WHERE-Klauseln und scannen möglicherweise unnötig ganze Sammlungen.'
                }
            ),
            
            # Pattern: "X queries with avg size: YMB with Z% of the time of the query was streaming data out to the application."
            (
                r'(\d+) queries with avg size: ([\d.]+)MB with ([\d.]+%) of the time of the query was streaming data out to the application\.',
                {
                    'pt': r'\1 consultas com tamanho médio: \2MB com \3% do tempo da consulta foi gasto transmitindo dados para a aplicação.',
                    'es': r'\1 consultas con tamaño promedio: \2MB con \3% del tiempo de la consulta se dedicó a transmitir datos a la aplicación.',
                    'de': r'\1 Abfragen mit durchschnittlicher Größe: \2MB mit \3% der Abfragezeit wurde für das Streaming von Daten zur Anwendung verwendet.'
                }
            ),
            
            # Pattern: "X queries return result sets with avg size of YMB, which can consume significant memory and network resources."
            (
                r'(\d+) queries return result sets with avg size of ([\d.]+)MB, which can consume significant memory and network resources\.',
                {
                    'pt': r'\1 consultas retornam conjuntos de resultados com tamanho médio de \2MB, o que pode consumir memória significativa e recursos de rede.',
                    'es': r'\1 consultas devuelven conjuntos de resultados con tamaño promedio de \2MB, lo que puede consumir memoria significativa y recursos de red.',
                    'de': r'\1 Abfragen geben Ergebnissätze mit durchschnittlicher Größe von \2MB zurück, was erheblichen Speicher und Netzwerkressourcen verbrauchen kann.'
                }
            ),
            
            # Pattern: "X queries are consistently approaching timeout thresholds, with Y queries actually timing out in the analyzed period."
            (
                r'(\d+) queries are consistently approaching timeout thresholds, with (\d+) queries actually timing out in the analyzed period\.',
                {
                    'pt': r'\1 consultas estão consistentemente se aproximando dos limites de timeout, com \2 consultas realmente expirando no período analisado.',
                    'es': r'\1 consultas se acercan consistentemente a los umbrales de timeout, con \2 consultas realmente expirando en el período analizado.',
                    'de': r'\1 Abfragen nähern sich konsistent den Timeout-Schwellenwerten, wobei \2 Abfragen tatsächlich im analysierten Zeitraum das Timeout erreichen.'
                }
            ),
        ]
        
        # Apply complex pattern translations
        for pattern, translations_dict in complex_patterns:
            if language_code in translations_dict:
                replacement = translations_dict[language_code]
                new_content = re.sub(pattern, replacement, content)
                if new_content != content:
                    changes_made += 1
                    content = new_content
                    print(f"  ✅ Applied complex pattern: {pattern[:50]}...")
        
        # Simple text replacements for common phrases
        simple_replacements = {
            "(excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()).": "(excluindo funções agregadas como COUNT(), AVG(), MIN(), MAX())." if language_code == 'pt' else "(excluyendo funciones agregadas como COUNT(), AVG(), MIN(), MAX())." if language_code == 'es' else "(außer Aggregatfunktionen wie COUNT(), AVG(), MIN(), MAX()).",
            
            "use LIKE operations with leading wildcards (%text), preventing index usage and causing full scans.": "usam operações LIKE com wildcards iniciais (%texto), impedindo o uso de índice e causando varreduras completas." if language_code == 'pt' else "usan operaciones LIKE con comodines al inicio (%texto), impidiendo el uso de índices y causando escaneos completos." if language_code == 'es' else "verwenden LIKE-Operationen mit führenden Wildcards (%text), verhindern die Indexnutzung und verursachen vollständige Scans.",
        }
        
        # Apply simple replacements
        for english_text, translated_text in simple_replacements.items():
            if english_text in content:
                content = content.replace(english_text, translated_text)
                changes_made += 1
                print(f"  ✅ Translated: {english_text[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Applied {changes_made} insights translations to {file_path}")
        else:
            print(f"  ℹ️ No missing insights translations found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply insights translations"""
    
    print("🌍 Applying Insights Translations to Localized Files")
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
            changes = apply_insights_translations(file_path, language_code, translations)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Insights Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Insights translations have been applied!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All insights translations are already up to date!")

if __name__ == "__main__":
    main()
