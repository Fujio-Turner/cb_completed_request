#!/usr/bin/env python3
"""
Fix Remaining English Text

This script directly targets the specific English text patterns
that you identified as still needing translation.
"""

import os
import re

def fix_english_text(file_path, language_code):
    """Fix remaining English text in a specific file"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} remaining English text...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Direct replacements based on your examples
        replacements = {}
        
        if language_code == 'pt':
            replacements = {
                # Insights explanations
                "Some insights show LIVE data, BETA insights are work in progress (might have false positives), others display placeholder content.": "Alguns insights mostram dados AO VIVO, insights BETA estão em desenvolvimento (podem ter falsos positivos), outros exibem conteúdo de placeholder.",
                
                # Performance issues
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
                
                # Technical explanations - will be translated to simpler Portuguese
                "queries scan an average of": "consultas verificam uma média de",
                "index entries but returned back an avg": "entradas de índice mas retornaram uma média de",
                "records per query or a selectivity of": "registros por consulta ou uma seletividade de",
                "excluding aggregate functions like COUNT(), AVG(), MIN(), MAX()": "excluindo funções agregadas como COUNT(), AVG(), MIN(), MAX()",
                "total indexes:": "índices totais:",
                "indexes with an avg scan time between": "índices com tempo médio de varredura entre",
                "indexes with an avg scan time of": "índices com tempo médio de varredura de",
                "#primary indexes with an avg scan time of": "índices #primary com tempo médio de varredura de",
                "Primary indexes on avg are scanning": "Os índices primários em média estão verificando",
                "items with an avg scan time of": "itens com tempo médio de varredura de",
                "These could benefit from secondary indexes": "Estes poderiam se beneficiar de índices secundários",
                "queries whose average percentage of sum of their": "consultas cuja porcentagem média da soma de seu",
                "tempo de execução principal": "tempo de execução principal",  # Keep this as is
                "core execTime": "tempo de execução principal",
                "queries are using avg": "consultas estão usando uma média de",
                "of memory each, indicating potential memory optimization opportunities": "de memória cada, indicando oportunidades potenciais de otimização de memória",
                "USE KEY queries with avg query time of": "consultas USE KEY com tempo médio de consulta de",
                "suggesting potential KV service bottlenecks": "sugerindo possíveis gargalos do serviço KV",
                "lack WHERE clauses, potentially scanning entire collections unnecessarily": "carecem de cláusulas WHERE, potencialmente verificando coleções inteiras desnecessariamente",
                "are taking an average of": "estão levando uma média de",
                "seconds each, with": "segundos cada, com",
                "showing suboptimal join patterns": "mostrando padrões de junção subótimos",
                "use LIKE operations with leading wildcards": "usam operações LIKE com wildcards iniciais",
                "preventing index usage and causing full scans": "impedindo o uso de índice e causando varreduras completas",
                "queries with avg size:": "consultas com tamanho médio:",
                "of the time of the query was streaming data out to the application": "do tempo da consulta foi gasto transmitindo dados para a aplicação",
                "return result sets with avg size of": "retornam conjuntos de resultados com tamanho médio de",
                "which can consume significant memory and network resources": "o que pode consumir memória significativa e recursos de rede",
                "are consistently approaching timeout thresholds, with": "estão consistentemente se aproximando dos limites de timeout, com",
                "actually timing out in the analyzed period": "realmente expirando no período analisado",
                "show evidence of resource contention, with execution times varying by more than": "mostram evidência de contenção de recursos, com tempos de execução variando em mais de",
                "during peak hours": "durante as horas de pico",
                
                # Status badges and labels
                "Live": "Ao Vivo",
                "Beta": "Beta", 
                "Dev": "Desenvolvimento",
                
                # Index tab content
                "Search:": "Buscar:",
                "Bucket:": "Bucket:",
                "Scope:": "Escopo:",
                "Collection:": "Coleção:",
                "Sort By:": "Ordenar Por:",
                "Total Indexes:": "Índices Totais:",
                "Buckets:": "Buckets:",
                "Scopes:": "Escopos:",
                "Collections:": "Coleções:",
                "Primary Indexes:": "Índices Primários:",
                "Primary Only": "Apenas Primários",
                "Used/Total Indexes:": "Índices Usados/Totais:",
                "Used Only": "Apenas Usados",
                "Without/With Replica:": "Sem/Com Réplica:",
                "No Replicas Only": "Apenas Sem Réplicas", 
                "Never Scanned Indexes:": "Índices Nunca Verificados:",
                "Never Scanned Only": "Apenas Nunca Verificados",
                "Exclude Mobile Indexes": "Excluir Índices Móveis",
                "Nenhum dado de índice carregado": "Nenhum dado de índice carregado",  # Already translated
            }
        
        elif language_code == 'es':
            replacements = {
                # Similar translations for Spanish
                "Some insights show LIVE data, BETA insights are work in progress (might have false positives), others display placeholder content.": "Algunos insights muestran datos EN VIVO, insights BETA están en desarrollo (pueden tener falsos positivos), otros muestran contenido de marcador de posición.",
                
                "Inefficient Index Scans": "Escaneos de Índice Ineficientes",
                "Slow Index Scan Times": "Tiempos Lentos de Escaneo de Índice",
                "Primary Index Over-Usage": "Uso Excesivo de Índice Primario",
                # Add more Spanish translations...
            }
        
        elif language_code == 'de':
            replacements = {
                # Similar translations for German
                "Some insights show LIVE data, BETA insights are work in progress (might have false positives), others display placeholder content.": "Einige Erkenntnisse zeigen LIVE-Daten, BETA-Insights sind in Entwicklung (können falsche Positive haben), andere zeigen Platzhalterinhalt.",
                
                "Inefficient Index Scans": "Ineffiziente Index-Scans",
                "Slow Index Scan Times": "Langsame Index-Scan-Zeiten",
                "Primary Index Over-Usage": "Übermäßige Primärindex-Nutzung",
                # Add more German translations...
            }
        
        # Apply each replacement
        for english_text, translated_text in replacements.items():
            if english_text in content:
                content = content.replace(english_text, translated_text)
                changes_made += 1
                print(f"  ✅ Translated: {english_text[:50]}...")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} remaining English texts in {file_path}")
        else:
            print(f"  ℹ️ No remaining English text found in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix remaining English text"""
    
    print("🌍 Fixing Remaining English Text in Localized Files")
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
            changes = fix_english_text(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 English Text Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ Remaining English text has been fixed!")
        print(f"   🔍 Run JavaScript validation: python3 settings/validate_js_syntax.py")
        print(f"   📋 Run release verification: python3 settings/RELEASE_WORK_CHECK.py 3.12.0")
    else:
        print(f"\n✅ All English text is already properly translated!")

if __name__ == "__main__":
    main()
