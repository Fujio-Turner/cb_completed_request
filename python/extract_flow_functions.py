#!/usr/bin/env python3
"""
Extract flow diagram functions from main-legacy.js to flow-diagram.js
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
    # Flow diagram functions
    flow_functions = [
        'buildIndexQueryFlow',
        'updateFlowDiagram',
    ]
    
    # Read main-legacy.js
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create flow-diagram.js header
    header = """// ============================================================
// FLOW-DIAGRAM.JS - Flow Visualization Module
// ============================================================
// This module handles Index/Query flow diagram generation.
// 
// Dependencies:
// - base.js (Logger, TEXT_CONSTANTS)
// - data-layer.js (data access)
// - ui-helpers.js (formatting)
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Logger, TEXT_CONSTANTS, isDevMode } from './base.js';
import { 
    originalRequests,
    statementStore,
    parseTime,
    normalizeStatement,
    getOperators,
    deriveStatementType
} from './data-layer.js';
import { 
    formatNumber,
    escapeHtml
} from './ui-helpers.js';

// ============================================================
// FLOW DIAGRAM FUNCTIONS
// ============================================================

"""
    
    extracted = [header]
    
    print("📖 Extracting flow diagram functions...\n")
    
    for func_name in flow_functions:
        func_text = extract_function(content, func_name)
        if func_text:
            extracted.append(f"\n// ============================================================\n")
            extracted.append(f"// FLOW: {func_name}\n")
            extracted.append(f"// ============================================================\n\n")
            extracted.append(func_text)
            extracted.append("\n")
    
    # Add exports
    exports = f"""
// ============================================================
// EXPORTS
// ============================================================

export {{
    {',\n    '.join(flow_functions)}
}};

// Expose globally for backward compatibility
{chr(10).join(f'window.{name} = {name};' for name in flow_functions)}

console.log('✅ flow-diagram.js module loaded');
"""
    
    extracted.append(exports)
    
    # Write to flow-diagram.js
    with open('liquid_snake/assets/js/flow-diagram.js', 'w', encoding='utf-8') as f:
        f.write(''.join(extracted))
    
    print(f"\n✅ Extraction complete!")
    print(f"📄 Extracted {len(flow_functions)} flow functions")
    
    # Count lines
    with open('liquid_snake/assets/js/flow-diagram.js', 'r', encoding='utf-8') as f:
        line_count = len(f.readlines())
    print(f"📏 flow-diagram.js now has {line_count} lines")

if __name__ == '__main__':
    main()
