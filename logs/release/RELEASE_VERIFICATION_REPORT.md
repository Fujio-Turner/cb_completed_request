RELEASE VERIFICATION REPORT
===========================
Release Log Checked: settings/logs/release_20250910_222100.txt
Version Verified: 3.14.1
Verification Date: 2025-09-10
Verified By: Amp AI Assistant

VERSION CONSISTENCY:
[✅] index.html and en/index.html meta tags show v3.14.1
[✅] en/index.html version-info shows v3.14.1
[✅] README.md shows v3.14.1 in header
[✅] AGENT.md shows 3.14.1 (header shows v3.14.1; Version Management shows 3.14.1)
[✅] Dockerfile LABEL version="3.14.1"
[✅] GitHub Actions workflow uses 3.14.1 and v3.14.1 tags
[✅] All versions match across sources
[ℹ️] Main index.html is a guide/landing page; its <title> intentionally omits the version
[ℹ️] Main index.html intentionally lacks APP_VERSION/LAST_UPDATED

DOCUMENTATION:
[✅] README.md exists and is updated
[✅] Release notes include v3.14.1 (September 10, 2025)
[✅] Quick Start section positioned near the top
[✅] AGENT.md version section updated (Last Updated: 2025-09-10)

FUNCTIONAL:
[✅] index.html and en/index.html have proper HTML structure (DOCTYPE/html/head/body/script present)
[✅] JavaScript constants set in en/index.html (APP_VERSION="3.14.1", LAST_UPDATED="2025-09-10")
[ℹ️] Main index.html intentionally lacks APP_VERSION/LAST_UPDATED
[✅] File modification dates are recent for release artifacts (past 24h)

RED FLAGS:
[⚠️] Old version numbers (e.g., 3.7.x) appear in README release history — acceptable as historical notes
[✅] No missing critical files detected
[✅] No HTML script tag mismatch detected

OVERALL RESULT:
[✅] PASS - Release work verified successfully for v3.14.1

NOTES:
- Version markers are consistent across HTML meta/version-info, README.md, AGENT.md, Dockerfile, and CI workflow.
- index.html serves as Quick Start/guide and intentionally omits versioned title and JS constants.

---

PREVIOUS REPORTS
================

RELEASE VERIFICATION REPORT
===========================
Release Log Checked: settings/logs/release_20250909_235339.txt
Version Verified: 3.14.0
Verification Date: 2025-09-10
Verified By: Amp AI Assistant

VERSION CONSISTENCY:
[✅] index.html and en/index.html meta tags show v3.14.0
[✅] en/index.html version-info shows v3.14.0
[✅] README.md shows v3.14.0 in header
[✅] AGENT.md shows 3.14.0 (header and Version Management section)
[✅] Dockerfile LABEL version="3.14.0"
[✅] GitHub Actions workflow uses 3.14.0 and v3.14.0 tags
[✅] All versions match across sources
[ℹ️] Note: Main index.html is a guide page; its <title> does not include a version (by design)

DOCUMENTATION:
[✅] README.md exists and is updated
[✅] Release notes include v3.14.0 (September 10, 2025)
[✅] Quick Start section positioned near the top
[✅] AGENT.md version section updated (Last Updated: 2025-09-10)

FUNCTIONAL:
[✅] index.html and en/index.html have proper HTML structure
[✅] JavaScript constants set in en/index.html (APP_VERSION="3.14.0", LAST_UPDATED="2025-09-10")
[ℹ️] Main index.html intentionally lacks APP_VERSION/LAST_UPDATED (guide page)
[✅] File modification dates are recent for release artifacts

RED FLAGS:
[⚠️] Old version numbers appear in README release history (e.g., 3.7.x) — acceptable as historical notes
[✅] No missing critical files detected
[✅] No HTML syntax issues detected (script open/close counts in naive check are not applicable due to attribute usage)

OVERALL RESULT:
[✅] PASS - Release work verified successfully for v3.14.0

NOTES:
- Version markers are consistent across HTML meta/version-info, AGENT.md, README.md, Dockerfile, and CI workflow.
- index.html title intentionally omits version as it serves as the Quick Start/guide landing page.

---

PREVIOUS REPORTS
================

RELEASE VERIFICATION REPORT
===========================
Release Log Checked: settings/logs/release_20250906_153444.txt
Version Verified: 3.12.2
Verification Date: 2025-09-06
Verified By: Amp AI Assistant

VERSION CONSISTENCY:
[✅] All HTML files show v3.12.2 in meta tags and version-info
[✅] All README files show v3.12.2 in headers
[✅] AGENT.md shows v3.12.2 (header and Version Management section)
[✅] Dockerfile shows v3.12.2 in LABEL
[✅] GitHub Actions workflow uses 3.12.2 and v3.12.2 tags
[✅] All versions match exactly across sources

LOCALIZATION:
[❌] English "Copy" buttons found in de/es/pt language files
[❌] English "Show/Hide/Reset" text present in language files (de/es/pt)
[✅] Tab headers translated in all languages (e.g., DE: Instrumententafel/Zeitverlauf/Abfragegruppen)
[✅] All language files (de/, es/, pt/) exist

DOCUMENTATION:
[✅] All README files exist (EN/DE/ES/PT)
[✅] Release notes added with v3.12.2 entry (README.md)
[✅] Quick Start sections properly positioned
[✅] AGENT.md version section updated

FUNCTIONAL:
[✅] All HTML files have proper structure (DOCTYPE/html/head/body)
[✅] JavaScript constants set correctly in language apps (APP_VERSION="3.12.2", LAST_UPDATED="2025-09-06")
[ℹ️] Main index.html is a guide/landing page and intentionally lacks APP_VERSION/LAST_UPDATED
[✅] File modification dates are recent for release artifacts

RED FLAGS:
[⚠️] Old version numbers (e.g., 3.7.0) appear in README release notes by design — acceptable
[❌] English text present in non-English files (buttons/labels)
[✅] No missing critical files detected
[✅] No HTML script tag mismatch detected

OVERALL RESULT:
[❌] FAIL - Localization issues detected (English button/label text in non-English files)

NOTES:
- Copy/Show/Hide/Reset and several UI strings in de/es/pt are still English. Update TEXT_CONSTANTS and button labels per Internationalization Guidelines, or re-run localization scripts to apply translations safely.
- AGENT.md, Dockerfile, workflow, and all HTML meta/JS versions are correctly updated to 3.12.2.
