#!/usr/bin/env python3
"""
Analyze Translation Patterns

This script analyzes all the translation scripts to understand what
patterns need to be covered in a comprehensive LOCALIZATION_GUIDE.md
"""

import os
import glob
import json

def analyze_translation_scripts():
    """Analyze all translation scripts to extract patterns"""
    
    print("🔍 Analyzing Translation Scripts")
    print("=" * 50)
    
    # Get all Python translation scripts
    translation_scripts = [f for f in glob.glob("python/*translation*.py") if 'analyze' not in f]
    translation_scripts.extend([f for f in glob.glob("python/apply_*.py")])
    translation_scripts.extend([f for f in glob.glob("python/fix_*.py")])
    
    patterns_found = {
        'text_constants': set(),
        'html_content': set(), 
        'system_messages': set(),
        'ui_elements': set(),
        'protected_elements': set(),
        'problem_areas': set()
    }
    
    print(f"📊 Analyzing {len(translation_scripts)} translation scripts...")
    
    # Analyze each script
    for script_path in translation_scripts:
        script_name = os.path.basename(script_path)
        print(f"\n📄 {script_name}:")
        
        try:
            with open(script_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract patterns from each script type
            if 'missing_translations' in script_name:
                # TEXT_CONSTANTS patterns
                if 'ALL_CACHES_CLEARED' in content:
                    patterns_found['text_constants'].add("System notification messages")
                if 'FAILED_COPY_CLIPBOARD' in content:
                    patterns_found['text_constants'].add("Error messages") 
                if 'SHOW_SAMPLE_QUERIES' in content:
                    patterns_found['text_constants'].add("Button text constants")
                    
            elif 'html_translations' in script_name:
                # HTML content patterns
                if 'chart-title' in content:
                    patterns_found['html_content'].add("Chart headers and titles")
                if 'h3' in content:
                    patterns_found['html_content'].add("HTML header elements")
                    
            elif 'system_messages' in script_name:
                # System messages
                if 'INITIALIZING_ANALYZER' in content:
                    patterns_found['system_messages'].add("Application initialization messages")
                if 'console.log' in content:
                    patterns_found['system_messages'].add("Console output messages")
                    
            elif 'insights' in script_name:
                # Insights content
                if 'INSIGHTS IN DEVELOPMENT' in content:
                    patterns_found['ui_elements'].add("Insights tab content")
                if 'Performance' in content:
                    patterns_found['ui_elements'].add("Performance analysis descriptions")
                    
            elif 'chartjs' in script_name:
                # JavaScript API protection
                if '.data' in content or 'datasets' in content:
                    patterns_found['protected_elements'].add("Chart.js API properties")
                if 'context.dataset' in content:
                    patterns_found['protected_elements'].add("Chart.js context properties")
                    
            elif 'fix_' in script_name:
                # Problem areas
                if 'mixed_content' in script_name:
                    patterns_found['problem_areas'].add("Mixed English/translated content")
                if 'api_properties' in script_name:
                    patterns_found['problem_areas'].add("JavaScript API property translation")
                if 'features' in script_name:
                    patterns_found['problem_areas'].add("Features array translation")
                    
            print(f"  ✅ Analyzed - found patterns for translation coverage")
                    
        except Exception as e:
            print(f"  ❌ Error analyzing {script_path}: {e}")
    
    return patterns_found

def generate_localization_guide_content(patterns):
    """Generate comprehensive localization guide content"""
    
    guide_content = """
# COMPREHENSIVE LOCALIZATION FINDINGS

## 🎯 TRANSLATION CATEGORIES IDENTIFIED

### 1. ✅ TEXT_CONSTANTS (Safe to Translate)
"""
    
    if patterns['text_constants']:
        for pattern in sorted(patterns['text_constants']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
### 2. ✅ HTML CONTENT (Safe to Translate)
"""
    
    if patterns['html_content']:
        for pattern in sorted(patterns['html_content']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
### 3. ✅ SYSTEM MESSAGES (Safe to Translate)
"""
    
    if patterns['system_messages']:
        for pattern in sorted(patterns['system_messages']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
### 4. ✅ UI ELEMENTS (Safe to Translate)
"""
    
    if patterns['ui_elements']:
        for pattern in sorted(patterns['ui_elements']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
### 5. 🚨 PROTECTED ELEMENTS (NEVER TRANSLATE)
"""
    
    if patterns['protected_elements']:
        for pattern in sorted(patterns['protected_elements']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
### 6. ⚠️ PROBLEM AREAS (Caused Issues)
"""
    
    if patterns['problem_areas']:
        for pattern in sorted(patterns['problem_areas']):
            guide_content += f"- {pattern}\n"
    
    guide_content += """
## 🛡️ PROTECTION STRATEGY

### NEVER TRANSLATE:
- JavaScript API properties (.data, .dataset, .dataIndex, .options, .plugins)
- Chart.js configuration object properties
- DOM API method names (.forEach, .map, .filter, .getElementById)
- HTML attributes (id, class, aria-*, data-*, onclick)
- Function names and variable declarations
- CSS class names and selectors

### ALWAYS TRANSLATE:
- TEXT_CONSTANTS values (user-facing strings)
- HTML content between tags (<button>TEXT</button>)
- Chart titles and headers
- Instructions and help text
- Error messages and notifications
- Console.log user messages (but not debugging info)

## 🔧 RECOMMENDED APPROACH:
1. Start with clean en/index.html
2. Apply ONLY TEXT_CONSTANTS translations
3. Apply ONLY HTML content translations (between tags)
4. Validate JavaScript syntax after each step
5. Test functionality before proceeding
"""
    
    return guide_content

def main():
    """Main analysis function"""
    
    patterns = analyze_translation_scripts()
    guide_content = generate_localization_guide_content(patterns)
    
    # Save analysis results
    with open('logs/release/TRANSLATION_ANALYSIS_REPORT.md', 'w', encoding='utf-8') as f:
        f.write(guide_content)
    
    print(f"\n📊 Translation Analysis Summary:")
    print(f"   TEXT_CONSTANTS patterns: {len(patterns['text_constants'])}")
    print(f"   HTML content patterns: {len(patterns['html_content'])}")
    print(f"   System message patterns: {len(patterns['system_messages'])}")
    print(f"   UI element patterns: {len(patterns['ui_elements'])}")
    print(f"   Protected elements: {len(patterns['protected_elements'])}")
    print(f"   Problem areas identified: {len(patterns['problem_areas'])}")
    
    print(f"\n✅ Analysis complete!")
    print(f"   📋 Report saved to: logs/release/TRANSLATION_ANALYSIS_REPORT.md")
    print(f"   🎯 Use findings to update LOCALIZATION_GUIDE.md")

if __name__ == "__main__":
    main()
