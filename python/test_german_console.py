#!/usr/bin/env python3
"""
Test German Console Output

This script checks what console messages will appear in German 
to verify they're properly translated.
"""

import re

def check_german_console():
    """Check German console output patterns"""
    
    print("🔍 Checking German Console Output")
    print("=" * 50)
    
    try:
        with open('de/index.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find console.log patterns
        console_patterns = [
            r'console\.log\([^;]+\);',
            r'console\.log\(`[^`]+`\);',
            r'console\.log\(\s*TEXT_CONSTANTS\.[^;]+\);'
        ]
        
        german_messages = []
        
        for pattern in console_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                message = match.group(0)
                # Skip technical/debugging console.logs
                if any(skip in message.lower() for skip in ['error', 'warn', 'debug', 'trace']):
                    continue
                german_messages.append(message)
        
        print(f"📊 Found {len(german_messages)} console.log messages")
        
        # Show key messages that should be translated
        key_messages = [msg for msg in german_messages if any(
            keyword in msg for keyword in ['INITIALIZING', 'Version', 'Features', 'ANALYZER_INITIALIZED', 'TIP_ABOUT']
        )]
        
        if key_messages:
            print(f"\n🎯 Key German console messages:")
            for i, msg in enumerate(key_messages[:5], 1):
                clean_msg = msg.replace('console.log(', '').replace(');', '').strip()
                print(f"  {i}. {clean_msg[:80]}...")
        
        # Check for English words in German console messages
        english_words = ['Initializing', 'Features', 'Global', 'Enhanced', 'Query Analyzer']
        english_found = []
        
        for msg in german_messages:
            for word in english_words:
                if word in msg:
                    english_found.append(f"{word} in: {msg[:60]}...")
        
        if english_found:
            print(f"\n⚠️ English words found in German console messages:")
            for issue in english_found[:5]:
                print(f"  • {issue}")
        else:
            print(f"\n✅ No English words found in German console messages!")
        
        return len(english_found) == 0
        
    except Exception as e:
        print(f"❌ Error checking German console: {e}")
        return False

def main():
    """Main function"""
    success = check_german_console()
    
    if success:
        print(f"\n🎉 German console output is properly translated!")
    else:
        print(f"\n⚠️ German console output needs more translation work")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
