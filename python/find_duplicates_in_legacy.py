#!/usr/bin/env python3
"""
Find functions in main-legacy.js that are now in modular files
These are duplicates that can be removed
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
    
    print("🔍 Finding duplicates in main-legacy.js...\n")
    
    # Collect all functions from modules
    all_module_functions = set()
    
    for module in modules:
        funcs = get_exported_functions(module)
        module_name = os.path.basename(module)
        print(f"📦 {module_name}: {len(funcs)} functions")
        all_module_functions.update(funcs)
    
    print(f"\n📊 Total unique functions in modules: {len(all_module_functions)}")
    
    # Find functions in main-legacy.js
    with open('liquid_snake/assets/js/main-legacy.js', 'r', encoding='utf-8') as f:
        legacy_content = f.read()
    
    legacy_functions = []
    func_pattern = r'^\s*function\s+(\w+)\s*\('
    for match in re.finditer(func_pattern, legacy_content, re.MULTILINE):
        legacy_functions.append(match.group(1))
    
    print(f"📄 Functions in main-legacy.js: {len(legacy_functions)}")
    
    # Find duplicates
    duplicates = [f for f in legacy_functions if f in all_module_functions]
    
    print(f"\n🔴 DUPLICATES FOUND: {len(duplicates)}")
    print(f"\n⚠️ These functions exist in both modules AND main-legacy.js:")
    print(f"   They can be safely removed from main-legacy.js\n")
    
    # Group by likely module
    for dup in sorted(set(duplicates))[:50]:  # Show first 50
        print(f"   - {dup}")
    
    if len(set(duplicates)) > 50:
        print(f"   ... and {len(set(duplicates)) - 50} more")
    
    print(f"\n✅ Safe to remove {len(set(duplicates))} duplicate functions from main-legacy.js")
    
    # Calculate what's NOT duplicated (unique to legacy)
    unique_legacy = [f for f in legacy_functions if f not in all_module_functions]
    print(f"\n🟡 Functions ONLY in main-legacy.js: {len(set(unique_legacy))}")
    print(f"   These still need to be extracted or are event handlers\n")
    
    print("\n📋 Sample unique functions (not yet modularized):")
    for func in sorted(set(unique_legacy))[:20]:
        print(f"   - {func}")

if __name__ == '__main__':
    main()
