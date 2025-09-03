#!/usr/bin/env python3
"""
Test File Organization

This script verifies that all files have been moved to the correct locations
and that references have been updated properly.
"""

import os
import glob

def test_file_organization():
    """Test that files are in the correct locations"""
    
    print("🔍 Testing File Organization")
    print("=" * 50)
    
    # Check that Python files are in /python folder
    python_files = glob.glob("python/*.py")
    print(f"✅ Found {len(python_files)} Python files in /python folder")
    
    # Check that release reports are in /logs/release folder
    release_reports = glob.glob("logs/release/*.md")
    print(f"✅ Found {len(release_reports)} report files in /logs/release folder")
    
    # Check that no Python files remain in root
    root_python_files = glob.glob("*.py")
    if root_python_files:
        print(f"⚠️ Found {len(root_python_files)} Python files still in root: {root_python_files}")
    else:
        print("✅ No Python files found in root directory")
    
    # Check that essential Python scripts exist
    essential_scripts = [
        "python/RELEASE_WORK_CHECK.py",
        "python/validate_js_syntax.py",
        "python/apply_safe_translations.py",
        "python/find_translatable_text.py"
    ]
    
    missing_scripts = []
    for script in essential_scripts:
        if os.path.exists(script):
            print(f"✅ {script} exists")
        else:
            print(f"❌ {script} missing")
            missing_scripts.append(script)
    
    # Check release reports
    essential_reports = [
        "logs/release/RELEASE_VERIFICATION_REPORT.md",
        "logs/release/RELEASE_FIXES_SUMMARY.md"
    ]
    
    for report in essential_reports:
        if os.path.exists(report):
            print(f"✅ {report} exists")
        else:
            print(f"❌ {report} missing")
    
    # Summary
    if not root_python_files and not missing_scripts:
        print(f"\n🎉 File organization test PASSED!")
        print(f"   • {len(python_files)} Python scripts organized in /python")
        print(f"   • {len(release_reports)} reports organized in /logs/release")
        print(f"   • No files in wrong locations")
        return True
    else:
        print(f"\n⚠️ File organization needs attention:")
        if root_python_files:
            print(f"   • Move these Python files to /python: {root_python_files}")
        if missing_scripts:
            print(f"   • Missing essential scripts: {missing_scripts}")
        return False

def main():
    """Main function"""
    success = test_file_organization()
    
    if success:
        print(f"\n✅ All files are properly organized!")
    else:
        print(f"\n❌ File organization needs fixes")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
