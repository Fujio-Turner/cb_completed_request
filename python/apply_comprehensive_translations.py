#!/usr/bin/env python3
"""
Apply Comprehensive Translations

This script applies ALL translations from settings/translations.json
while protecting JavaScript syntax and technical elements.

Usage: python apply_comprehensive_translations.py [language_code]
Example: python apply_comprehensive_translations.py es
"""

import sys
import json
import re
import os

def load_translations():
    """Load all translations from JSON file"""
    try:
        with open('settings/translations.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Error: settings/translations.json not found")
        return None

def is_protected_context(content, start_pos, end_pos):
    """Check if text position is in a protected JavaScript/CSS context"""
    
    # Get surrounding context
    before = content[:start_pos]
    after = content[end_pos:]
    
    # Get the word being translated
    translated_word = content[start_pos:end_pos]
    
    # Get wider context for analysis
    context_before = before[-100:] if len(before) > 100 else before
    context_after = after[:100] if len(after) > 100 else after
    full_context = context_before + translated_word + context_after
    
    # CRITICAL: Protect JavaScript function names and method calls
    # Check if this word is part of a JavaScript function name
    if re.search(r'(function\s+\w*' + re.escape(translated_word) + r'\w*\s*\()', full_context):
        return True
    
    # Protect JavaScript method calls (.method or object.method)
    if re.search(r'\.\s*' + re.escape(translated_word) + r'[A-Z]', full_context):
        return True
        
    # Protect camelCase function names that contain the word
    if re.search(r'\w+' + re.escape(translated_word) + r'[A-Z]\w*\s*\(', full_context):
        return True
        
    # Protect JavaScript keywords in code context
    js_contexts = [
        r'\s+for\s*\(',                    # for loops
        r'\.forEach\s*\(',                 # forEach method calls
        r'\.for[A-Z]\w*\s*\(',            # any for* method calls
        r'function\s+\w*for\w*\s*\(',     # functions containing "for"
        r'function\s+\w*Timeline\w*\s*\(',# functions containing "Timeline"
        r'function\s+\w*Error\w*\s*\(',   # functions containing "Error"
        r'clear\w*Timeline\w*\s*\(',      # clear*Timeline* functions
        r'generate\w*Timeline\w*\s*\(',   # generate*Timeline* functions
    ]
    
    for js_pattern in js_contexts:
        if re.search(js_pattern, full_context, re.IGNORECASE):
            return True
    
    # CRITICAL: Protect JavaScript method names and keywords
    js_keywords = ['for', 'forEach', 'if', 'else', 'function', 'const', 'let', 'var']
    if translated_word in js_keywords:
        # Protect JavaScript for loops
        if translated_word == 'for' and re.search(r'\s*\(\s*(const|let|var)\s+', context_after):
            return True
        
        # Protect JavaScript for-in/for-of loops  
        if translated_word == 'for' and re.search(r'\s*\(\s*\w+\s+(in|of)\s+', context_after):
            return True
    
    # Protected patterns - DO NOT translate these contexts
    protected_patterns = [
        r'function\s+\w+\s*\(',         # Function definitions
        r'const\s+\w+\s*=',             # Variable declarations  
        r'let\s+\w+\s*=',               # Variable declarations
        r'\.getElementById\s*\(',        # DOM selectors
        r'\.querySelector\s*\(',        # CSS selectors
        r'id\s*=\s*["\']',              # HTML id attributes
        r'class\s*=\s*["\']',           # HTML class attributes
        r'onclick\s*=\s*["\']',         # Event handlers
        r'console\.log\s*\(',           # Debug statements (keep English)
        r'//.*',                        # Comments
        r'/\*.*?\*/',                   # Block comments
    ]
    
    # Check if we're inside any protected pattern
    for pattern in protected_patterns:
        if re.search(pattern, full_context):
            return True
    
    return False

def apply_comprehensive_translations(file_path, language_code, translations):
    """Apply all translations from JSON file safely

    IMPORTANT: Only translate HTML (outside <script>...</script> blocks).
    JavaScript must remain intact, except for explicitly managed TEXT_CONSTANTS (handled elsewhere).
    """
    
    print(f"🔄 Applying comprehensive {language_code.upper()} translations to {file_path}")
    print("=" * 60)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = 0
        skipped_protected = 0
        skipped_in_scripts = 0
        
        # Precompute protected ranges to fully avoid modifying JavaScript:
        # 1) <script>...</script> blocks
        # 2) Inline JS event handler attribute values (onclick=, oninput=, ...)
        # 3) href="javascript:..." attribute values
        protected_ranges = []
        # 1) script blocks
        for m in re.finditer(r"<script[\s\S]*?>[\s\S]*?</script>", content, flags=re.IGNORECASE):
            protected_ranges.append((m.start(), m.end()))
        # 2) inline event handler attributes
        event_attrs = [
            'onclick','ondblclick','onmousedown','onmouseup','onmouseover','onmouseout','onmousemove',
            'onkeydown','onkeypress','onkeyup','onload','onunload','onfocus','onblur','onchange',
            'oninput','onsubmit','onreset','onselect','onwheel','oncontextmenu','ontouchstart',
            'ontouchend','ontouchmove','onpointerdown','onpointerup','onpointermove'
        ]
        # Match attr values with either single or double quotes
        event_pattern = r"(?i)\s(?:" + '|'.join(event_attrs) + r")\s*=\s*(?:\"[\s\S]*?\"|'[\s\S]*?')"
        for m in re.finditer(event_pattern, content):
            # Find the start of the quoted value
            attr_text = m.group(0)
            # Determine quote char and compute inner range
            quote_char = '"' if '"' in attr_text else "'"
            # Compute absolute positions of the value within the file content
            value_match = re.search(quote_char + r"([\s\S]*?)" + quote_char, attr_text)
            if value_match:
                value_start = m.start() + value_match.start(1) + 1  # +1 to move past opening quote
                value_end = m.start() + value_match.end(1) + 1      # end index exclusive
                protected_ranges.append((value_start-1, value_end+1))  # include quotes conservatively
        # 3) href="javascript:..."
        for m in re.finditer(r"(?i)\shref\s*=\s*(\"javascript:[^\"]*\"|'javascript:[^']*')", content):
            protected_ranges.append((m.start(1), m.end(1)))
        
        def in_protected_ranges(pos, end_pos):
            for s, e in protected_ranges:
                if pos >= s and end_pos <= e:
                    return True
            return False
        
        # Get UI strings for this language
        ui_strings = translations.get("ui_strings", {})
        
        # Sort by length (longest first) to avoid partial replacements
        sorted_translations = sorted(ui_strings.items(), key=lambda x: len(x[0]), reverse=True)
        
        for english_text, translations_dict in sorted_translations:
            if language_code not in translations_dict:
                continue
                
            translated_text = translations_dict[language_code]
            
            # Skip if English and translated are the same
            if english_text == translated_text:
                continue
            
            # Find all occurrences
            start = 0
            while True:
                pos = content.find(english_text, start)
                if pos == -1:
                    break
                
                end_pos = pos + len(english_text)
                
                # Skip any occurrence inside protected ranges (<script>, inline JS event handlers, href="javascript:")
                if in_protected_ranges(pos, end_pos):
                    skipped_in_scripts += 1
                    start = end_pos
                    continue
                
                # Check if this occurrence is in a protected context
                if is_protected_context(content, pos, end_pos):
                    skipped_protected += 1
                    start = end_pos
                    continue
                
                # Apply translation (HTML-only)
                content = content[:pos] + translated_text + content[end_pos:]
                changes_made += 1
                print(f"  ✅ {english_text[:40]}... → {translated_text[:40]}...")
                
                # Update start position for next search
                start = pos + len(translated_text)

        # Explicitly ensure tab headers are localized in anchors
        tabs = {
            "#dashboard": "Dashboard",
            "#timeline": "Timeline",
            "#analysis": "Query Groups",
            "#every-query": "Every Query",
            "#index-query-flow": "Index/Query Flow",
            "#indexes": "Indexes",
        }
        for href, en_label in tabs.items():
            tr_map = ui_strings.get(en_label, {})
            if language_code in tr_map:
                label = tr_map[language_code]
                # Replace inner text of anchor with this href using a function to avoid backreference issues
                pattern = re.compile(rf"(<a[^>]+href=\"{re.escape(href)}\"[^>]*>)(.*?)(</a>)", flags=re.IGNORECASE | re.DOTALL)
                content = pattern.sub(lambda m: m.group(1) + label + m.group(3), content)

        # Write back if changes were made (or if anchors were updated implicitly)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
            print(f"\n📊 Translation Summary:")
            print(f"   ✅ Translations applied: {changes_made}")
            print(f"   🛡️ Protected (skipped): {skipped_protected}")
            print(f"   🧪 Skipped inside <script>: {skipped_in_scripts}")
            print(f"   📁 File: {file_path}")
            
            return True
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return False

def main():
    """Main function"""
    
    if len(sys.argv) != 2:
        print("Usage: python apply_comprehensive_translations.py [language_code]")
        print("Example: python apply_comprehensive_translations.py es")
        sys.exit(1)
    
    language_code = sys.argv[1].lower()
    file_path = f"{language_code}/index.html"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        print(f"💡 Make sure to copy en/index.html to {file_path} first")
        sys.exit(1)
    
    # Load translations
    translations = load_translations()
    if not translations:
        sys.exit(1)
    
    # Apply translations
    success = apply_comprehensive_translations(file_path, language_code, translations)
    
    if success:
        print(f"\n🎉 Comprehensive translation complete for {language_code.upper()}!")
        print(f"🔍 Next steps:")
        print(f"   1. Run: python3 python/validate_js_syntax.py")
        print(f"   2. Run: python3 python/validate_html_attributes.py") 
        print(f"   3. Test {file_path} in browser")
    else:
        print(f"\n⚠️ No changes applied to {file_path}")

if __name__ == "__main__":
    main()
