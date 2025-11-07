#!/usr/bin/env python3
"""
Extract chart generation functions from main-legacy.js to charts.js
Appends to existing charts.js file
"""

import re

def extract_function(content, function_name, start_line_hint=None):
    """Extract a complete function by name"""
    # Find function declaration
    pattern = rf'^\s*function {re.escape(function_name)}\s*\('
    
    lines = content.split('\n')
    start_idx = None
    
    # Find start
    for i, line in enumerate(lines):
        if re.match(pattern, line):
            start_idx = i
            break
    
    if start_idx is None:
        print(f"❌ Function not found: {function_name}")
        return None
    
    # Find end by tracking braces
    brace_count = 0
    in_function = False
    end_idx = None
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        
        # Count braces
        brace_count += line.count('{') - line.count('}')
        
        if '{' in line:
            in_function = True
        
        # Function ends when braces balance and we're in the function
        if in_function and brace_count == 0:
            end_idx = i
            break
    
    if end_idx is None:
        print(f"⚠️ Could not find end of function: {function_name}")
        return None
    
    # Extract function text
    function_text = '\n'.join(lines[start_idx:end_idx + 1])
    print(f"✓ Extracted {function_name} ({end_idx - start_idx + 1} lines)")
    
    return function_text

def main():
    # Chart functions to extract (in order from main-legacy.js)
    chart_functions = [
        # Dashboard charts
        'generateDashboardCharts',
        'generatePrimaryScanChart',
        'generateStateChart',
        'generateStatementTypeChart',
        'generateScanConsistencyChart',
        'generateElapsedTimeChart',
        'generateQueryPatternChart',
        'generateECharts3DBar',
        
        # Timeline and analysis charts
        'generateEnhancedOperationsChart',
        'generateFilterChart',
        'generateTimelineChart',
        'createQueryTypesChart',
        'createDurationBucketsChart',
        'createMemoryChart',
        'createCollectionQueriesChart',
        'createECharts3DCollectionTimeline',
        'createECharts3DQueryTypes',
        'createParseDurationChart',
        'createPlanDurationChart',
        'createResultCountChart',
        'createResultSizeChart',
        'createECharts3DAvgDocSize',
        'createCpuTimeChart',
        'createIndexScanThroughputChart',
        'createDocFetchThroughputChart',
        'createECharts3DServiceTime',
        'createDocumentSizeBubbleChart',
        'createExecVsKernelChart',
        'createExecVsServChart',
        'createServiceTimeAnalysisLineChart',
        'createExecVsElapsedChart',
    ]
    
    # Read main-legacy.js
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Read existing charts.js
    with open('liquid_snake/assets/js/charts.js', 'r', encoding='utf-8') as f:
        existing = f.read()
    
    extracted = []
    
    print("📖 Extracting chart generation functions...\n")
    
    for func_name in chart_functions:
        func_text = extract_function(content, func_name)
        if func_text:
            extracted.append(f"\n// ============================================================\n")
            extracted.append(f"// CHART: {func_name}\n")
            extracted.append(f"// ============================================================\n\n")
            extracted.append(func_text)
            extracted.append("\n")
    
    # Append to charts.js
    new_content = existing + '\n'.join(extracted)
    
    # Add exports at the end
    exports = f"""
// ============================================================
// EXPORTS - Chart Generation Functions
// ============================================================

export {{
    {',\n    '.join(chart_functions)}
}};

// Expose globally for backward compatibility
{chr(10).join(f'window.{name} = {name};' for name in chart_functions)}
"""
    
    new_content += exports
    
    with open('liquid_snake/assets/js/charts.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✅ Extraction complete!")
    print(f"📊 Extracted {len([e for e in extracted if e])} functions")
    print(f"📄 Total chart functions: {len(chart_functions)}")
    
    # Count lines
    with open('liquid_snake/assets/js/charts.js', 'r', encoding='utf-8') as f:
        line_count = len(f.readlines())
    print(f"📏 charts.js now has {line_count} lines")

if __name__ == '__main__':
    main()
