"""Compatibility shim for `import toon_python`.

The original `toon_python` lives in a private GitLab repo
(https://gitlab.com/KanTakahiro/toon-python.git) and is not publicly
installable. The publicly available, working equivalent is the `python-toon`
package on PyPI (https://github.com/xaviviro/python-toon), which exposes its
API under the `toon` module name.

This shim re-exports `toon`'s public API under the `toon_python` name so
existing call sites (`import toon_python`, `toon_python.encode(...)`,
`from toon_python.encoder import encode`) keep working unchanged.
"""

from toon import encode, decode  # noqa: F401
from toon import encoder as _encoder_mod  # noqa: F401
from toon import decoder as _decoder_mod  # noqa: F401

# Common aliases used by some call sites.
dumps = encode
loads = decode

# Register submodule shims so `from toon_python.encoder import encode` works.
import sys as _sys

_sys.modules["toon_python.encoder"] = _encoder_mod
_sys.modules["toon_python.decoder"] = _decoder_mod

encoder = _encoder_mod
decoder = _decoder_mod
