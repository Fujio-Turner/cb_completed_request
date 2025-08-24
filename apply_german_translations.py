#!/usr/bin/env python3
"""
Apply German translations to index.html file systematically
"""

import re
import json

# Load translations
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/settings/translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

# Read the German file
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/de/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Apply translations from the JSON file
for english, translation_dict in translations['ui_strings'].items():
    if 'de' in translation_dict:
        german = translation_dict['de']
        # Replace exact matches
        content = content.replace(english, german)

# Apply JavaScript variable translations
for var_name, translation_dict in translations.get('javascript_variables', {}).items():
    if 'de' in translation_dict:
        german = translation_dict['de']
        if var_name == 'scanCounts_yes':
            content = re.sub(r'"Yes":', f'"{german}":', content)
        elif var_name == 'scanCounts_no':
            content = re.sub(r'"No":', f'"{german}":', content)

# Critical new features that need translation
new_features = {
    "Scan Consistency": "Scan-Konsistenz",
}

for english, german in new_features.items():
    content = content.replace(english, german)

# Write back the translated content
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/de/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("German translations applied successfully")
