#!/usr/bin/env python3
"""
Quick dead code cleanup - remove obvious duplicates and unused functions
"""

import re
import sys

def remove_function_block(content, start_line, function_name):
    """Remove a function block starting from start_line"""
    lines = content.split('\n')
    
    if start_line > len(lines):
        return content
    
    # Find the function definition line
    func_line_idx = start_line - 1  # Convert to 0-based
    
    # Find the opening brace and track brace depth
    brace_count = 0
    end_line_idx = func_line_idx
    found_start = False
    
    for i in range(func_line_idx, len(lines)):
        line = lines[i]
        
        # Count braces
        open_braces = line.count('{')
        close_braces = line.count('}')
        brace_count += open_braces - close_braces
        
        if open_braces > 0:
            found_start = True
        
        # If we've found the start and braces are balanced, we're done
        if found_start and brace_count <= 0:
            end_line_idx = i
            break
    
    # Remove the function block
    del lines[func_line_idx:end_line_idx + 1]
    
    return '\n'.join(lines)

def cleanup_dead_code(filename):
    """Remove known duplicate and unused functions"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"🧹 Cleaning up dead code in {filename}...")
    
    # List of functions to remove (line numbers may shift after each removal)
    # Process in reverse order to maintain line numbers
    functions_to_remove = [
        # Remove older/duplicate functions (verify these are unused first)
        # {'name': 'processRequestData', 'line': 1318, 'reason': 'Simple validation version - unused'},
        # {'name': 'copyToClipboard', 'line': 1263, 'reason': 'Async version - unused'},  
        # {'name': 'copyToClipboard', 'line': 8951, 'reason': 'DOMPurify version - unused'},
        # {'name': 'showToast', 'line': 1239, 'reason': 'Simple version - check if used'},
    ]
    
    # First, let's just check what functions we have and their usage
    # Find all function definitions
    func_pattern = r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\('
    func_matches = []
    
    lines = content.split('\n')
    for line_num, line in enumerate(lines, 1):
        match = re.search(func_pattern, line)
        if match:
            func_name = match.group(1)
            func_matches.append({
                'name': func_name,
                'line': line_num,
                'definition': line.strip()
            })
    
    print(f"📋 Found {len(func_matches)} function definitions")
    
    # Find duplicates by name
    func_names = {}
    duplicates = []
    
    for func in func_matches:
        name = func['name']
        if name in func_names:
            duplicates.append({
                'name': name,
                'first': func_names[name],
                'duplicate': func
            })
        else:
            func_names[name] = func
    
    if duplicates:
        print(f"\n🚨 Found {len(duplicates)} duplicate function names:")
        print("-" * 60)
        for dup in duplicates:
            print(f"{dup['name']:25s} - Line {dup['first']['line']} and Line {dup['duplicate']['line']}")
            print(f"  First:     {dup['first']['definition'][:70]}...")
            print(f"  Duplicate: {dup['duplicate']['definition'][:70]}...")
            print()
    
    # Look for functions with obvious "dead code" indicators
    dead_indicators = ['test', 'debug', 'temp', 'old', 'unused', 'deprecated', 'backup']
    potential_dead = []
    
    for func in func_matches:
        name_lower = func['name'].lower()
        if any(indicator in name_lower for indicator in dead_indicators):
            potential_dead.append(func)
    
    if potential_dead:
        print(f"🔧 Functions with dead code indicators:")
        print("-" * 40)
        for func in potential_dead:
            print(f"Line {func['line']:4d}: {func['name']}")
    
    # Check for functions that might be safe to remove
    # Look for simple getter/setter functions or utilities
    simple_functions = []
    for func in func_matches:
        definition = func['definition']
        # Look for very short functions
        if (len(definition) < 100 and 
            ('return' in definition or 'get' in func['name'].lower() or 'set' in func['name'].lower())):
            
            # Count actual usage
            usage_count = len(re.findall(rf'\b{func["name"]}\s*\(', content))
            if usage_count <= 1:  # Only the definition itself
                simple_functions.append({
                    'function': func,
                    'usage_count': usage_count - 1  # Subtract the definition
                })
    
    if simple_functions:
        print(f"\n💡 Simple functions with low usage:")
        print("-" * 40)
        for item in simple_functions[:5]:
            func = item['function']
            print(f"Line {func['line']:4d}: {func['name']:20s} - used {item['usage_count']} times")
    
    return {
        'all_functions': func_matches,
        'duplicates': duplicates,
        'potential_dead': potential_dead,
        'simple_functions': simple_functions
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 quick_dead_code_cleanup.py /path/to/index.html")
        sys.exit(1)
    
    filename = sys.argv[1]
    analysis = cleanup_dead_code(filename)
    
    print(f"\n📊 Summary:")
    print(f"   Total functions: {len(analysis['all_functions'])}")
    print(f"   Duplicates: {len(analysis['duplicates'])}")
    print(f"   Potential dead: {len(analysis['potential_dead'])}")
    print(f"   Low usage: {len(analysis['simple_functions'])}")
    
    if analysis['duplicates']:
        print(f"\n⚠️  IMMEDIATE ACTION NEEDED:")
        print(f"   You have {len(analysis['duplicates'])} duplicate function names!")
        print(f"   This can cause unpredictable behavior.")
        print(f"   Review the duplicates above and remove unused versions.")
    
    print(f"\n💡 Next steps:")
    print(f"1. Review duplicate functions and remove unused versions")
    print(f"2. Check potential dead code functions")
    print(f"3. Consider inlining or removing low-usage functions")
    print(f"4. Test functionality after any removals")
