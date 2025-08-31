#!/usr/bin/env python3
"""
Analyze JavaScript code for dead/unused functions
"""

import re
import sys
from collections import defaultdict

def extract_function_definitions(content):
    """Extract all function definitions"""
    functions = []
    
    # Pattern for function declarations
    patterns = [
        r'function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(',  # function name()
        r'const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',  # const name = function
        r'let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',    # let name = function
        r'var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function',    # var name = function
        r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*function',          # object method
        r'async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(', # async function
    ]
    
    lines = content.split('\n')
    for line_num, line in enumerate(lines, 1):
        for pattern in patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                func_name = match.group(1)
                functions.append({
                    'name': func_name,
                    'line': line_num,
                    'definition': line.strip()
                })
    
    return functions

def find_function_calls(content, function_names):
    """Find all function calls and references"""
    calls = defaultdict(list)
    
    lines = content.split('\n')
    for line_num, line in enumerate(lines, 1):
        for func_name in function_names:
            # Look for function calls
            patterns = [
                rf'{func_name}\s*\(',           # Direct call: func()
                rf'onclick="[^"]*{func_name}',  # HTML onclick
                rf'addEventListener.*{func_name}', # Event listeners
                rf'setTimeout.*{func_name}',    # setTimeout
                rf'setInterval.*{func_name}',   # setInterval
                rf'requestAnimationFrame.*{func_name}', # requestAnimationFrame
                rf'\.{func_name}\s*\(',        # Method call: obj.func()
                rf'window\.{func_name}',       # Window property
                rf'["\']' + func_name + r'["\']', # String reference
            ]
            
            for pattern in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    calls[func_name].append({
                        'line': line_num,
                        'context': line.strip(),
                        'type': 'call'
                    })
                    break
    
    return calls

def find_jquery_handlers(content):
    """Find jQuery event handlers that might reference functions"""
    jquery_refs = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        # Look for jQuery event bindings
        patterns = [
            r'\$\([^)]+\)\.on\(',     # $(element).on(
            r'\$\([^)]+\)\.click\(',  # $(element).click(
            r'\$\([^)]+\)\.change\(', # $(element).change(
            r'\.addEventListener\(',   # addEventListener
        ]
        
        for pattern in patterns:
            if re.search(pattern, line):
                jquery_refs.append({
                    'line': line_num,
                    'content': line.strip()
                })
    
    return jquery_refs

