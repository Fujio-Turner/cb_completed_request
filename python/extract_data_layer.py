#!/usr/bin/env python3
"""
Extract data layer from main.js into data-layer.js
This extracts:
- TEXT_CONSTANTS
- Logger utilities
- Caches
- Stores  
- Parsing functions
"""

import re

def extract_data_layer(main_js_path):
    """Extract data layer code from main.js"""
    
    with open(main_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data_layer_parts = []
    
    # Extract TEXT_CONSTANTS (lines 1-199 approximately)
    # Find from start "const TEXT_CONSTANTS" to the closing of window.TEXT_CONSTANTS assignment
    text_const_match = re.search(
        r'(// Global text constants.*?const TEXT_CONSTANTS = \{.*?\};.*?if \(window\.TEXT_CONSTANTS\).*?\}\s*\})',
        content,
        re.DOTALL
    )
    
    if text_const_match:
        data_layer_parts.append("// ===== TEXT_CONSTANTS =====")
        data_layer_parts.append(text_const_match.group(1))
        print(f"✓ Extracted TEXT_CONSTANTS ({len(text_const_match.group(1))} chars)")
    
    # Extract Logger (getLogLevel, shouldLog, Logger object)
    logger_pattern = r'(function getLogLevel\(\).*?const Logger = \{.*?\};)'
    logger_match = re.search(logger_pattern, content, re.DOTALL)
    
    if logger_match:
        data_layer_parts.append("\n\n// ===== Logger =====")
        data_layer_parts.append(logger_match.group(1))
        print(f"✓ Extracted Logger ({len(logger_match.group(1))} chars)")
    
    # Extract Caches
    cache_pattern = r'(const CACHE_LIMITS = \{.*?const timestampRoundingCache = new Map\(\);)'
    cache_match = re.search(cache_pattern, content, re.DOTALL)
    
    if cache_match:
        data_layer_parts.append("\n\n// ===== Caches =====")
        data_layer_parts.append(cache_match.group(1))
        print(f"✓ Extracted Caches ({len(cache_match.group(1))} chars)")
    
    # Extract clearCaches function
    clear_cache_pattern = r'(function clearCaches\(\) \{.*?\n        \})'
    clear_cache_match = re.search(clear_cache_pattern, content, re.DOTALL)
    
    if clear_cache_match:
        data_layer_parts.append("\n\n" + clear_cache_match.group(1))
        print(f"✓ Extracted clearCaches function")
    
    # Extract Global Stores
    stores_pattern = r'(// Global variable to store original unfiltered data.*?let analysisStatementStore = \{\};)'
    stores_match = re.search(stores_pattern, content, re.DOTALL)
    
    if stores_match:
        data_layer_parts.append("\n\n// ===== Global Data Stores =====")
        data_layer_parts.append(stores_match.group(1))
        print(f"✓ Extracted Global Stores")
    
    # Extract parseTime function
    parse_time_pattern = r'(function parseTime\(timeStr\) \{.*?\n        \})'
    parse_time_match = re.search(parse_time_pattern, content, re.DOTALL)
    
    if parse_time_match:
        data_layer_parts.append("\n\n// ===== Helper: parseTime =====")
        data_layer_parts.append(parse_time_match.group(1))
        print(f"✓ Extracted parseTime function")
    
    # Extract normalizeStatement
    normalize_pattern = r'(function normalizeStatement\(statement\) \{.*?\n        \})'
    normalize_match = re.search(normalize_pattern, content, re.DOTALL)
    
    if normalize_match:
        data_layer_parts.append("\n\n// ===== Helper: normalizeStatement =====")
        data_layer_parts.append(normalize_match.group(1))
        print(f"✓ Extracted normalizeStatement function")
    
    # Extract parseJSON (main parser)
    parse_json_pattern = r'(function parseJSON\(\) \{.*?\n        \}(?=\s*\n\s*function parseIndexJSON))'
    parse_json_match = re.search(parse_json_pattern, content, re.DOTALL)
    
    if parse_json_match:
        data_layer_parts.append("\n\n// ===== Main Parser: parseJSON =====")
        data_layer_parts.append(parse_json_match.group(1))
        print(f"✓ Extracted parseJSON function ({len(parse_json_match.group(1))} chars)")
    
    # Extract parseIndexJSON
    parse_index_pattern = r'(function parseIndexJSON\(\) \{.*?\n        \}(?=\s*\n\s*function))'
    parse_index_match = re.search(parse_index_pattern, content, re.DOTALL)
    
    if parse_index_match:
        data_layer_parts.append("\n\n// ===== Parser: parseIndexJSON =====")
        data_layer_parts.append(parse_index_match.group(1))
        print(f"✓ Extracted parseIndexJSON function")
    
    # Extract parseSchemaInference
    parse_schema_pattern = r'(function parseSchemaInference\(\) \{.*?\n        \})'
    parse_schema_match = re.search(parse_schema_pattern, content, re.DOTALL)
    
    if parse_schema_match:
        data_layer_parts.append("\n\n// ===== Parser: parseSchemaInference =====")
        data_layer_parts.append(parse_schema_match.group(1))
        print(f"✓ Extracted parseSchemaInference function")
    
    # Add exports at the end
    exports = """

// ===== ES6 Module Exports =====
export {
    TEXT_CONSTANTS,
    Logger,
    parseTimeCache,
    normalizeStatementCache,
    operatorsCache,
    planStatsCache,
    timeUnitCache,
    timestampRoundingCache,
    clearCaches,
    originalRequests,
    statementStore,
    analysisStatementStore,
    parseTime,
    normalizeStatement,
    parseJSON,
    parseIndexJSON,
    parseSchemaInference
};

// Event bus for data ready notifications
export const dataBus = new EventTarget();
"""
    
    data_layer_parts.append(exports)
    
    return '\n'.join(data_layer_parts)


if __name__ == '__main__':
    import sys
    
    main_js = 'liquid_snake/assets/js/main.js'
    output_file = 'liquid_snake/assets/js/data-layer.js'
    
    print(f"📖 Reading {main_js}...")
    data_layer_code = extract_data_layer(main_js)
    
    print(f"\n💾 Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(data_layer_code)
    
    print(f"\n✅ Data layer extracted successfully!")
    print(f"📊 Output size: {len(data_layer_code)} characters")
