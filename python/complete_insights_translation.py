#!/usr/bin/env python3
"""
Complete Insights Translation

This script handles ALL remaining English text in the Insights tab,
including the complex performance descriptions, technical explanations,
and insight titles.
"""

import os
import re

def translate_insights_content(file_path, language_code):
    """Translate all insights content to the specified language"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} insights translations...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Define translations for each language
        if language_code == 'de':
            translations = {
                # Main explanation text
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
                
                # Complex descriptions - simplified
                "scan an average of": "scannen durchschnittlich",
                "index entries but returned back an avg": "Index-Einträge, gaben aber durchschnittlich zurück",
                "records per query or a selectivity of": "Datensätze pro Abfrage oder eine Selektivität von",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "außer Aggregatfunktionen wie COUNT(), AVG(), MIN(), MAX()",
                
                # Status indicators
                "Live": "Live",
                "Beta": "Beta",
                "Development": "Entwicklung",
            }
            
        elif language_code == 'es':
            translations = {
                # Main explanation text
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
                
                # Complex descriptions
                "scan an average of": "escanean un promedio de",
                "index entries but returned back an avg": "entradas de índice pero devolvieron un promedio de",
                "records per query or a selectivity of": "registros por consulta o una selectividad de",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "excluyendo funciones agregadas como COUNT(), AVG(), MIN(), MAX()",
                
                # Status indicators
                "Live": "En Vivo", 
                "Beta": "Beta",
                "Development": "Desarrollo",
            }
            
        elif language_code == 'pt':
            translations = {
                # Main explanation text
                "Some insights show <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">LIVE</span> data, <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> insights are work in progress (might have false positives), others display placeholder content.": "Alguns insights mostram dados <span style=\"background: #28a745; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">AO VIVO</span>, insights <span style=\"background: #007bff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: bold;\">BETA</span> estão em desenvolvimento (podem ter falsos positivos), outros exibem conteúdo de placeholder.",
                
                # Insight titles
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
                
                # Complex descriptions
                "scan an average of": "verificam uma média de",
                "index entries but returned back an avg": "entradas de índice mas retornaram uma média de",
                "records per query or a selectivity of": "registros por consulta ou uma seletividade de",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "excluindo funções agregadas como COUNT(), AVG(), MIN(), MAX()",
                
                # Status indicators
                "Live": "Ao Vivo",
                "Beta": "Beta", 
                "Development": "Desenvolvimento",
            }
        
        # Apply translations
        for english_text, translated_text in translations.items():
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
            print(f"  ℹ️ No additional insights translations needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to apply complete insights translations"""
    
    print("🌍 Applying Complete Insights Translations")
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
            changes = translate_insights_content(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 Complete Insights Translation Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Complete insights translations have been applied!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
        print(f"   📋 Run verification: python3 python/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All insights translations are already complete!")

if __name__ == "__main__":
    main()
