#!/usr/bin/env python3
"""
Add Release Notes Script
Automatically adds release notes to all README files to prevent missing updates
"""

import re
from datetime import datetime

def add_release_notes_to_file(filepath, version, date, release_content, language='en'):
    """Add release notes to a specific README file"""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the Release Notes section
        release_notes_pattern = r'(## Release Notes\s*\n)'
        
        if not re.search(release_notes_pattern, content):
            print(f"   ⚠️ No 'Release Notes' section found in {filepath}")
            return False
        
        # Create the new release notes entry
        new_entry = f"\n### Version {version} ({date})\n{release_content}\n"
        
        # Insert after "## Release Notes" but before the first existing version
        replacement = f"\\1{new_entry}"
        updated_content = re.sub(release_notes_pattern, replacement, content)
        
        # Check if version already exists
        if f"### Version {version}" in content:
            print(f"   ⚠️ Version {version} already exists in {filepath}")
            return False
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"   ✅ Added v{version} release notes to {filepath}")
        return True
        
    except Exception as e:
        print(f"   ❌ Error updating {filepath}: {e}")
        return False

def create_release_notes_template(version, features, fixes, improvements):
    """Create standardized release notes template"""
    
    template = ""
    
    if features:
        template += "#### 🚀 New Features\n"
        for feature in features:
            template += f"- **{feature['title']}**: {feature['description']}\n"
        template += "\n"
    
    if fixes:
        template += "#### 🔧 Bug Fixes\n"
        for fix in fixes:
            template += f"- **{fix['title']}**: {fix['description']}\n"
        template += "\n"
    
    if improvements:
        template += "#### 🎯 Technical Improvements\n"
        for improvement in improvements:
            template += f"- **{improvement['title']}**: {improvement['description']}\n"
        template += "\n"
    
    return template.strip()

def add_release_notes_all_files(version, date, release_data):
    """Add release notes to all README files"""
    
    print(f"📝 Adding Release Notes for Version {version}")
    print("=" * 50)
    
    files = [
        ('README.md', 'en', 'English'),
        ('de/README.de.md', 'de', 'German'),
        ('es/README.es.md', 'es', 'Spanish'),
        ('pt/README.pt.md', 'pt', 'Portuguese')
    ]
    
    success_count = 0
    
    for filepath, lang_code, lang_name in files:
        print(f"📄 {lang_name} ({filepath}):")
        
        # Get language-specific content or fall back to English
        content = release_data.get(lang_code, release_data.get('en', ''))
        
        if add_release_notes_to_file(filepath, version, date, content, lang_code):
            success_count += 1
    
    print(f"\n✅ Successfully updated {success_count}/{len(files)} README files")
    return success_count == len(files)

