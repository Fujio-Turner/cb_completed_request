#!/usr/bin/env python3
"""
Convert hardcoded strings to TEXT_CONSTANTS pattern
"""

import re
import sys

def convert_file(filename):
    """Convert hardcoded strings in a file to use TEXT_CONSTANTS"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define replacements (be careful not to break logic)
    replacements = [
        # User-facing messages  
        (r'showToast\("Copied to clipboard!"\)', 'showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD)'),
        (r'showToast\("Failed to copy to clipboard",\s*"error"\)', 'showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, "error")'),
        (r'button\.textContent\s*=\s*"Copied!"', 'button.textContent = TEXT_CONSTANTS.COPIED'),
        (r'button\.textContent\s*=\s*"Copy Stats"', 'button.textContent = TEXT_CONSTANTS.COPY_STATS'),
        (r'alert\("Statement not found"\)', 'alert(TEXT_CONSTANTS.STATEMENT_NOT_FOUND)'),
        (r'alert\("Failed to copy to clipboard"\)', 'alert(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD)'),
        
        # Template literals for buttons (be very careful with these)
        (r'>Copy</button>', f'>{{{TEXT_CONSTANTS.COPY}}}</button>'),
        (r'>Show More</button>', f'>{{{TEXT_CONSTANTS.SHOW_MORE}}}</button>'),
        (r'>Hide</button>', f'>{{{TEXT_CONSTANTS.HIDE}}}</button>'),
        
        # Flow diagram messages
        (r'flowDiagram\.textContent\s*=\s*"No execution plan available\."', 'flowDiagram.textContent = TEXT_CONSTANTS.NO_EXECUTION_PLAN'),
        (r'flowDiagram\.textContent\s*=\s*"No operators found in the execution plan\."', 'flowDiagram.textContent = TEXT_CONSTANTS.NO_OPERATORS_FOUND'),
        (r'flowDiagram\.innerHTML\s*=\s*"Select a query from the table to view the flow diagram\."', 'flowDiagram.innerHTML = TEXT_CONSTANTS.SELECT_QUERY_FLOW'),
    ]
    
    changes_made = 0
    for pattern, replacement in replacements:
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            changes_made += matches
            print(f"✅ Replaced {matches} occurrences of: {pattern[:50]}...")
    
    if changes_made > 0:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n🎉 Made {changes_made} replacements in {filename}")
    else:
        print(f"\n ℹ️  No changes needed in {filename}")
    
    return changes_made

def check_remaining_strings(filename):
    """Check for remaining hardcoded strings"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patterns to check
    patterns = [
        (r'showToast\s*\(\s*"[^"]*[A-Z][^"]*"', 'showToast calls with English'),
        (r'console\.log\s*\(\s*"[^"]*[A-Z][^"]*"', 'console.log with English'),
        (r'alert\s*\(\s*"[^"]*[A-Z][^"]*"', 'alert with English'),
        (r'\.textContent\s*=\s*"[^"]*[A-Z][^"]*"', 'textContent with English'),
        (r'>`[^`]*[A-Z][^`]*<', 'Template literals with English in HTML'),
    ]
    
    found = False
    for pattern, description in patterns:
        matches = re.findall(pattern, content)
        if matches:
            print(f"🔍 Found {len(matches)} {description}")
            for match in matches[:3]:  # Show first 3
                print(f"    {match[:60]}...")
            if len(matches) > 3:
                print(f"    ... and {len(matches) - 3} more")
            print()
            found = True
    
    if not found:
        print("✅ No obvious hardcoded English strings found!")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 convert_hardcoded_strings.py /path/to/index.html")
        print("\nThis script converts common hardcoded strings to TEXT_CONSTANTS pattern")
        print("⚠️  WARNING: Review changes carefully - may need manual adjustments")
        sys.exit(1)
    
    filename = sys.argv[1]
    print(f"🔧 Converting hardcoded strings in {filename}...")
    print("=" * 60)
    
    changes = convert_file(filename)
    
    print("\n" + "=" * 60)
    print("🔍 Checking for remaining hardcoded strings...")
    check_remaining_strings(filename)
    
    print("\n💡 Next steps:")
    print("1. Test the file in browser to ensure no JavaScript errors")
    print("2. Check TEXT_CONSTANTS usage: grep -c 'TEXT_CONSTANTS\\.' filename")  
    print("3. Add any new constants needed for remaining strings")
    print("4. Update LOCALIZATION_GUIDE.md with new constants")
