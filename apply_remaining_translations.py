#!/usr/bin/env python3
"""
Additional Translation Pass - Handles remaining specific patterns
"""
import json
import re

def apply_remaining_translations():
    languages = {
        'de': {
            '1 Week': '1 Woche',
            '1 Day': '1 Tag', 
            '1 Hour': '1 Stunde',
            'Clear All': 'Alle Löschen',
            'Original': 'Original',
            'Linear': 'Linear',
            'Logarithmic': 'Logarithmisch',
            'Reset Zoom': 'Zoom Zurücksetzen',
            'Use Charts Current X-Axis Date Range': 'Aktuellen X-Achsen Datumsbereich der Diagramme Verwenden',
            'Primary index scans in production can cause full bucket scans leading to severe performance issues': 'Primäre Index-Scans in der Produktion können vollständige Bucket-Scans verursachen, die zu schwerwiegenden Leistungsproblemen führen',
            'Learn More': 'Mehr Erfahren',
            'Note: #primary count shows total operations, not unique queries': 'Hinweis: #primary Anzahl zeigt Gesamtoperationen, nicht eindeutige Abfragen',
            'Drag box to zoom area': 'Kasten ziehen zum Zoomen des Bereichs',
            'By Optimizer': 'Nach Optimierer',
            'Query Duration Distribution': 'Verteilung der Abfragedauer',
            # Placeholders
            'Paste your JSON output from: SELECT': 'Fügen Sie Ihre JSON-Ausgabe ein von: SELECT',
            'Search usernames...': 'Benutzernamen suchen...',
            'Search indexes...': 'Indizes suchen...',
            'Filter SQL++ Statement Contains': 'Filter SQL++ Anweisung Enthält',
            # Table headers
            'Count': 'Anzahl',
            'User': 'Benutzer', 
            'Index Name': 'Index-Name',
            'Bucket.Scope.Collection': 'Bucket.Bereich.Sammlung',
            'Scanned:': 'Gescannt:',
            'Executions:': 'Ausführungen:',
            'Indexes Used:': 'Verwendete Indizes:',
            'Queries Executed:': 'Ausgeführte Abfragen:',
            # Statistics labels
            'Total Indexes:': 'Gesamte Indizes:',
            'Buckets:': 'Buckets:',
            'Scopes:': 'Bereiche:',
            'Collections:': 'Sammlungen:',
            'Primary Indexes:': 'Primäre Indizes:',
            'Used/Total Indexes:': 'Verwendete/Gesamte Indizes:',
            'Without/With Replica:': 'Ohne/Mit Replikat:',
            'Never Scanned Indexes:': 'Nie Gescannte Indizes:',
            'Primary Only': 'Nur Primäre',
            'Used Only': 'Nur Verwendete', 
            'No Replicas Only': 'Nur Ohne Replikate',
            'Never Scanned Only': 'Nur Nie Gescannte',
            # Dropdown options
            '(ALL)': '(ALLE)',
            'Name': 'Name',
            'Bucket': 'Bucket',
            'Last Scanned': 'Zuletzt Gescannt',
            'Sort By': 'Sortieren Nach',
        },
        'es': {
            '1 Week': '1 Semana',
            '1 Day': '1 Día',
            '1 Hour': '1 Hora', 
            'Clear All': 'Limpiar Todo',
            'Original': 'Original',
            'Linear': 'Lineal',
            'Logarithmic': 'Logarítmico',
            'Reset Zoom': 'Restablecer Zoom',
            'Use Charts Current X-Axis Date Range': 'Usar Rango de Fechas del Eje X de los Gráficos Actuales',
            'Primary index scans in production can cause full bucket scans leading to severe performance issues': 'Los escaneos de índices primarios en producción pueden causar escaneos completos de buckets llevando a problemas de rendimiento severos',
            'Learn More': 'Aprender Más',
            'Note: #primary count shows total operations, not unique queries': 'Nota: el conteo #primary muestra operaciones totales, no consultas únicas',
            'Drag box to zoom area': 'Arrastrar caja para ampliar área',
            'By Optimizer': 'Por Optimizador',
            'Query Duration Distribution': 'Distribución de Duración de Consultas',
            'Exclude System Queries': 'Excluir Consultas del Sistema',
            # Placeholders  
            'Search usernames...': 'Buscar usuarios...',
            'Search indexes...': 'Buscar índices...',
            'Filter SQL++ Statement Contains': 'Filtrar Declaración SQL++ Contiene',
            # Table headers
            'Count': 'Conteo',
            'User': 'Usuario',
            'Index Name': 'Nombre de Índice',
            'Bucket.Scope.Collection': 'Bucket.Ámbito.Colección',
            'Scanned:': 'Escaneado:',
            'Executions:': 'Ejecuciones:',
            'Indexes Used:': 'Índices Utilizados:',
            'Queries Executed:': 'Consultas Ejecutadas:',
            # Statistics labels
            'Total Indexes:': 'Total de Índices:',
            'Buckets:': 'Buckets:',
            'Scopes:': 'Ámbitos:',
            'Collections:': 'Colecciones:',
            'Primary Indexes:': 'Índices Primarios:',
            'Used/Total Indexes:': 'Índices Usados/Total:',
            'Without/With Replica:': 'Sin/Con Réplica:',
            'Never Scanned Indexes:': 'Índices Nunca Escaneados:',
            'Primary Only': 'Solo Primarios',
            'Used Only': 'Solo Usados',
            'No Replicas Only': 'Solo Sin Réplicas', 
            'Never Scanned Only': 'Solo Nunca Escaneados',
            # Dropdown options
            '(ALL)': '(TODOS)',
            'Name': 'Nombre',
            'Bucket': 'Bucket',
            'Last Scanned': 'Último Escaneo',
            'Sort By': 'Ordenar Por',
        },
        'pt': {
            '1 Week': '1 Semana',
            '1 Day': '1 Dia',
            '1 Hour': '1 Hora',
            'Clear All': 'Limpar Tudo',
            'Original': 'Original',
            'Linear': 'Linear',
            'Logarithmic': 'Logarítmico', 
            'Reset Zoom': 'Redefinir Zoom',
            'Use Charts Current X-Axis Date Range': 'Usar Intervalo de Datas do Eixo X dos Gráficos Atuais',
            'Primary index scans in production can cause full bucket scans leading to severe performance issues': 'Verificações de índice primário em produção podem causar verificações completas de bucket levando a problemas graves de desempenho',
            'Learn More': 'Saiba Mais',
            'Note: #primary count shows total operations, not unique queries': 'Nota: a contagem #primary mostra operações totais, não consultas únicas',
            'Drag box to zoom area': 'Arraste caixa para ampliar área',
            'By Optimizer': 'Por Otimizador',
            'Query Duration Distribution': 'Distribuição de Duração de Consultas',
            'Exclude System Queries': 'Excluir Consultas do Sistema',
            # Placeholders
            'Search usernames...': 'Buscar usuários...',
            'Search indexes...': 'Buscar índices...',
            'Filter SQL++ Statement Contains': 'Filtrar Declaração SQL++ Contém',
            # Table headers
            'Count': 'Contagem',
            'User': 'Usuário',
            'Index Name': 'Nome do Índice',
            'Bucket.Scope.Collection': 'Bucket.Escopo.Coleção',
            'Scanned:': 'Verificado:',
            'Executions:': 'Execuções:',
            'Indexes Used:': 'Índices Utilizados:',
            'Queries Executed:': 'Consultas Executadas:',
            # Statistics labels
            'Total Indexes:': 'Total de Índices:',
            'Buckets:': 'Buckets:',
            'Scopes:': 'Escopos:',
            'Collections:': 'Coleções:',
            'Primary Indexes:': 'Índices Primários:',
            'Used/Total Indexes:': 'Índices Usados/Total:',
            'Without/With Replica:': 'Sem/Com Réplica:',
            'Never Scanned Indexes:': 'Índices Nunca Verificados:',
            'Primary Only': 'Apenas Primários',
            'Used Only': 'Apenas Usados',
            'No Replicas Only': 'Apenas Sem Réplicas',
            'Never Scanned Only': 'Apenas Nunca Verificados',
            # Dropdown options
            '(ALL)': '(TODOS)',
            'Name': 'Nome',
            'Bucket': 'Bucket',
            'Last Scanned': 'Última Verificação',
            'Sort By': 'Ordenar Por',
        }
    }
    
    files = {
        'de': 'de/index.html',
        'es': 'es/index.html', 
        'pt': 'pt/index.html'
    }
    
    total_translations = 0
    
    for lang_code, file_path in files.items():
        print(f"\n🌍 Processing additional translations for {lang_code}")
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lang_translations = languages[lang_code]
        
        for english_text, translated_text in lang_translations.items():
            # Try multiple replacement patterns
            patterns = [
                f'>{english_text}<',
                f'>{english_text}</button>',
                f'>{english_text}</option>',
                f'placeholder="{english_text}"',
                f'title="{english_text}"',
                f'>{english_text}</span>',
                f'>{english_text}</label>',
            ]
            
            replacements = [
                f'>{translated_text}<',
                f'>{translated_text}</button>',
                f'>{translated_text}</option>',
                f'placeholder="{translated_text}"',
                f'title="{translated_text}"',
                f'>{translated_text}</span>',
                f'>{translated_text}</label>',
            ]
            
            for pattern, replacement in zip(patterns, replacements):
                if pattern.replace('>', '').replace('<', '').replace('placeholder="', '').replace('"', '').replace('title="', '').replace('</button>', '').replace('</option>', '').replace('</span>', '').replace('</label>', '') in content:
                    old_content = content
                    content = content.replace(pattern, replacement)
                    if content != old_content:
                        total_translations += 1
                        print(f"  ✅ {english_text} → {translated_text}")
                        break
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print(f"\n🎯 Applied {total_translations} additional translations")
    
if __name__ == '__main__':
    apply_remaining_translations()
