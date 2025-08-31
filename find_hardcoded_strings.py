#!/usr/bin/env python3
"""
Find hardcoded English strings in JavaScript that should use TEXT_CONSTANTS
"""

import re

def find_hardcoded_strings(filename):
    """Find hardcoded strings that should be converted to TEXT_CONSTANTS"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    patterns = [
        # Console messages
        (r'console\.log\s*\(\s*[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]', 'Console messages'),
        
        # showToast calls
        (r'showToast\s*\(\s*[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]', 'Toast messages'),
        
        # Template literals with English text
        (r'`([^`]*[A-Z][^`]*)`', 'Template literals'),
        
        # innerHTML/textContent assignments  
        (r'\.innerHTML\s*=\s*[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]', 'innerHTML assignments'),
        (r'\.textContent\s*=\s*[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]', 'textContent assignments'),
        
        # Button text in HTML templates
        (r'<button[^>]*>([^<]*[A-Z][^<]*)</button>', 'Button text'),
        
        # Alert/confirm messages
        (r'alert\s*\(\s*[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]', 'Alert messages'),
        
        # String concatenation with English
        (r'[\'"`]([^\'"`\n]*[A-Z][^\'"`\n]*)[\'"`]\s*\+', 'String concatenation'),
        
        # HTML strings with headers and emojis (like modal headers)
        (r"'<h[1-6][^>]*>([^<]*[A-Z🔑📋⚙️][^<]*)</h[1-6]>'", 'HTML header strings'),
        (r'"<h[1-6][^>]*>([^<]*[A-Z🔑📋⚙️][^<]*)</h[1-6]>"', 'HTML header strings'),
        
        # HTML content strings in concatenation
        (r"html\s*\+=\s*['\"]([^'\"]*[A-Z🔑📋⚙️][^'\"]*)['\"]", 'HTML concatenation'),
        
        # Plan/Index related text that often gets missed
        (r'[\'"`]([^\'"`]*(?:View|Detailed|Execution|Plan|Indexes|Keys|Used|Extract)[^\'"`]*)[\'"`]', 'Plan/Index UI text'),
    ]
    
    found_strings = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        for pattern, category in patterns:
            matches = re.finditer(pattern, line, re.IGNORECASE)
            for match in matches:
                text = match.group(1).strip()
                # Skip technical terms, CSS classes, etc.
                if not should_skip(text):
                    found_strings.append({
                        'line': line_num,
                        'category': category,
                        'text': text,
                        'full_line': line.strip()
                    })
    
    return found_strings

def should_skip(text):
    """Skip technical terms that shouldn't be translated"""
    skip_patterns = [
        r'^[a-z]+$',  # All lowercase (probably CSS/technical)
        r'^\d+$',     # Numbers only
        r'^[A-Z_]+$', # ALL_CAPS (probably constants)
        r'^#[a-f0-9]+$', # Colors
        r'^\w+\.\w+$', # Properties like object.property
        r'^[a-z]+[A-Z]', # camelCase (probably technical)
        r'JSON|HTML|CSS|JavaScript|Chart|API', # Technical terms
        r'N/A',       # Technical constant
    ]
    
    for pattern in skip_patterns:
        if re.match(pattern, text):
            return True
    
    return False

def suggest_constant_name(text):
    """Suggest a constant name for the text"""
    # Remove common words and make uppercase
    words = re.sub(r'[^\w\s]', '', text).split()
    words = [w.upper() for w in words if w.lower() not in ['the', 'a', 'an', 'of', 'for', 'to', 'in', 'on']]
    return '_'.join(words[:3])  # Max 3 words

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python3 find_hardcoded_strings.py /path/to/index.html")
        sys.exit(1)
    
    filename = sys.argv[1]
    strings = find_hardcoded_strings(filename)
    
    print(f"\n🔍 Found {len(strings)} hardcoded strings that could use TEXT_CONSTANTS:")
    print("=" * 80)
    
    by_category = {}
    for item in strings:
        category = item['category']
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(item)
    
    for category, items in by_category.items():
        print(f"\n📂 {category.upper()} ({len(items)} items):")
        print("-" * 50)
        
        for item in items[:5]:  # Show max 5 per category
            suggested_name = suggest_constant_name(item['text'])
            print(f"Line {item['line']:4d}: {suggested_name:20s} = \"{item['text']}\"")
            print(f"          {item['full_line'][:80]}...")
            print()
        
        if len(items) > 5:
            print(f"          ... and {len(items) - 5} more items")
            print()
    
    print("\n💡 SUGGESTED TEXT_CONSTANTS additions:")
    print("=" * 50)
    unique_texts = set(item['text'] for item in strings)
    for text in sorted(unique_texts)[:10]:  # Show top 10
        suggested_name = suggest_constant_name(text)
        print(f"        {suggested_name}: \"{text}\",")
    
    if len(unique_texts) > 10:
        print(f"        // ... and {len(unique_texts) - 10} more constants")
    
    print(f"\n✅ Run this to see current TEXT_CONSTANTS usage:")
    print(f"   grep -c 'TEXT_CONSTANTS\\.' {filename}")