def main():
    """Example usage for v3.10.0"""
    
    # Example release notes for v3.10.0
    release_notes_v3_10_0 = {
        'en': """#### 🚀 New Features
- **Enhanced Insights Dashboard**: Expanded the Insights tab with comprehensive performance analysis and automated query optimization recommendations
- **Improved User Interface**: Added rocket emoji to main title and gradient banner highlighting the new Insights capabilities
- **Enhanced Documentation**: Updated Step 4 guide to prominently feature the new Insights dashboard with detailed feature descriptions

#### 🛡️ Translation & Localization Improvements
- **Protected Translation System**: Implemented comprehensive translation protection to prevent JavaScript syntax errors and HTML attribute corruption
- **Dual Validation System**: Added both JavaScript syntax validation and HTML attribute validation to ensure translation quality
- **Complete Insights Localization**: All Insights content now fully translated across German, Spanish, and Portuguese versions

#### 🔧 Technical Improvements
- **JavaScript Syntax Protection**: Created validation tools to prevent translation-induced JavaScript errors
- **HTML Attribute Protection**: Implemented safeguards to prevent translation of critical HTML IDs and classes
- **Step-Numbered Process Guides**: Added numbered steps to all guide documents for easier partial re-runs ("redo step X only")""",
        
        'de': """#### 🚀 Neue Funktionen
- **Erweitertes Insights-Dashboard**: Erweiterte Insights-Registerkarte mit umfassender Leistungsanalyse und automatisierten Abfrageoptimierungsempfehlungen
- **Verbesserte Benutzeroberfläche**: Raketen-Emoji zum Haupttitel und Gradient-Banner hinzugefügt, die die neuen Insights-Funktionen hervorheben
- **Erweiterte Dokumentation**: Schritt 4-Leitfaden aktualisiert, um das neue Insights-Dashboard mit detaillierten Funktionsbeschreibungen prominent zu präsentieren

#### 🛡️ Übersetzungs- und Lokalisierungsverbesserungen
- **Geschütztes Übersetzungssystem**: Umfassender Übersetzungsschutz implementiert, um JavaScript-Syntaxfehler und HTML-Attributkorruption zu verhindern
- **Duales Validierungssystem**: Sowohl JavaScript-Syntaxvalidierung als auch HTML-Attributvalidierung hinzugefügt, um Übersetzungsqualität zu gewährleisten
- **Vollständige Insights-Lokalisierung**: Alle Insights-Inhalte jetzt vollständig übersetzt in deutsche, spanische und portugiesische Versionen

#### 🔧 Technische Verbesserungen
- **JavaScript-Syntaxschutz**: Validierungstools erstellt, um übersetzungsbedingte JavaScript-Fehler zu verhindern
- **HTML-Attributschutz**: Schutzmaßnahmen implementiert, um Übersetzung kritischer HTML-IDs und -Klassen zu verhindern
- **Nummerierte Prozessleitfäden**: Nummerierte Schritte zu allen Leitfadendokumenten hinzugefügt für einfachere Teilwiederholungen""",
        
        'es': """#### 🚀 Nuevas Características
- **Dashboard de Insights Mejorado**: Expandida la pestaña de Insights con análisis de rendimiento integral y recomendaciones automatizadas de optimización de consultas
- **Interfaz de Usuario Mejorada**: Agregado emoji de cohete al título principal y banner degradado resaltando las nuevas capacidades de Insights
- **Documentación Mejorada**: Actualizada la guía del Paso 4 para presentar prominentemente el nuevo dashboard de Insights con descripciones detalladas de características

#### 🛡️ Mejoras de Traducción y Localización
- **Sistema de Traducción Protegida**: Implementada protección integral de traducción para prevenir errores de sintaxis JavaScript y corrupción de atributos HTML
- **Sistema de Validación Dual**: Agregada validación de sintaxis JavaScript y validación de atributos HTML para asegurar calidad de traducción
- **Localización Completa de Insights**: Todo el contenido de Insights ahora completamente traducido en versiones alemana, española y portuguesa

#### 🔧 Mejoras Técnicas
- **Protección de Sintaxis JavaScript**: Creadas herramientas de validación para prevenir errores JavaScript inducidos por traducción
- **Protección de Atributos HTML**: Implementadas salvaguardas para prevenir traducción de IDs y clases HTML críticas
- **Guías de Proceso Numeradas**: Agregados pasos numerados a todos los documentos de guía para re-ejecuciones parciales más fáciles""",
        
        'pt': """#### 🚀 Novos Recursos
- **Dashboard de Insights Aprimorado**: Expandida a aba de Insights com análise de performance abrangente e recomendações automatizadas de otimização de consultas
- **Interface de Usuário Melhorada**: Adicionado emoji de foguete ao título principal e banner gradiente destacando as novas capacidades de Insights
- **Documentação Aprimorada**: Atualizado o guia do Passo 4 para apresentar proeminentemente o novo dashboard de Insights com descrições detalhadas de recursos

#### 🛡️ Melhorias de Tradução e Localização
- **Sistema de Tradução Protegida**: Implementada proteção abrangente de tradução para prevenir erros de sintaxe JavaScript e corrupção de atributos HTML
- **Sistema de Validação Dupla**: Adicionada validação de sintaxe JavaScript e validação de atributos HTML para garantir qualidade da tradução
- **Localização Completa de Insights**: Todo o conteúdo de Insights agora completamente traduzido nas versões alemã, espanhola e portuguesa

#### 🔧 Melhorias Técnicas
- **Proteção de Sintaxe JavaScript**: Criadas ferramentas de validação para prevenir erros JavaScript induzidos por tradução
- **Proteção de Atributos HTML**: Implementadas salvaguardas para prevenir tradução de IDs e classes HTML críticas
- **Guias de Processo Numerados**: Adicionados passos numerados a todos os documentos de guia para re-execuções parciais mais fáceis"""
    }
    
    # Add release notes for v3.10.0
    success = add_release_notes_all_files("3.10.0", "August 30, 2025", release_notes_v3_10_0)
    
    if success:
        print("\n🎉 All README files updated successfully!")
    else:
        print("\n⚠️ Some README files failed to update")

if __name__ == "__main__":
    main()
