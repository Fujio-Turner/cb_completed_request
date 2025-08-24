#!/usr/bin/env python3
"""
Apply Spanish translations to index.html file systematically
"""

import re
import json

# Load translations
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/settings/translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

# Update language attribute first
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/es/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Change language attribute
content = content.replace('<html lang="en">', '<html lang="es">')

# Apply translations from the JSON file
for english, translation_dict in translations['ui_strings'].items():
    if 'es' in translation_dict:
        spanish = translation_dict['es']
        # Replace exact matches
        content = content.replace(english, spanish)

# Apply JavaScript variable translations
for var_name, translation_dict in translations.get('javascript_variables', {}).items():
    if 'es' in translation_dict:
        spanish = translation_dict['es']
        if var_name == 'scanCounts_yes':
            content = re.sub(r'"Yes":', f'"{spanish}":', content)
        elif var_name == 'scanCounts_no':
            content = re.sub(r'"No":', f'"{spanish}":', content)

# Critical new features that need translation
new_features = {
    "Scan Consistency": "Consistencia de Escaneo",
}

for english, spanish in new_features.items():
    content = content.replace(english, spanish)

# Write back the translated content
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/es/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Spanish translations applied successfully")
