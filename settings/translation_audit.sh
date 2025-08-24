#!/bin/bash
# Translation Audit Script for Couchbase Query Analyzer
# Usage: ./translation_audit.sh [lang]
# Purpose: Detect remaining untranslated content and categorize it for improvement

if [ $# -eq 0 ]; then
    echo "Usage: $0 <language_code>"
    echo "Example: $0 de"
    echo "         $0 es"
    echo "         $0 pt"
    exit 1
fi

LANG="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${SCRIPT_DIR}/translation_audit_${LANG}_$(date +%Y%m%d_%H%M%S).log"
HTML_FILE="${PROJECT_ROOT}/${LANG}/index.html"

if [ ! -f "$HTML_FILE" ]; then
    echo "Error: $HTML_FILE not found"
    exit 1
fi

echo "🔍 Running translation audit for ${LANG^^}..."
echo "📄 Analyzing: ${LANG}/index.html"

# Initialize log file
echo "=== TRANSLATION AUDIT FOR ${LANG^^} ===" > "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "File: ${LANG}/index.html" >> "$OUTPUT_FILE"
echo "Total Lines: $(wc -l < "$HTML_FILE")" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to count matches and add category
audit_category() {
    local category="$1"
    local pattern="$2"
    local description="$3"
    
    echo "=== $category ===" >> "$OUTPUT_FILE"
    echo "Pattern: $description" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    local matches=$(grep -n "$pattern" "$HTML_FILE" 2>/dev/null || true)
    if [ -z "$matches" ]; then
        echo "✅ No untranslated content found in this category" >> "$OUTPUT_FILE"
    else
        echo "$matches" >> "$OUTPUT_FILE"
        local count=$(echo "$matches" | wc -l)
        echo "" >> "$OUTPUT_FILE"
        echo "📊 Found $count items needing attention" >> "$OUTPUT_FILE"
    fi
    echo "" >> "$OUTPUT_FILE"
}

# Function to display progress
show_progress() {
    local current=$1
    local total=$2
    local category="$3"
    echo "⏳ [$current/$total] Analyzing: $category"
}

# Run audit categories with progress indicators
total_categories=6
current=0

((current++))
show_progress $current $total_categories "HTML Labels & Buttons"
audit_category "1. HTML LABELS & BUTTONS" \
    ">Search.*:</label>\|>Sort.*:</label>\|>Filter.*:</label>\|<button[^>]*>[^<]*[A-Z][^<]*</button>\|placeholder=\"[^\"]*[A-Z][^\"]*\"\|title=\"[^\"]*[A-Z][^\"]*\"" \
    "Untranslated form labels, button text, placeholders, and tooltips"

((current++))
show_progress $current $total_categories "JavaScript String Literals"
audit_category "2. JAVASCRIPT STRING LITERALS" \
    "textContent.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|innerHTML.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|\.text.*=.*['\"][^'\"]*[A-Z][^'\"]*['\"]" \
    "Dynamic text assignments in JavaScript code"

((current++))
show_progress $current $total_categories "Chart Configurations"
audit_category "3. CHART CONFIGURATIONS" \
    "title.*:.*text.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|label.*:.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|labels.*:.*\[.*['\"][^'\"]*[A-Z]" \
    "Chart.js titles, labels, and legend text"

((current++))
show_progress $current $total_categories "Template Literals"
audit_category "4. TEMPLATE LITERALS & CONCATENATION" \
    "\`[^\`]*[A-Z][^\`]*\\\${[^}]*}[^\`]*\`\|\"[^\"]*[A-Z][^\"]*\"\s*\+.*\+\s*\"[^\"]*[A-Z][^\"]*\"" \
    "Template literals and string concatenation with English text"

((current++))
show_progress $current $total_categories "Console/Alert Messages"
audit_category "5. CONSOLE/ALERT MESSAGES" \
    "console\.log.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|alert.*['\"][^'\"]*[A-Z][^'\"]*['\"]\|confirm.*['\"][^'\"]*[A-Z]" \
    "Debug messages and user dialogs"

((current++))
show_progress $current $total_categories "User-Facing Comments"
audit_category "6. USER-FACING COMMENTS" \
    "<!--[^>]*[A-Z][^>]*-->" \
    "HTML comments that users might see in source view"

# Additional comprehensive checks
echo "" >> "$OUTPUT_FILE"
echo "=== ADDITIONAL CHECKS ===" >> "$OUTPUT_FILE"

# Check for common English words that might be missed
common_words="Loading\|Error\|Warning\|Success\|Failed\|Complete\|Processing\|Analyzing\|Generating\|Click\|Select\|Choose\|Enter\|Submit\|Cancel\|OK\|Yes\|No\|Total\|Count\|Items\|Results\|Records\|Page\|Next\|Previous\|First\|Last"
word_matches=$(grep -n "$common_words" "$HTML_FILE" 2>/dev/null || true)
if [ ! -z "$word_matches" ]; then
    echo "🔍 COMMON ENGLISH WORDS DETECTED:" >> "$OUTPUT_FILE"
    echo "$word_matches" >> "$OUTPUT_FILE"
    word_count=$(echo "$word_matches" | wc -l)
    echo "📊 Found $word_count instances of common English words" >> "$OUTPUT_FILE"
else
    echo "✅ No common English words detected" >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# Summary
echo "=== AUDIT SUMMARY ===" >> "$OUTPUT_FILE"
total_issues=$(grep -c "📊 Found" "$OUTPUT_FILE" 2>/dev/null || echo "0")
echo "Total categories with issues: $total_issues" >> "$OUTPUT_FILE"

# Calculate rough translation percentage
total_lines=$(wc -l < "$HTML_FILE")
issue_lines=$(grep "📊 Found" "$OUTPUT_FILE" | sed 's/.*Found \([0-9]*\).*/\1/' | awk '{sum += $1} END {print sum}')
if [ -z "$issue_lines" ]; then issue_lines=0; fi

estimated_coverage=$((100 - (issue_lines * 100) / total_lines))
if [ $estimated_coverage -lt 0 ]; then estimated_coverage=0; fi
if [ $estimated_coverage -gt 100 ]; then estimated_coverage=100; fi

echo "Estimated translation coverage: ~${estimated_coverage}%" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Recommendations based on findings
echo "=== RECOMMENDATIONS ===" >> "$OUTPUT_FILE"
if [ $total_issues -eq 0 ]; then
    echo "🎉 Excellent! No major translation issues detected." >> "$OUTPUT_FILE"
    echo "Consider running periodic audits to maintain quality." >> "$OUTPUT_FILE"
elif [ $total_issues -le 2 ]; then
    echo "👍 Good translation coverage with minor issues:" >> "$OUTPUT_FILE"
    echo "1. Review categories above for quick fixes" >> "$OUTPUT_FILE"
    echo "2. Add missing strings to settings/translations.json" >> "$OUTPUT_FILE"
elif [ $total_issues -le 4 ]; then
    echo "⚠️ Moderate translation issues detected:" >> "$OUTPUT_FILE"
    echo "1. Prioritize categories with most issues" >> "$OUTPUT_FILE"
    echo "2. Update translation functions for systematic patterns" >> "$OUTPUT_FILE"
    echo "3. Add comprehensive entries to settings/translations.json" >> "$OUTPUT_FILE"
else
    echo "🚨 Significant translation work needed:" >> "$OUTPUT_FILE"
    echo "1. Review all categories systematically" >> "$OUTPUT_FILE"
    echo "2. Consider regenerating localized files with updated process" >> "$OUTPUT_FILE"
    echo "3. Create bespoke regex rules for complex patterns" >> "$OUTPUT_FILE"
    echo "4. Update LOCALIZATION_GUIDE.md based on findings" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "💡 ACTION ITEMS:" >> "$OUTPUT_FILE"
echo "1. Review each finding above" >> "$OUTPUT_FILE"
echo "2. Categorize fixes: translations.json vs. function modifications" >> "$OUTPUT_FILE"
echo "3. Implement fixes systematically" >> "$OUTPUT_FILE"
echo "4. Re-run audit to verify improvements" >> "$OUTPUT_FILE"
echo "5. Target: 95%+ translation coverage" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Audit complete! Results saved to: $(basename "$OUTPUT_FILE")" >> "$OUTPUT_FILE"

# Console output summary
echo ""
echo "✅ Translation audit completed!"
echo "📊 Found issues in $total_issues out of $total_categories categories"
echo "🎯 Estimated coverage: ~${estimated_coverage}%"
echo "📝 Detailed results: $(basename "$OUTPUT_FILE")"
echo ""

if [ $total_issues -gt 0 ]; then
    echo "🔍 Next steps:"
    echo "1. Review the log file for specific issues"
    echo "2. Add missing translations to settings/translations.json"
    echo "3. Update functions for systematic patterns"
    echo "4. Re-run audit after fixes"
else
    echo "🎉 Great job! No major translation issues detected."
fi
