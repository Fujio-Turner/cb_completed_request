#!/usr/bin/env python3
"""
Fix Mixed English/Translated Content in Insights

This script specifically fixes the mixed English/Portuguese content
that appears in the Insights section where translations are partial.
"""

import os
import re

def fix_mixed_insights_content(file_path, language_code):
    """Fix mixed content in insights section"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} mixed content fixes...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        changes_made = 0
        
        # Define comprehensive replacements for mixed content
        if language_code == 'pt':
            replacements = {
                # Main explanation paragraph - complete replacement
                "Some insights show <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">LIVE</span> data, <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> insights are work in progress (might have false positives), others display placeholder content.": "Alguns insights mostram dados <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">AO VIVO</span>, insights <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> estão em desenvolvimento (podem ter falsos positivos), outros exibem conteúdo de placeholder.",
                
                # Insight titles that are still in English
                "Inefficient Index Scans": "Varreduras de Índice Ineficientes",
                "Slow Index Scan Times": "Tempos Lentos de Varredura de Índice",
                "Primary Index Over-Usage": "Uso Excessivo de Índice Primário",
                "High Kernel Time in Queries": "Alto Tempo de Kernel em Consultas",
                "High Memory Usage Detected": "Alto Uso de Memória Detectado",
                "Slow USE KEY Queries": "Consultas USE KEY Lentas",
                "Missing WHERE Clauses": "Cláusulas WHERE Ausentes",
                "Complex JOIN Operations": "Operações JOIN Complexas",
                "Inefficient LIKE Operations": "Operações LIKE Ineficientes",
                "Large Payload Streaming": "Streaming de Payload Grande",
                "Large Result Set Queries": "Consultas com Conjunto de Resultados Grandes",
                "Timeout-Prone Queries": "Consultas Propensas a Timeout",
                "Concurrent Query Conflicts": "Conflitos de Consultas Concorrentes",
                
                # Mixed phrases - fix the English parts
                "index entries but returned back an avg": "entradas de índice mas retornaram uma média de",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "excluindo funções agregadas como COUNT(), AVG(), MIN(), MAX()",
                "queries": "consultas",
                "total indexes:": "índices totais:",
                "indexes with an avg scan time between": "índices com tempo médio de varredura entre",
                "indexes with an avg scan time of": "índices com tempo médio de varredura de",
                "#primary indexes with an avg scan time of": "índices #primary com tempo médio de varredura de",
                "seconds": "segundos",
                "Primary indexes on avg are scanning": "Os índices primários em média estão verificando",
                "items with an avg scan time of": "itens com tempo médio de varredura de",
                "These could benefit from secondary indexes": "Estes poderiam se beneficiar de índices secundários",
                "queries whose average percentage": "consultas cuja porcentagem média",
                "queries are using avg": "consultas estão usando uma média de",
                "of memory each": "de memória cada",
                "USE KEY queries with avg query time of": "consultas USE KEY com tempo médio de consulta de",
                "lack WHERE clauses": "carecem de cláusulas WHERE",
                "are taking an average of": "estão levando uma média de",
                "seconds each": "segundos cada",
                "queries with avg size:": "consultas com tamanho médio:",
                "return result sets with avg size of": "retornam conjuntos de resultados com tamanho médio de",
                "are consistently approaching timeout thresholds": "estão consistentemente se aproximando dos limites de timeout",
                "actually timing out": "realmente expirando",
                "show evidence of resource contention": "mostram evidência de contenção de recursos",
                "during peak hours": "durante as horas de pico",
                
                # Common English words that should be translated
                "data": "dados",
                "work in progress": "em desenvolvimento", 
                "might have false positives": "podem ter falsos positivos",
                "display placeholder content": "exibem conteúdo de placeholder",
            }
            
        elif language_code == 'es':
            replacements = {
                # Similar comprehensive replacements for Spanish
                "Some insights show <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">LIVE</span> data, <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> insights are work in progress (might have false positives), others display placeholder content.": "Algunos insights muestran datos <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">EN VIVO</span>, insights <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> están en desarrollo (pueden tener falsos positivos), otros muestran contenido de marcador de posición.",
                
                # Insight titles
                "Inefficient Index Scans": "Escaneos de Índice Ineficientes",
                "Slow Index Scan Times": "Tiempos Lentos de Escaneo de Índice", 
                "Primary Index Over-Usage": "Uso Excesivo de Índice Primario",
                "High Kernel Time in Queries": "Alto Tiempo de Kernel en Consultas",
                "High Memory Usage Detected": "Alto Uso de Memoria Detectado",
                "Slow USE KEY Queries": "Consultas USE KEY Lentas",
                "Missing WHERE Clauses": "Cláusulas WHERE Faltantes",
                "Complex JOIN Operations": "Operaciones JOIN Complejas",
                "Inefficient LIKE Operations": "Operaciones LIKE Ineficientes",
                "Large Payload Streaming": "Transmisión de Carga Útil Grande",
                "Large Result Set Queries": "Consultas con Conjunto de Resultados Grandes",
                "Timeout-Prone Queries": "Consultas Propensas a Timeout",
                "Concurrent Query Conflicts": "Conflictos de Consultas Concurrentes",
                
                # Mixed phrases
                "index entries but returned back an avg": "entradas de índice pero devolvieron un promedio de",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "excluyendo funciones agregadas como COUNT(), AVG(), MIN(), MAX()",
                "queries": "consultas",
                "seconds": "segundos",
                "data": "datos",
            }
            
        elif language_code == 'de':
            replacements = {
                # Comprehensive replacements for German
                "Some insights show <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">LIVE</span> data, <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> insights are work in progress (might have false positives), others display placeholder content.": "Einige Erkenntnisse zeigen <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">LIVE</span> Daten, <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> Erkenntnisse sind in Entwicklung (können falsche Positive haben), andere zeigen Platzhalterinhalt.",
                
                # Insight titles
                "Inefficient Index Scans": "Ineffiziente Index-Scans",
                "Slow Index Scan Times": "Langsame Index-Scan-Zeiten",
                "Primary Index Over-Usage": "Übermäßige Primärindex-Nutzung", 
                "High Kernel Time in Queries": "Hohe Kernel-Zeit in Abfragen",
                "High Memory Usage Detected": "Hoher Speicherverbrauch Erkannt",
                "Slow USE KEY Queries": "Langsame USE KEY Abfragen",
                "Missing WHERE Clauses": "Fehlende WHERE-Klauseln",
                "Complex JOIN Operations": "Komplexe JOIN-Operationen",
                "Inefficient LIKE Operations": "Ineffiziente LIKE-Operationen",
                "Large Payload Streaming": "Große Nutzdaten-Streaming",
                "Large Result Set Queries": "Abfragen mit großen Ergebnissätzen",
                "Timeout-Prone Queries": "Timeout-anfällige Abfragen",
                "Concurrent Query Conflicts": "Gleichzeitige Abfragekonflikte",
                
                # Mixed phrases
                "index entries but returned back an avg": "Index-Einträge, gaben aber durchschnittlich zurück",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "außer Aggregatfunktionen wie COUNT(), AVG(), MIN(), MAX()",
                "queries": "Abfragen",
                "seconds": "Sekunden",
                "data": "Daten",
            }
        
        # Apply replacements
        for english_text, translated_text in replacements.items():
            if english_text in content:
                content = content.replace(english_text, translated_text)
                changes_made += 1
                print(f"  ✅ Fixed mixed content: {english_text[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} mixed content issues in {file_path}")
        else:
            print(f"  ℹ️ No mixed content issues found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix mixed insights content"""
    
    print("🌍 Fixing Mixed English/Translated Content in Insights")
    print("=" * 60)
    
    # Files to process
    files_to_process = [
        ('de/index.html', 'de'),
        ('es/index.html', 'es'), 
        ('pt/index.html', 'pt')
    ]
    
    total_changes = 0
    
    for file_path, language_code in files_to_process:
        if os.path.exists(file_path):
            changes = fix_mixed_insights_content(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Mixed Content Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Mixed content has been fixed!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py") 
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All content is already properly translated!")

if __name__ == "__main__":
    main()
