#!/usr/bin/env python3
"""
Extract parser functions from main-legacy.js to parsers.js
This is the BIG extraction - parseJSON alone is ~4000 lines
"""

import re

def extract_function(content, function_name):
    """Extract a complete function by name"""
    pattern = rf'^\s*function {re.escape(function_name)}\s*\('
    
    lines = content.split('\n')
    start_idx = None
    
    for i, line in enumerate(lines):
        if re.match(pattern, line):
            start_idx = i
            break
    
    if start_idx is None:
        print(f"❌ Function not found: {function_name}")
        return None
    
    brace_count = 0
    in_function = False
    end_idx = None
    
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{') - line.count('}')
        if '{' in line:
            in_function = True
        if in_function and brace_count == 0:
            end_idx = i
            break
    
    if end_idx is None:
        print(f"⚠️ Could not find end of function: {function_name}")
        return None
    
    function_text = '\n'.join(lines[start_idx:end_idx + 1])
    print(f"✓ Extracted {function_name} ({end_idx - start_idx + 1} lines)")
    
    return function_text

def main():
    # Parser functions and their helpers
    parser_functions = [
        'processRequestData',          # Helper for parseJSON
        'finishProcessing',            # Helper for parseJSON
        'parseJSON',                   # Main parser (~4000 lines)
        'parseIndexJSON',              # Index parser
        'parseSchemaInference',        # Schema parser
    ]
    
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    header = """// ============================================================
// PARSERS.JS - Data Parsing Module
// ============================================================
// This module handles parsing of JSON data from Couchbase.
// Contains the main parseJSON function and related parsers.
// 
// WARNING: parseJSON is heavily UI-coupled (~4000 lines)
// Future refactor: Split into pure parsing + UI orchestration
// ============================================================

import { Logger, TEXT_CONSTANTS, isDevMode } from './base.js';
import { 
    originalRequests,
    statementStore,
    analysisStatementStore,
    clearCaches,
    parseTime,
    normalizeStatement,
    deriveStatementType,
    detectTimezoneFromData,
    getOperators,
    stripEmTags,
    isPreparedExecution,
    getPreparedSample,
    makeElapsedFilterPredicate,
    dataBus,
    notifyDataReady
} from './data-layer.js';
import { 
    showToast,
    formatNumber,
    formatDuration
} from './ui-helpers.js';

// Import chart and table generators
// (parseJSON calls these after parsing)
const generateDashboardCharts = window.generateDashboardCharts;
const generateTable = window.generateTable;
const generateAnalysisTable = window.generateAnalysisTable;
const buildIndexQueryFlow = window.buildIndexQueryFlow;
const updateInsights = window.updateInsights;

// ============================================================
// PARSER FUNCTIONS
// ============================================================

"""
    
    extracted = [header]
    
    print("📖 Extracting parser functions (this will take a moment)...\n")
    
    for func_name in parser_functions:
        func_text = extract_function(content, func_name)
        if func_text:
            extracted.append(f"\n// ============================================================\n")
            extracted.append(f"// PARSER: {func_name}\n")
            extracted.append(f"// ============================================================\n\n")
            extracted.append(func_text)
            extracted.append("\n")
    
    exports = f"""
// ============================================================
// EXPORTS
// ============================================================

export {{
    {',\n    '.join(parser_functions)}
}};

// Expose globally for backward compatibility
{chr(10).join(f'window.{name} = {name};' for name in parser_functions)}

console.log('✅ parsers.js module loaded');
console.log('⚠️ Note: parseJSON is UI-coupled and will need refactoring in future');
"""
    
    extracted.append(exports)
    
    with open('liquid_snake/assets/js/parsers.js', 'w', encoding='utf-8') as f:
        f.write(''.join(extracted))
    
    print(f"\n✅ Extraction complete!")
    print(f"📄 Extracted {len(parser_functions)} parser functions")
    
    with open('liquid_snake/assets/js/parsers.js', 'r', encoding='utf-8') as f:
        line_count = len(f.readlines())
    print(f"📏 parsers.js now has {line_count} lines")
    print(f"\n⚠️ WARNING: parseJSON is ~4000 lines and heavily UI-coupled")
    print(f"   This extraction maintains current behavior but needs future refactoring")

if __name__ == '__main__':
    main()
