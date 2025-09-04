#!/usr/bin/env python3
"""
Release Work Check Script
=========================
Comprehensive verification tool for release quality gates.
This script performs all the checks from RELEASE_WORK_CHECK.md automatically.

Usage: python3 python/RELEASE_WORK_CHECK.py [VERSION]
"""
import sys
import os
import subprocess
import glob
import re
from pathlib import Path

def run_command(cmd, quiet=False):
    """Run shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if not quiet and result.returncode != 0:
            print(f"❌ Command failed: {cmd}")
            print(f"Error: {result.stderr}")
        return result.stdout.strip(), result.returncode
    except Exception as e:
        print(f"❌ Command error: {cmd} - {e}")
        return "", 1

def detect_version():
    """Detect the current version from release log or AGENT.md"""
    # Try to find latest release log
    release_logs = glob.glob("settings/logs/release_*.txt")
    if release_logs:
        latest_log = max(release_logs, key=os.path.getctime)
        with open(latest_log, 'r') as f:
            content = f.read()
            match = re.search(r'New Version.*?(\d+\.\d+\.\d+)', content)
            if match:
                return match.group(1)
    
    # Fallback to AGENT.md
    try:
        with open("AGENT.md", 'r') as f:
            content = f.read()
            match = re.search(r'Current Version.*?(\d+\.\d+\.\d+)', content)
            if match:
                return match.group(1)
    except FileNotFoundError:
        pass
    
    return None

def check_version_consistency(expected_version):
    """Check version consistency across all files"""
    print("🔍 Checking Version Consistency...")
    issues = []
    
    # Check meta version tags
    output, _ = run_command('grep -r "name=\\"version\\"" *.html */index.html 2>/dev/null', quiet=True)
    if output:
        for line in output.split('\n'):
            if expected_version not in line:
                issues.append(f"Version mismatch in meta tag: {line}")
    else:
        issues.append("No version meta tags found in HTML files")
    
    # Check JavaScript constants
    output, _ = run_command('grep -r "APP_VERSION.*=" *.html */index.html 2>/dev/null', quiet=True)
    for line in output.split('\n'):
        if line and expected_version not in line and 'APP_VERSION' in line and '=' in line:
            issues.append(f"Version mismatch in JavaScript constant: {line}")
    
    # Check README files
    output, _ = run_command('grep -r "# Couchbase Slow Query Analysis Tool" README*.md */README*.md AGENT.md 2>/dev/null', quiet=True)
    for line in output.split('\n'):
        if line and expected_version not in line:
            issues.append(f"Version mismatch in documentation: {line}")
    
    # Check Docker files
    output, _ = run_command('grep "version=" Dockerfile', quiet=True)
    if output and expected_version not in output:
        issues.append(f"Version mismatch in Dockerfile: {output}")
    
    # Check for old application versions (excluding external libraries)
    major, minor, _ = expected_version.split('.')
    if int(minor) > 0:
        older_minor = int(minor) - 1
        older_versions_pattern = f"{major}\\.{older_minor}\\.[0-9]"
        
        cmd = f'grep -r "{older_versions_pattern}" *.html */index.html *.md AGENT.md Dockerfile 2>/dev/null | grep -v "cdnjs.cloudflare.com" | grep -v "cdn.jsdelivr.net" | grep -v "integrity=" | grep -v "crossorigin=" | grep -v "release_" | grep -v "\\.min\\.js" | grep -v "\\.min\\.css" | head -5'
        output, _ = run_command(cmd, quiet=True)
        if output:
            # Only report if the matches look like application versions, not library versions
            non_library_matches = [line for line in output.split('\n') if line and 'src=' not in line and 'href=' not in line]
            if non_library_matches:
                issues.append(f"Found potential old application versions: {len(non_library_matches)} instances")
    
    return issues

def check_javascript_syntax():
    """Check JavaScript syntax in all HTML files"""
    print("🔍 Checking JavaScript Syntax...")
    output, returncode = run_command('python3 python/validate_js_syntax.py')
    
    if returncode != 0:
        return ["JavaScript syntax errors found - run validate_js_syntax.py for details"]
    
    if "All files passed" not in output:
        return ["JavaScript validation did not complete successfully"]
        
    return []

def check_localization():
    """Check localization completeness"""
    print("🔍 Checking Localization...")
    issues = []
    
    # Check for English text in non-English files
    english_patterns = [
        ("Copy buttons", 'grep -n "Copy</button>" de/index.html es/index.html pt/index.html 2>/dev/null'),
        ("English button text", 'grep -n ">Copy<\\|>Show<\\|>Hide<\\|>Reset<" de/index.html es/index.html pt/index.html 2>/dev/null'),
        ("English tab headers", 'grep -n ">Dashboard<\\|>Timeline<\\|>Analysis<" de/index.html es/index.html pt/index.html 2>/dev/null')
    ]
    
    for pattern_name, cmd in english_patterns:
        output, returncode = run_command(cmd, quiet=True)
        if returncode == 0 and output:
            issues.append(f"English text found in non-English files ({pattern_name}): {len(output.split())} instances")
    
    # Check for translated tab headers
    languages = [
        ("German", "de/index.html", ["Instrumententafel", "Zeitverlauf", "Analysieren"]),
        ("Spanish", "es/index.html", ["Panel de Control", "Línea de Tiempo", "Análisis"]),
        ("Portuguese", "pt/index.html", ["Painel de Controle", "Linha do Tempo", "Análise"])
    ]
    
    for lang_name, file_path, expected_terms in languages:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                found_terms = [term for term in expected_terms if term in content]
                if len(found_terms) < len(expected_terms):
                    issues.append(f"{lang_name} translations incomplete: missing {set(expected_terms) - set(found_terms)}")
    
    return issues

def check_html_structure():
    """Check HTML structure consistency"""
    print("🔍 Checking HTML Structure...")
    issues = []
    
    html_files = ['index.html'] + glob.glob('*/index.html')
    
    for file_path in html_files:
        if not os.path.exists(file_path):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check basic structure
            if not content.count('DOCTYPE'):
                issues.append(f"{file_path}: Missing DOCTYPE declaration")
            if not content.count('<html'):
                issues.append(f"{file_path}: Missing html tag")
            if not content.count('<head>'):
                issues.append(f"{file_path}: Missing head tag")
            if not content.count('<body'):
                issues.append(f"{file_path}: Missing body tag")
                
            # Check script tag balance
            open_scripts = content.count('<script')
            close_scripts = content.count('</script>')
            if open_scripts != close_scripts and abs(open_scripts - close_scripts) > 2:  # Allow some tolerance
                issues.append(f"{file_path}: Script tag mismatch - {open_scripts} open, {close_scripts} close")
                
        except Exception as e:
            issues.append(f"{file_path}: Error reading file - {e}")
    
    return issues

def check_file_existence():
    """Check that all critical files exist"""
    print("🔍 Checking File Existence...")
    issues = []
    
    critical_files = [
        'index.html',
        'en/index.html', 
        'de/index.html',
        'es/index.html', 
        'pt/index.html',
        'AGENT.md',
        'README.md',
        'de/README.de.md',
        'es/README.es.md',
        'pt/README.pt.md',
        'Dockerfile',
        '.github/workflows/docker-build-push.yml'
    ]
    
    for file_path in critical_files:
        if not os.path.exists(file_path):
            issues.append(f"Missing critical file: {file_path}")
    
    return issues

def print_summary(all_issues, expected_version):
    """Print final summary"""
    print("\n" + "="*60)
    print("🔍 RELEASE VERIFICATION COMPLETE")
    print("="*60)
    print(f"📦 Target Version: {expected_version}")
    print(f"📊 Total Issues Found: {len(all_issues)}")
    
    if all_issues:
        print("\n❌ CRITICAL ISSUES THAT MUST BE FIXED:")
        for i, issue in enumerate(all_issues, 1):
            print(f"{i:2d}. {issue}")
        
        print("\n🚨 RELEASE STATUS: BLOCKED - Fix issues above before proceeding")
        print("\n💡 Common Fixes:")
        print("   • Version issues: Check VERSION_UPDATE_GUIDE.md")
        print("   • Localization issues: Re-run localization scripts")
        print("   • JavaScript syntax: Run fix_js_strings.py")
        print("   • HTML structure: Verify file integrity after translations")
        return False
    else:
        print("\n✅ ALL CHECKS PASSED!")
        print("🚀 RELEASE STATUS: READY FOR DEPLOYMENT")
        return True

def main():
    """Main verification function"""
    print("🚀 Release Work Check - Comprehensive Verification")
    print("="*60)
    
    # Detect or get version
    expected_version = None
    if len(sys.argv) > 1:
        expected_version = sys.argv[1]
    else:
        expected_version = detect_version()
    
    if not expected_version:
        print("❌ Could not determine target version")
        print("Usage: python3 settings/RELEASE_WORK_CHECK.py [VERSION]")
        sys.exit(1)
    
    print(f"🎯 Verifying release for version: {expected_version}")
    print()
    
    # Run all checks
    all_issues = []
    
    # Check 1: File existence
    issues = check_file_existence()
    all_issues.extend(issues)
    
    # Check 2: Version consistency  
    issues = check_version_consistency(expected_version)
    all_issues.extend(issues)
    
    # Check 3: JavaScript syntax
    issues = check_javascript_syntax()
    all_issues.extend(issues)
    
    # Check 4: Localization
    issues = check_localization()
    all_issues.extend(issues)
    
    # Check 5: HTML structure
    issues = check_html_structure()
    all_issues.extend(issues)
    
    # Print final summary
    success = print_summary(all_issues, expected_version)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
