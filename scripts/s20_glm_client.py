"""Thin HTTPS client for GLM 5.1 on api.z.ai.

Reads API key at runtime from local MCP server source to avoid committing secrets.
Used by s20_glm_worker.py.
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
import urllib.error
from pathlib import Path

API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"
MODEL = "glm-5.1"
MCP_SERVER_FILE = Path.home() / ".claude" / "mcp-servers" / "glm" / "server.mjs"


def load_api_key() -> str:
    env = os.environ.get("GLM_API_KEY")
    if env:
        return env
    if not MCP_SERVER_FILE.exists():
        raise RuntimeError(
            f"GLM_API_KEY env var not set and MCP server file not found: {MCP_SERVER_FILE}"
        )
    text = MCP_SERVER_FILE.read_text(encoding="utf-8")
    m = re.search(r'API_KEY\s*=\s*"([^"]+)"', text)
    if not m:
        raise RuntimeError(f"Could not locate API_KEY in {MCP_SERVER_FILE}")
    return m.group(1)


def ask(
    prompt: str,
    system: str | None = None,
    max_tokens: int = 10000,
    temperature: float = 0.3,
    timeout: float = 60.0,
) -> dict:
    api_key = load_api_key()
    messages: list[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    body = json.dumps(
        {"model": MODEL, "messages": messages, "max_tokens": max_tokens, "temperature": temperature}
    ).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GLM HTTP {e.code}: {err_body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"GLM network error: {e.reason}") from e


def extract_content(response: dict) -> str:
    msg = response.get("choices", [{}])[0].get("message", {})
    return msg.get("content") or msg.get("reasoning_content") or ""


if __name__ == "__main__":
    import sys

    prompt = sys.argv[1] if len(sys.argv) > 1 else "Say OK"
    out = ask(prompt, max_tokens=100)
    print(extract_content(out))
