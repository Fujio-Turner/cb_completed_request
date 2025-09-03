#!/usr/bin/env python3
"""
Fix About Function Translation

This script translates the QueryAnalyzer.about() function output 
that appears in console.log.
"""

import os

def fix_about_function(file_path, language_code):
    """Fix about function console output"""
    
    print(f"🔄 Processing {file_path} for {language_code.upper()} about function...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = 0
        
        # Define translated about function templates
        if language_code == 'de':
            about_template = '''                    console.log(`
🔍 Couchbase Query Analyzer v${info.version}
📅 Letztes Update: ${info.lastUpdated}
🎯 Zweck: Analysiert Couchbase N1QL Query Performance von system:completed_requests

🚀 Features:
${info.features.map((f) => `   • ${f}`).join("\\n")}

🔧 Verwendung:
   • JSON-Daten in das linke Textfeld einfügen
   • "JSON Analysieren" klicken für Performance-Analyse
   • Index-Daten in das rechte Textfeld für erweiterte Analyse

💡 Tipp: Verwenden Sie die Timeline für zeitbasierte Analyse
📊 Dashboard: Überblick über Query-Performance-Metriken
🔍 Insights: Automatische Performance-Problem-Erkennung

📚 Dokumentation: https://github.com/Fujio-Turner/cb_completed_request
🐛 Issues: https://github.com/Fujio-Turner/cb_completed_request/issues
                `)'''
                
        elif language_code == 'es':
            about_template = '''                    console.log(`
🔍 Analizador de Consultas Couchbase v${info.version}
📅 Última Actualización: ${info.lastUpdated}
🎯 Propósito: Analizar rendimiento de consultas N1QL de Couchbase desde system:completed_requests

🚀 Características:
${info.features.map((f) => `   • ${f}`).join("\\n")}

🔧 Uso:
   • Pegue datos JSON en el área de texto izquierda
   • Haga clic en "Analizar JSON" para análisis de rendimiento
   • Datos de índices en el área de texto derecha para análisis avanzado

💡 Consejo: Use la línea de tiempo para análisis basado en tiempo
📊 Dashboard: Resumen de métricas de rendimiento de consultas
🔍 Insights: Detección automática de problemas de rendimiento

📚 Documentación: https://github.com/Fujio-Turner/cb_completed_request
🐛 Issues: https://github.com/Fujio-Turner/cb_completed_request/issues
                `)'''
                
        elif language_code == 'pt':
            about_template = '''                    console.log(`
🔍 Analisador de Consultas Couchbase v${info.version}
📅 Última Atualização: ${info.lastUpdated}
🎯 Propósito: Analisar performance de consultas N1QL do Couchbase de system:completed_requests

🚀 Recursos:
${info.features.map((f) => `   • ${f}`).join("\\n")}

🔧 Uso:
   • Cole dados JSON na área de texto esquerda
   • Clique em "Analisar JSON" para análise de performance
   • Dados de índices na área de texto direita para análise avançada

💡 Dica: Use a linha do tempo para análise baseada em tempo
📊 Dashboard: Visão geral das métricas de performance de consultas
🔍 Insights: Detecção automática de problemas de performance

📚 Documentação: https://github.com/Fujio-Turner/cb_completed_request
🐛 Issues: https://github.com/Fujio-Turner/cb_completed_request/issues
                `)'''
        else:
            return 0
        
        # Find the English about function console.log
        english_pattern = '''                    console.log(`
🔍 Couchbase Query Analyzer v${info.version}
📅 Last Updated: ${info.lastUpdated}
🎯 Purpose: Analyze Couchbase N1QL query performance from system:completed_requests

🚀 Features:
${info.features.map((f) => `   • ${f}`).join("\\n")}

🔧 Usage:
   • Paste JSON data in left textarea
   • Click "Parse JSON" for performance analysis
   • Index data in right textarea for advanced analysis

💡 Tip: Use Timeline for time-based analysis
📊 Dashboard: Overview of query performance metrics
🔍 Insights: Automated performance issue detection

📚 Documentation: https://github.com/Fujio-Turner/cb_completed_request
🐛 Issues: https://github.com/Fujio-Turner/cb_completed_request/issues
                `)'''
        
        if english_pattern in content:
            content = content.replace(english_pattern, about_template)
            changes_made += 1
            print(f"  ✅ Translated complete about() function output")
        else:
            print(f"  ℹ️ About function already translated or pattern not found")
        
        # Write back if changes were made
        if changes_made > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  🎉 Fixed {changes_made} about function in {file_path}")
        else:
            print(f"  ℹ️ No about function fixes needed in {file_path}")
            
        return changes_made
        
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    """Main function to fix about function"""
    
    print("🌍 Fixing About Function Translation")
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
            changes = fix_about_function(file_path, language_code)
            total_changes += changes
        else:
            print(f"⚠️ File not found: {file_path}")
    
    print(f"\n📊 About Function Fix Summary:")
    print(f"   Total changes applied: {total_changes}")
    
    if total_changes > 0:
        print(f"\n✅ About function translations applied!")
        print(f"   🔍 Run validation: python3 python/validate_js_syntax.py")
    else:
        print(f"\n✅ All about functions are already translated!")

if __name__ == "__main__":
    main()
