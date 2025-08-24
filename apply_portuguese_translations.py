#!/usr/bin/env python3
"""
Apply Portuguese translations to index.html file systematically
"""

import re
import json

# Load translations
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/settings/translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

# Update language attribute first
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/pt/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Change language attribute
content = content.replace('<html lang="en">', '<html lang="pt">')

# Apply translations from the JSON file
for english, translation_dict in translations['ui_strings'].items():
    if 'pt' in translation_dict:
        portuguese = translation_dict['pt']
        # Replace exact matches
        content = content.replace(english, portuguese)

# Apply JavaScript variable translations
for var_name, translation_dict in translations.get('javascript_variables', {}).items():
    if 'pt' in translation_dict:
        portuguese = translation_dict['pt']
        if var_name == 'scanCounts_yes':
            content = re.sub(r'"Yes":', f'"{portuguese}":', content)
        elif var_name == 'scanCounts_no':
            content = re.sub(r'"No":', f'"{portuguese}":', content)

# Critical new features that need translation
new_features = {
    "Scan Consistency": "Consistência de Verificação",
}

for english, portuguese in new_features.items():
    content = content.replace(english, portuguese)

# Write back the translated content
with open('/Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request/pt/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Portuguese translations applied successfully")
