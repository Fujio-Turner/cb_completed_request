#!/usr/bin/env python3
"""
Translation Validation Script
Checks for remaining English text in localized HTML files
"""

import re
import sys
from pathlib import Path

def validate_language_file(file_path, language_code):
    """Validate a single language file for untranslated content"""
    
    language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
    language_name = language_names.get(language_code, language_code)
    
    if not file_path.exists():
        print(f"❌ {file_path} not found")
        return False
    
    print(f"\n🔍 Validating {language_name} ({file_path})...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # Check language attribute
    if f'<html lang="{language_code}">' not in content:
        issues.append("Language attribute not set correctly")
    
    # Check for common English UI patterns that should be translated
    english_patterns = [
        (r'>Dashboard<', 'Tab name'),
        (r'>Timeline<', 'Tab name'),
        (r'>Analysis<', 'Tab name'), 
        (r'>Every Query<', 'Tab name'),
        (r'>Indexes<', 'Tab name'),
        (r'>Copy<', 'Button text'),
        (r'>Show<', 'Button text'),
        (r'>Hide<', 'Button text'),
        (r'>Reset<', 'Button text'),
        (r'placeholder="Search', 'Placeholder text'),
        (r'textContent.*=.*".*Copy.*"', 'JavaScript text'),
        (r'textContent.*=.*".*Reset.*"', 'JavaScript text'),
        (r'text:.*".*Timeline.*"', 'Chart title'),
        (r'label:.*".*Query.*"', 'Chart label')
    ]
    
    for pattern, description in english_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            issues.append(f"{description}: Found {len(matches)} untranslated instances")
    
    # Check for hardcoded "Yes"/"No" that should be translated
    yes_no_matches = re.findall(r'"Yes".*"No"', content)
    if yes_no_matches and language_code == 'de':
        # Should be "Ja" and "Nein" in German
        if '"Ja"' not in content or '"Nein"' not in content:
            issues.append("Yes/No not translated to Ja/Nein")
    
    if yes_no_matches and language_code == 'es':
        # Should be "Sí" and "No" in Spanish
        if '"Sí"' not in content:
            issues.append("Yes not translated to Sí")
    
    if yes_no_matches and language_code == 'pt':
        # Should be "Sim" and "Não" in Portuguese
        if '"Sim"' not in content or '"Não"' not in content:
            issues.append("Yes/No not translated to Sim/Não")
    
    # Report results
    if issues:
        print(f"⚠️ Found {len(issues)} potential issues:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("✅ Validation passed - no obvious translation issues")
        return True

def main():
    """Main validation function"""
    
    print("🔍 Starting translation validation...")
    
    languages = {
        'de': Path('de/index.html'),
        'es': Path('es/index.html'), 
        'pt': Path('pt/index.html')
    }
    
    results = {}
    
    for lang_code, file_path in languages.items():
        results[lang_code] = validate_language_file(file_path, lang_code)
    
    # Summary
    print("\n📊 Validation Summary:")
    language_names = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese'}
    
    for lang_code, passed in results.items():
        status = "✅ Passed" if passed else "⚠️ Needs Review"
        print(f"  {language_names[lang_code]}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All translations validated successfully!")
        return 0
    else:
        print("\n⚠️ Some files need manual review for complete translation.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
