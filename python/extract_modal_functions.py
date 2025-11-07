#!/usr/bin/env python3
"""
Extract modal and UI toggle functions from main-legacy.js to modals.js
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
    # Modal and toggle functions
    modal_functions = [
        'buildEnhancedPlanModal',
        'toggleStatement',
        'toggleAnalysisStatement',
        'toggleCollectionDataset',
        'showAllCollections',
        'hideAllCollections',
        'toggleCategory',
        'showFilterReminder',
        'hideFilterReminder',
        'toggleInputSection',
        'toggleSampleQueries',
        'toggleSampleStatement',
        'toggleTimeoutQueriesTable',
        'toggleQueryText',
        'toggleUseKeys',
        'toggleSectionsVisibility',
    ]
    
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    header = """// ============================================================
// MODALS.JS - Modal Dialogs and UI Toggles Module
// ============================================================
// This module handles modal dialogs, tooltips, and UI toggles.
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    statementStore,
    getOperators
} from './data-layer.js';
import { 
    escapeHtml,
    ClipboardUtils
} from './ui-helpers.js';

// ============================================================
// MODAL AND TOGGLE FUNCTIONS
// ============================================================

"""
    
    extracted = [header]
    
    print("📖 Extracting modal/toggle functions...\n")
    
    for func_name in modal_functions:
        func_text = extract_function(content, func_name)
        if func_text:
            extracted.append(f"\n// ============================================================\n")
            extracted.append(f"// {func_name}\n")
            extracted.append(f"// ============================================================\n\n")
            extracted.append(func_text)
            extracted.append("\n")
    
    exports = f"""
// ============================================================
// EXPORTS
// ============================================================

export {{
    {',\n    '.join(modal_functions)}
}};

// Expose globally
{chr(10).join(f'window.{name} = {name};' for name in modal_functions)}

console.log('✅ modals.js module loaded');
"""
    
    extracted.append(exports)
    
    with open('liquid_snake/assets/js/modals.js', 'w', encoding='utf-8') as f:
        f.write(''.join(extracted))
    
    print(f"\n✅ Extraction complete!")
    print(f"📄 Extracted {len(modal_functions)} modal/toggle functions")
    
    with open('liquid_snake/assets/js/modals.js', 'r', encoding='utf-8') as f:
        line_count = len(f.readlines())
    print(f"📏 modals.js now has {line_count} lines")

if __name__ == '__main__':
    main()
