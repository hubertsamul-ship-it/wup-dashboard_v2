# Vercel Python ASGI entry point.
# Vercel packs everything in the same directory, so `backend` is accessible as a sibling.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # root → backend visible

from backend.api.main import app  # noqa: F401  (Vercel looks for `app`)
