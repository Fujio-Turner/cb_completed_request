#!/usr/bin/env python3
"""
Extract table-related functions from main-legacy.js to tables.js
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
    # Table functions to extract
    table_functions = [
        # Main table generators
        'generateTable',                    # Every Query table (line 3326)
        'generateAnalysisTable',            # Query Groups table (line 3941)
        'generateUserCountTable',           # User count table (line 15777)
        'generateIndexCountTable',          # Index count table (line 15978)
        
        # Table helpers
        'filterEveryQueryData',             # Filter Every Query data (line 2858)
        'populateEveryQueryTable',          # Populate Every Query table (line 3429)
        'updateSampleQueriesTable',         # Update sample queries (line 19285)
        'updateTimeoutQueriesTable',        # Update timeout queries (line 19828)
    ]
    
    # Read main-legacy.js
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create tables.js header
    header = """// ============================================================
// TABLES.JS - Table Rendering Module
// ============================================================
// This module handles all table generation and rendering.
// 
// Dependencies:
// - base.js (Logger, TEXT_CONSTANTS)
// - data-layer.js (data access)
// - ui-helpers.js (formatting, clipboard)
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    originalRequests,
    statementStore,
    analysisStatementStore,
    parseTime,
    normalizeStatement,
    deriveStatementType,
    stripEmTags,
    isPreparedExecution,
    getPreparedSample
} from './data-layer.js';
import { 
    formatNumber, 
    formatBytes, 
    formatDuration,
    escapeHtml,
    ClipboardUtils,
    copyToClipboard
} from './ui-helpers.js';

// ============================================================
// TABLE GENERATION FUNCTIONS
// ============================================================

"""
    
    extracted = [header]
    
    print("📖 Extracting table functions...\n")
    
    for func_name in table_functions:
        func_text = extract_function(content, func_name)
        if func_text:
            extracted.append(f"\n// ============================================================\n")
            extracted.append(f"// TABLE: {func_name}\n")
            extracted.append(f"// ============================================================\n\n")
            extracted.append(func_text)
            extracted.append("\n")
    
    # Add exports
    exports = f"""
// ============================================================
// EXPORTS
// ============================================================

export {{
    {',\n    '.join(table_functions)}
}};

// Expose globally for backward compatibility
{chr(10).join(f'window.{name} = {name};' for name in table_functions)}

console.log('✅ tables.js module loaded');
"""
    
    extracted.append(exports)
    
    # Write to tables.js
    with open('liquid_snake/assets/js/tables.js', 'w', encoding='utf-8') as f:
        f.write(''.join(extracted))
    
    print(f"\n✅ Extraction complete!")
    print(f"📄 Extracted {len(table_functions)} table functions")
    
    # Count lines
    with open('liquid_snake/assets/js/tables.js', 'r', encoding='utf-8') as f:
        line_count = len(f.readlines())
    print(f"📏 tables.js now has {line_count} lines")

if __name__ == '__main__':
    main()
