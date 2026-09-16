/**
 * Repair and parse AI analysis JSON.
 *
 * Local models (Qwen / Ollama / LM Studio) often return an object that looks
 * like JSON but is not parseable: raw newlines inside overview_html, HTML
 * attributes with unescaped double quotes, <think> wrappers, markdown fences,
 * unquoted keys, trailing commas, or a truncated closing brace.
 *
 * Exposed as window.parseAIJsonContent (classic script) and as a CommonJS
 * export for Jest.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        var api = factory();
        root.parseAIJsonContent = api.parseAIJsonContent;
        root.overviewTextToHtml = api.overviewTextToHtml;
    }
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    var THINK_BLOCK_RE = /<(think|thinking|reasoning)\b[^>]*>[\s\S]*?<\/\1>/gi;
    var THINK_OPEN_RE = /<(think|thinking|reasoning)\b[^>]*>/gi;
    var THINK_CLOSE_RE = /<\/(?:think|thinking|reasoning)>/gi;
    var FENCE_WHOLE_RE = /^```(?:json)?\s*\n([\s\S]*)\n```\s*$/i;
    var OVERVIEW_KEY_RE = /"overview_html"\s*:\s*"/;
    var NEXT_JSON_KEY_RE = /"\s*,\s*"(chart_trends|summary|critical_issues|recommendations|index_analysis|query_patterns|next_steps|charts)"/;
    var HAS_HTML_TAG_RE = /<[a-zA-Z][a-zA-Z0-9]*\b/;
    var OVERVIEW_HEADERS = {
        'overall health': true,
        'key bottlenecks': true,
        'main findings': true,
        'user specific request': true,
        'user specific requests': true,
        'recommendations': true,
        'critical issues': true,
        'next steps': true,
        'chart trends': true
    };
    var JSON_KEYWORDS = { true: true, false: true, null: true };

    function stripReasoningWrappers(text) {
        if (!text) return text;
        return text
            .replace(THINK_BLOCK_RE, '')
            .replace(THINK_OPEN_RE, '')
            .replace(THINK_CLOSE_RE, '')
            .trim();
    }

    function stripMarkdownFences(text) {
        if (!text) return text;
        text = text.trim();
        var whole = text.match(FENCE_WHOLE_RE);
        if (whole) return whole[1].trim();
        return text.replace(/^```(?:json)?\s*\n/i, '').replace(/\n```\s*$/, '').trim();
    }

    function repairJsonStrings(s) {
        var out = '';
        var i = 0;
        var n = s.length;
        var inString = false;
        while (i < n) {
            var ch = s.charAt(i);
            if (!inString) {
                if (ch === '"') inString = true;
                out += ch;
                i += 1;
                continue;
            }
            if (ch === '\\' && i + 1 < n) {
                out += ch + s.charAt(i + 1);
                i += 2;
                continue;
            }
            if (ch === '"') {
                var j = i + 1;
                while (j < n && ' \t\r\n'.indexOf(s.charAt(j)) !== -1) j += 1;
                if (j >= n || ',}]:'.indexOf(s.charAt(j)) !== -1) {
                    inString = false;
                    out += ch;
                } else {
                    out += '\\"';
                }
                i += 1;
                continue;
            }
            if (ch === '\n') out += '\\n';
            else if (ch === '\r') out += '\\r';
            else if (ch === '\t') out += '\\t';
            else if (s.charCodeAt(i) < 32) {
                var hex = s.charCodeAt(i).toString(16);
                out += '\\u' + ('0000' + hex).slice(-4);
            } else {
                out += ch;
            }
            i += 1;
        }
        return out;
    }

    function fixInvalidEscapes(s) {
        return s.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
    }

    function isIdentStart(ch) {
        return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
    }

    function isIdentPart(ch) {
        return isIdentStart(ch) || (ch >= '0' && ch <= '9');
    }

    function quoteUnquotedKeys(s) {
        var out = '';
        var i = 0;
        var n = s.length;
        var inString = false;
        while (i < n) {
            var ch = s.charAt(i);
            if (inString) {
                out += ch;
                if (ch === '\\' && i + 1 < n) {
                    out += s.charAt(i + 1);
                    i += 2;
                    continue;
                }
                if (ch === '"') inString = false;
                i += 1;
                continue;
            }
            if (ch === '"') {
                inString = true;
                out += ch;
                i += 1;
                continue;
            }
            if (isIdentStart(ch)) {
                var j = i + 1;
                while (j < n && isIdentPart(s.charAt(j))) j += 1;
                var ident = s.slice(i, j);
                var k = j;
                while (k < n && ' \t\r\n'.indexOf(s.charAt(k)) !== -1) k += 1;
                if (k < n && s.charAt(k) === ':' && !JSON_KEYWORDS[ident]) {
                    out += '"' + ident + '"';
                    i = j;
                    continue;
                }
            }
            out += ch;
            i += 1;
        }
        return out;
    }

    function stripTrailingCommas(s) {
        var out = '';
        var i = 0;
        var n = s.length;
        var inString = false;
        while (i < n) {
            var ch = s.charAt(i);
            if (inString) {
                out += ch;
                if (ch === '\\' && i + 1 < n) {
                    out += s.charAt(i + 1);
                    i += 2;
                    continue;
                }
                if (ch === '"') inString = false;
                i += 1;
                continue;
            }
            if (ch === '"') {
                inString = true;
                out += ch;
                i += 1;
                continue;
            }
            if (ch === ',') {
                var j = i + 1;
                while (j < n && ' \t\r\n'.indexOf(s.charAt(j)) !== -1) j += 1;
                if (j < n && (s.charAt(j) === '}' || s.charAt(j) === ']')) {
                    i += 1;
                    continue;
                }
            }
            out += ch;
            i += 1;
        }
        return out;
    }

    function closeIncompleteJson(s) {
        var inString = false;
        var escaped = false;
        var stack = [];
        for (var i = 0; i < s.length; i += 1) {
            var ch = s.charAt(i);
            if (inString) {
                if (escaped) escaped = false;
                else if (ch === '\\') escaped = true;
                else if (ch === '"') inString = false;
                continue;
            }
            if (ch === '"') inString = true;
            else if (ch === '{') stack.push('}');
            else if (ch === '[') stack.push(']');
            else if ((ch === '}' || ch === ']') && stack.length && stack[stack.length - 1] === ch) {
                stack.pop();
            }
        }
        var out = s;
        if (inString) out += '"';
        while (stack.length) out += stack.pop();
        return out;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function inlineFormat(escapedText) {
        return escapedText
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    function isOverviewHeader(line) {
        var stripped = line.trim().replace(/:$/, '').toLowerCase();
        if (OVERVIEW_HEADERS[stripped]) return true;
        return /^#{1,3}\s+\S/.test(line.trim());
    }

    function overviewTextToHtml(text) {
        if (!text) return '';
        var stripped = String(text).trim();
        if (HAS_HTML_TAG_RE.test(stripped)) return stripped;

        var lines = stripped.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        var out = [];
        var inList = false;

        function closeList() {
            if (inList) {
                out.push('</ul>');
                inList = false;
            }
        }

        var i = 0;
        while (i < lines.length) {
            var raw = lines[i];
            var line = raw.trim();
            if (!line) {
                closeList();
                i += 1;
                continue;
            }

            var headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
            var headerText = null;
            if (headingMatch) {
                headerText = headingMatch[2].trim();
            } else if (OVERVIEW_HEADERS[line.replace(/:$/, '').toLowerCase()]) {
                headerText = line.replace(/:$/, '');
            }

            if (headerText !== null) {
                closeList();
                out.push('<h3>' + escapeHtml(headerText) + '</h3>');
                i += 1;
                continue;
            }

            var isListItem = (
                raw.indexOf('    ') === 0
                || raw.charAt(0) === '\t'
                || /^[-*•]\s+/.test(line)
                || /^\d+[.)]\s+/.test(line)
            );
            if (isListItem) {
                var item = line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '');
                if (!inList) {
                    out.push('<ul>');
                    inList = true;
                }
                out.push('<li>' + inlineFormat(escapeHtml(item)) + '</li>');
                i += 1;
                continue;
            }

            closeList();
            var paraParts = [line];
            i += 1;
            while (i < lines.length) {
                var nxtRaw = lines[i];
                var nxt = nxtRaw.trim();
                if (!nxt) break;
                if (isOverviewHeader(nxt)) break;
                if (
                    nxtRaw.indexOf('    ') === 0
                    || nxtRaw.charAt(0) === '\t'
                    || /^[-*•]\s+/.test(nxt)
                    || /^\d+[.)]\s+/.test(nxt)
                ) break;
                paraParts.push(nxt);
                i += 1;
            }
            out.push('<p>' + inlineFormat(paraParts.map(escapeHtml).join(' ')) + '</p>');
        }

        closeList();
        return out.join('\n');
    }

    function normalizeParsedAnalysis(data) {
        if (data && data.analysis_summary && typeof data.analysis_summary.overview_html === 'string') {
            data.analysis_summary.overview_html = overviewTextToHtml(data.analysis_summary.overview_html);
        }
        return data;
    }

    function salvageAsAnalysis(text) {
        var htmlBody = null;
        var match = OVERVIEW_KEY_RE.exec(text);
        if (match) {
            var rest = text.slice(match.index + match[0].length);
            var nxt = NEXT_JSON_KEY_RE.exec(rest);
            if (nxt) rest = rest.slice(0, nxt.index);
            rest = rest.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            htmlBody = rest.trim().replace(/[}" \t\n,]+$/, '');
        }
        if (!htmlBody) htmlBody = text;
        return {
            analysis_summary: {
                overview_html: overviewTextToHtml(htmlBody)
            }
        };
    }

    function tryParseJsonCandidate(candidate) {
        var repaired = repairJsonStrings(candidate);
        var variants = [
            candidate,
            repaired,
            fixInvalidEscapes(repaired),
            quoteUnquotedKeys(fixInvalidEscapes(repaired)),
            stripTrailingCommas(quoteUnquotedKeys(fixInvalidEscapes(repaired)))
        ];
        var seen = {};
        for (var v = 0; v < variants.length; v += 1) {
            var variant = variants[v];
            if (seen[variant]) continue;
            seen[variant] = true;
            var attempts = [variant, closeIncompleteJson(variant)];
            for (var a = 0; a < attempts.length; a += 1) {
                try {
                    var obj = JSON.parse(attempts[a]);
                    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj;
                } catch (e) {
                    // try next repair
                }
            }
        }
        return null;
    }

    function parseAIJsonContent(content) {
        if (content == null) return null;
        if (typeof content === 'object' && !Array.isArray(content)) {
            return normalizeParsedAnalysis(content);
        }
        if (typeof content !== 'string') content = String(content);

        var raw = content.trim();
        if (!raw) return null;

        var stripped = stripMarkdownFences(stripReasoningWrappers(raw));
        var candidates = [];
        var start = stripped.indexOf('{');
        if (start !== -1) {
            var end = stripped.lastIndexOf('}');
            candidates.push(end > start ? stripped.slice(start, end + 1) : stripped.slice(start));
        }
        candidates.push(stripped);

        var seen = {};
        for (var i = 0; i < candidates.length; i += 1) {
            var candidate = candidates[i];
            if (!candidate || seen[candidate]) continue;
            seen[candidate] = true;
            var parsed = tryParseJsonCandidate(candidate);
            if (parsed) return normalizeParsedAnalysis(parsed);
        }

        return salvageAsAnalysis(stripped);
    }

    return {
        parseAIJsonContent: parseAIJsonContent,
        overviewTextToHtml: overviewTextToHtml
    };
});