def analyze_dead_code(filename):
    """Analyze file for dead code"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"🔍 Analyzing JavaScript functions in {filename}...")
    
    # Extract all function definitions
    functions = extract_function_definitions(content)
    function_names = [f['name'] for f in functions]
    
    print(f"📋 Found {len(functions)} function definitions")
    
    # Find function calls
    calls = find_function_calls(content, function_names)
    
    # Find jQuery event handlers for context
    jquery_refs = find_jquery_handlers(content)
    print(f"📋 Found {len(jquery_refs)} jQuery/event handler references")
    
    # Analyze usage
    unused_functions = []
    used_functions = []
    
    for func in functions:
        func_name = func['name']
        if func_name in calls and len(calls[func_name]) > 0:
            used_functions.append({
                'function': func,
                'call_count': len(calls[func_name]),
                'calls': calls[func_name]
            })
        else:
            unused_functions.append(func)
    
    print(f"\n📊 Function usage analysis:")
    print(f"   Used functions: {len(used_functions)}")
    print(f"   Potentially unused: {len(unused_functions)}")
    
    # Show unused functions
    if unused_functions:
        print(f"\n🚨 Potentially unused functions:")
        print("-" * 50)
        for func in unused_functions[:10]:  # Show first 10
            print(f"Line {func['line']:4d}: {func['name']:25s} - {func['definition'][:60]}...")
        
        if len(unused_functions) > 10:
            print(f"         ... and {len(unused_functions) - 10} more")
    
    # Show functions with single usage (might be candidates for inlining)
    single_use = [f for f in used_functions if f['call_count'] == 1]
    if single_use:
        print(f"\n💡 Functions with single usage (inline candidates):")
        print("-" * 50)
        for func in single_use[:5]:
            print(f"Line {func['function']['line']:4d}: {func['function']['name']:25s} - called {func['call_count']} time")
    
    # Check for helper functions that might be safe to remove
    helper_patterns = [
        r'helper', r'utility', r'util', r'temp', r'test', r'debug', r'old', r'unused', r'deprecated'
    ]
    
    potential_helpers = []
    for func in unused_functions:
        func_name_lower = func['name'].lower()
        if any(pattern in func_name_lower for pattern in helper_patterns):
            potential_helpers.append(func)
    
    if potential_helpers:
        print(f"\n🔧 Potential helper/debug functions to remove:")
        print("-" * 50)
        for func in potential_helpers:
            print(f"Line {func['line']:4d}: {func['name']:25s}")
    
    return {
        'unused_functions': unused_functions,
        'used_functions': used_functions,
        'single_use_functions': single_use,
        'potential_helpers': potential_helpers,
        'jquery_refs': jquery_refs
    }

def generate_cleanup_script(analysis, filename):
    """Generate a script to remove unused functions"""
    
    if not analysis['unused_functions']:
        print("✅ No unused functions found - code is already clean!")
        return
    
    script_name = filename.replace('.html', '_cleanup.py')
    
    with open(script_name, 'w', encoding='utf-8') as f:
        f.write('#!/usr/bin/env python3\n')
        f.write('"""\nGenerated script to remove unused functions\n"""\n\n')
        f.write('import re\nimport sys\n\n')
        
        f.write('def remove_function(content, func_name, line_num):\n')
        f.write('    """Remove a function definition"""\n')
        f.write('    lines = content.split("\\n")\n')
        f.write('    \n')
        f.write('    # Find function start and end\n')
        f.write('    start_line = line_num - 1  # Convert to 0-based\n')
        f.write('    if start_line >= len(lines):\n')
        f.write('        return content\n')
        f.write('    \n')
        f.write('    # Simple heuristic: find matching braces\n')
        f.write('    brace_count = 0\n')
        f.write('    end_line = start_line\n')
        f.write('    \n')
        f.write('    for i in range(start_line, len(lines)):\n')
        f.write('        line = lines[i]\n')
        f.write('        brace_count += line.count("{") - line.count("}")\n')
        f.write('        if i > start_line and brace_count <= 0:\n')
        f.write('            end_line = i\n')
        f.write('            break\n')
        f.write('    \n')
        f.write('    # Remove the function\n')
        f.write('    del lines[start_line:end_line + 1]\n')
        f.write('    return "\\n".join(lines)\n\n')
        
        f.write('# Unused functions to remove:\n')
        for func in analysis['unused_functions']:
            f.write(f'# Line {func["line"]}: {func["name"]} - {func["definition"][:50]}...\n')
        
        f.write('\n# MANUAL REVIEW REQUIRED - Only remove if you\'re sure they\'re unused!\n')
    
    print(f"📜 Generated cleanup script: {script_name}")
    print("⚠️  MANUAL REVIEW REQUIRED before running cleanup")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 analyze_dead_code.py /path/to/index.html")
        sys.exit(1)
    
    filename = sys.argv[1]
    analysis = analyze_dead_code(filename)
    
    print(f"\n💡 Summary:")
    print(f"   Total functions: {len(analysis['used_functions']) + len(analysis['unused_functions'])}")
    print(f"   Used: {len(analysis['used_functions'])}")  
    print(f"   Unused: {len(analysis['unused_functions'])}")
    print(f"   Single-use: {len(analysis['single_use_functions'])}")
    
    if analysis['unused_functions']:
        generate_cleanup_script(analysis, filename)
        print(f"\n🔧 Next steps:")
        print(f"1. Review the unused functions list carefully")
        print(f"2. Check if any are called indirectly (eval, string refs, etc.)")
        print(f"3. Test functionality before removing functions")
        print(f"4. Remove functions manually or use generated script")
    else:
        print(f"\n✅ Code appears to be clean - no obvious unused functions!")
