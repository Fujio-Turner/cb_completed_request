"""PyInstaller runtime hook: make libcblite discoverable via dlopen.

On macOS the dylib is extracted into ``sys._MEIPASS``. On Windows, add that
directory to the DLL search path so ``cblite.dll`` loads next to the exe.
"""
import os
import sys

if getattr(sys, "frozen", False):
    base = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    if sys.platform == "darwin":
        os.environ["DYLD_LIBRARY_PATH"] = base + os.pathsep + os.environ.get("DYLD_LIBRARY_PATH", "")
        # PyInstaller 6 onedir also keeps binaries next to the executable.
        exe_dir = os.path.dirname(sys.executable)
        os.environ["DYLD_LIBRARY_PATH"] = exe_dir + os.pathsep + os.environ["DYLD_LIBRARY_PATH"]
    elif sys.platform == "win32":
        try:
            os.add_dll_directory(base)
        except (OSError, AttributeError):
            os.environ["PATH"] = base + os.pathsep + os.environ.get("PATH", "")
        exe_dir = os.path.dirname(sys.executable)
        try:
            os.add_dll_directory(exe_dir)
        except (OSError, AttributeError):
            os.environ["PATH"] = exe_dir + os.pathsep + os.environ.get("PATH", "")
