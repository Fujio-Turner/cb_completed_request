#!/usr/bin/env python3
"""
Analyze and optimize CSS in HTML file - minify and deduplicate
"""

import re
import sys
from collections import defaultdict

def extract_css_from_html(content):
    """Extract all CSS blocks from HTML"""
    css_blocks = []
    pattern = r'<style[^>]*>(.*?)</style>'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for i, match in enumerate(matches):
        css_content = match.group(1)
        css_blocks.append({
            'index': i,
            'start': match.start(),
            'end': match.end(),
            'content': css_content
        })
    
    return css_blocks

def parse_css_rules(css_content):
    """Parse CSS content into rules"""
    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    rules = []
    # Find all CSS rules
    pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    matches = re.finditer(pattern, css_content)
    
    for match in matches:
        selectors = match.group(1).strip()
        declarations = match.group(2).strip()
        
        if selectors and declarations:
            # Split multiple selectors
            selector_list = [s.strip() for s in selectors.split(',')]
            rules.append({
                'selectors': selector_list,
                'declarations': declarations,
                'original': match.group(0)
            })
    
    return rules

def find_duplicate_rules(rules):
    """Find duplicate CSS rules"""
    duplicates = defaultdict(list)
    
    for i, rule in enumerate(rules):
        # Create a key from sorted declarations
        declarations = rule['declarations']
        # Normalize declarations for comparison
        normalized = re.sub(r'\s+', ' ', declarations).strip()
        key = ''.join(sorted(normalized.split(';')))
        
        duplicates[key].append({
            'index': i,
            'rule': rule
        })
    
    # Return only actual duplicates
    return {k: v for k, v in duplicates.items() if len(v) > 1}

def minify_css(css_content):
    """Minify CSS by removing whitespace and comments"""
    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Remove extra whitespace around braces and semicolons
    css_content = re.sub(r'\s*{\s*', '{', css_content)
    css_content = re.sub(r'\s*}\s*', '}', css_content)
    css_content = re.sub(r'\s*;\s*', ';', css_content)
    css_content = re.sub(r'\s*:\s*', ':', css_content)
    
    # Remove extra whitespace
    css_content = re.sub(r'\s+', ' ', css_content)
    css_content = re.sub(r'^\s+|\s+$', '', css_content)
    
    # Remove empty lines
    css_content = re.sub(r'\n\s*\n', '\n', css_content)
    
    return css_content

def combine_selectors(rules):
    """Combine rules with identical declarations"""
    declaration_groups = defaultdict(list)
    
    for rule in rules:
        declarations = rule['declarations']
        # Normalize declarations
        normalized = re.sub(r'\s+', ' ', declarations).strip()
        declaration_groups[normalized].extend(rule['selectors'])
    
    combined_rules = []
    for declarations, selectors in declaration_groups.items():
        # Remove duplicates and combine
        unique_selectors = list(dict.fromkeys(selectors))  # Preserve order, remove dupes
        combined_rules.append({
            'selectors': unique_selectors,
            'declarations': declarations
        })
    
    return combined_rules

def optimize_css_in_html(filename):
    """Optimize CSS in HTML file"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"🔍 Analyzing CSS in {filename}...")
    
    # Extract CSS blocks
    css_blocks = extract_css_from_html(content)
    print(f"Found {len(css_blocks)} CSS blocks")
    
    all_rules = []
    original_size = 0
    
    for i, block in enumerate(css_blocks):
        print(f"\n📋 CSS Block {i+1}:")
        print(f"   Size: {len(block['content'])} characters")
        original_size += len(block['content'])
        
        rules = parse_css_rules(block['content'])
        print(f"   Rules: {len(rules)}")
        all_rules.extend(rules)
    
    print(f"\n📊 Total CSS stats:")
    print(f"   Original size: {original_size:,} characters")
    print(f"   Total rules: {len(all_rules)}")
    
    # Find duplicates
    duplicates = find_duplicate_rules(all_rules)
    if duplicates:
        print(f"   Duplicate rule groups: {len(duplicates)}")
        for key, group in list(duplicates.items())[:3]:  # Show first 3
            selectors = [rule['rule']['selectors'][0] for rule in group]
            print(f"      Duplicate: {', '.join(selectors[:3])}")
    
    # Combine and optimize all CSS
    combined_rules = combine_selectors(all_rules)
    print(f"   After combining: {len(combined_rules)} rules")
    
    # Generate optimized CSS
    optimized_css = ""
    for rule in combined_rules:
        selector_str = ','.join(rule['selectors'])
        optimized_css += f"{selector_str}{{{rule['declarations']}}}"
    
    # Final minification
    optimized_css = minify_css(optimized_css)
    
    print(f"   Optimized size: {len(optimized_css):,} characters")
    print(f"   Size reduction: {((original_size - len(optimized_css)) / original_size * 100):.1f}%")
    
    return optimized_css, css_blocks

def replace_css_in_html(content, optimized_css, css_blocks):
    """Replace CSS blocks in HTML with optimized version"""
    # Remove all existing CSS blocks (from last to first to preserve positions)
    for block in reversed(css_blocks):
        content = content[:block['start']] + content[block['end']:]
    
    # Find insertion point (after last external stylesheet)
    insert_pos = content.find('<script src="https://code.jquery.com/ui/1.14.0/jquery-ui.min.js')
    if insert_pos == -1:
        # Fallback - insert before </head>
        insert_pos = content.find('</head>')
    
    # Insert optimized CSS
    optimized_block = f'\n    <style>\n{optimized_css}\n    </style>\n    '
    content = content[:insert_pos] + optimized_block + content[insert_pos:]
    
    return content

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 optimize_css.py /path/to/index.html")
        print("\nThis script minifies and deduplicates CSS in HTML file")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    optimized_css, css_blocks = optimize_css_in_html(filename)
    
    print(f"\n🔧 Applying optimizations...")
    optimized_content = replace_css_in_html(content, optimized_css, css_blocks)
    
    # Write optimized file
    backup_filename = filename + '.css_backup'
    with open(backup_filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"📁 Backup saved: {backup_filename}")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(optimized_content)
    
    print(f"✅ CSS optimization complete!")
    print(f"🎉 File size reduced by {((len(content) - len(optimized_content)) / len(content) * 100):.1f}%")
    print(f"\n💡 Next steps:")
    print(f"1. Test the file in browser to ensure UI still works")
    print(f"2. Check that all styles are applied correctly")  
    print(f"3. If issues, restore from {backup_filename}")
