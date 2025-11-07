#!/usr/bin/env python3
"""
Remove duplicate functions from main-legacy.js that are now in modules
Creates main-legacy-cleaned.js with duplicates removed
"""

import re
import os

def get_exported_functions(module_file):
    """Extract function names from a module file"""
    functions = []
    
    if not os.path.exists(module_file):
        return functions
    
    with open(module_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find function declarations
    func_pattern = r'^\s*function\s+(\w+)\s*\('
    for match in re.finditer(func_pattern, content, re.MULTILINE):
        functions.append(match.group(1))
    
    # Find exports
    export_pattern = r'window\.(\w+)\s*='
    for match in re.finditer(export_pattern, content):
        functions.append(match.group(1))
    
    return list(set(functions))

def remove_function(lines, function_name):
    """Remove a function from lines array"""
    pattern = rf'^\s*function {re.escape(function_name)}\s*\('
    
    start_idx = None
    for i, line in enumerate(lines):
        if re.match(pattern, line):
            start_idx = i
            break
    
    if start_idx is None:
        return lines, False
    
    # Track braces to find function end
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
        return lines, False
    
    # Remove the function
    new_lines = lines[:start_idx] + lines[end_idx + 1:]
    return new_lines, True

def main():
    modules = [
        'liquid_snake/assets/js/base.js',
        'liquid_snake/assets/js/data-layer.js',
        'liquid_snake/assets/js/ui-helpers.js',
        'liquid_snake/assets/js/charts.js',
        'liquid_snake/assets/js/tables.js',
        'liquid_snake/assets/js/flow-diagram.js',
        'liquid_snake/assets/js/insights.js',
        'liquid_snake/assets/js/modals.js',
        'liquid_snake/assets/js/parsers.js',
        'liquid_snake/assets/js/report.js',
        'liquid_snake/assets/js/utils.js',
    ]
    
    print("🔍 Collecting functions from modules...\n")
    
    # Collect all module functions
    all_module_functions = set()
    for module in modules:
        funcs = get_exported_functions(module)
        all_module_functions.update(funcs)
    
    print(f"📊 Found {len(all_module_functions)} functions in modules")
    
    # Read main-legacy.js
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    original_count = len(lines)
    print(f"📄 Original main-legacy.js: {original_count} lines\n")
    
    # Remove duplicates
    removed_count = 0
    removed_functions = []
    
    print("🗑️ Removing duplicate functions...\n")
    
    for func_name in sorted(all_module_functions):
        new_lines, removed = remove_function(lines, func_name)
        if removed:
            removed_count += 1
            removed_functions.append(func_name)
            lines = new_lines
            print(f"   ✓ Removed {func_name} ({original_count - len(lines)} total lines removed)")
    
    # Write cleaned version
    with open('liquid_snake/assets/js/main-legacy-cleaned.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    final_count = len(lines)
    
    print(f"\n{'='*60}")
    print(f"✅ Cleanup complete!")
    print(f"{'='*60}")
    print(f"📉 Original size:  {original_count:,} lines")
    print(f"📉 Cleaned size:   {final_count:,} lines")
    print(f"🗑️  Lines removed:  {original_count - final_count:,} lines ({((original_count - final_count) / original_count * 100):.1f}%)")
    print(f"🗑️  Functions removed: {removed_count}")
    print(f"\n📁 Created: liquid_snake/assets/js/main-legacy-cleaned.js")
    print(f"\n⚠️  NEXT STEPS:")
    print(f"   1. Test with main-legacy-cleaned.js")
    print(f"   2. If working, replace main-legacy.js")
    print(f"   3. Continue extracting remaining functions")

if __name__ == '__main__':
    main()
