#!/usr/bin/env python3
"""
Find Translatable English Text in Localized HTML Files

This script scans localized HTML files to find English text that should be translated.
"""

import re
import os

def find_translatable_text(file_path, language):
    """Find potentially translatable English text in a file"""
    
    print(f"\n🔍 Analyzing {file_path} for untranslated English text:")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Patterns to look for translatable text
        patterns = [
            # HTML content and attributes
            (r'<button[^>]*>([A-Z][^<]+)</button>', 'Button text'),
            (r'<h[1-6][^>]*>([A-Z][^<]+)</h[1-6]>', 'Header text'),
            (r'<label[^>]*>([A-Z][^<]+)</label>', 'Label text'),
            (r'<option[^>]*>([A-Z][^<]+)</option>', 'Option text'),
            (r'placeholder="([A-Z][^"]+)"', 'Placeholder text'),
            (r'title="([A-Z][^"]+)"', 'Title attribute'),
            (r'alt="([A-Z][^"]+)"', 'Alt text'),
            
            # JavaScript strings
            (r'showToast\("([A-Z][^"]+)"', 'Toast message'),
            (r'alert\("([A-Z][^"]+)"', 'Alert message'),
            (r'console\.log\("([A-Z][^"]+)"', 'Console message'),
            (r'"([A-Z][A-Za-z\s]{10,})"', 'Long quoted strings'),
            
            # TEXT_CONSTANTS values that might still be in English
            (r'[A-Z_]+:\s*"([A-Z][^"]+)"', 'TEXT_CONSTANTS values'),
            
            # Common English words in user interface
            (r'"(Show|Hide|Copy|Download|Export|Import|Reset|Clear|Cancel|OK|Submit|Save|Delete|Edit|Add|Remove|Search|Filter|Sort)"', 'UI action words'),
        ]
        
        found_items = []
        
        for pattern, description in patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                text = match.group(1) if len(match.groups()) > 0 else match.group(0)
                
                # Skip technical terms, URLs, and code-like strings
                if should_skip_text(text):
                    continue
                
                # Skip if it looks like it's already using TEXT_CONSTANTS
                if 'TEXT_CONSTANTS' in match.group(0):
                    continue
                
                found_items.append({
                    'text': text,
                    'context': match.group(0),
                    'type': description,
                    'line': content[:match.start()].count('\n') + 1
                })
        
        # Report findings
        if found_items:
            print(f"  📊 Found {len(found_items)} potentially translatable strings:")
            for item in found_items[:10]:  # Show first 10
                print(f"    • Line {item['line']}: \"{item['text']}\" ({item['type']})")
            if len(found_items) > 10:
                print(f"    ... and {len(found_items) - 10} more")
        else:
            print(f"  ✅ No obvious untranslated English text found!")
            
        return found_items
        
    except Exception as e:
        print(f"  ❌ Error analyzing {file_path}: {e}")
        return []

def should_skip_text(text):
    """Determine if text should be skipped (technical terms, etc.)"""
    
    # Skip short strings
    if len(text.strip()) < 3:
        return True
    
    # Skip URLs and paths
    if any(substring in text.lower() for substring in ['http', 'www', '.com', '.org', '//', 'file:', 'src=']):
        return True
    
    # Skip code-like strings
    if any(substring in text for substring in ['()', '{}', '[]', '=>', '===', '!==']):
        return True
    
    # Skip CSS and technical terms
    technical_terms = [
        'px', 'em', 'rem', 'rgb', 'rgba', 'var(', 'calc(',
        'innerHTML', 'getElementById', 'querySelector',
        'addEventListener', 'removeEventListener',
        'JSON', 'API', 'URL', 'HTTP', 'HTTPS', 'CSS', 'HTML', 'XML',
        'UTF-8', 'ISO', 'RFC', 'UTC', 'GMT',
        'charset', 'encoding', 'DOCTYPE', 'xmlns'
    ]
    
    if any(term in text for term in technical_terms):
        return True
    
    # Skip single words that are likely technical
    if len(text.split()) == 1 and (text.isupper() or text.lower() in ['id', 'class', 'src', 'href', 'type', 'value', 'name']):
        return True
    
    return False

def main():
    """Main function to find translatable text"""
    
    print("🌍 Finding Translatable English Text in Localized Files")
    print("=" * 65)
    
    # Files to analyze
    files_to_analyze = [
        ('de/index.html', 'German'),
        ('es/index.html', 'Spanish'),
        ('pt/index.html', 'Portuguese')
    ]
    
    all_findings = {}
    
    for file_path, language in files_to_analyze:
        if os.path.exists(file_path):
            findings = find_translatable_text(file_path, language)
            all_findings[file_path] = findings
        else:
            print(f"⚠️ File not found: {file_path}")
    
    # Summary
    total_items = sum(len(findings) for findings in all_findings.values())
    
    print(f"\n📊 Translation Analysis Summary:")
    print(f"   Total potentially translatable items found: {total_items}")
    
    if total_items > 0:
        print(f"\n💡 Recommendations:")
        print(f"   1. Review the items listed above")
        print(f"   2. Add appropriate translations to settings/translations.json")
        print(f"   3. Update apply_missing_translations.py to handle new patterns")
        print(f"   4. Re-run the translation script")
        print(f"\n⚠️ Note: Some items may be false positives (technical terms that should remain in English)")
    else:
        print(f"\n✅ Great! All major translatable text appears to be handled.")

if __name__ == "__main__":
    main()
