"""Robust JSON parser for GLM outputs.

Strategy:
1. Strip markdown wrappers.
2. Try strict json.loads.
3. Surgical repair: insert missing `}` before `]` when preceded by a closing `"` inside array-of-objects.
4. Fallback to json-repair library.
5. Return None if all fail.
"""
from __future__ import annotations

import json

try:
    from json_repair import loads as rj_loads
except ImportError:
    rj_loads = None


def _strip_markdown(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # drop first fence line
        first_nl = text.find("\n")
        if first_nl != -1:
            text = text[first_nl + 1 :]
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    return text.strip()


def _slice_to_braces(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return text[start : end + 1]
    return text


def _repair_missing_brace_before_bracket(text: str) -> str:
    """If an array of objects is missing `}` on the last item before `]`, insert it.

    Scan bracket/brace depth. When we see `]` that closes an array-of-objects,
    check if the preceding non-whitespace char is `"` (string end) — if so, the
    final object was truncated; insert `}` before the `]`.
    """
    # Repeat until no more fixes (could have multiple broken arrays)
    for _ in range(10):  # safety cap
        new_text = _single_pass(text)
        if new_text == text:
            break
        text = new_text
    return text


def _single_pass(text: str) -> str:
    stack: list[str] = []  # 'arr_obj' | 'arr' | 'obj'
    in_str = False
    esc = False
    n = len(text)
    i = 0
    while i < n:
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True
        elif c == "[":
            j = i + 1
            while j < n and text[j] in " \t\n\r":
                j += 1
            if j < n and text[j] == "{":
                stack.append("arr_obj")
            else:
                stack.append("arr")
        elif c == "{":
            stack.append("obj")
        elif c == "}":
            if stack and stack[-1] == "obj":
                stack.pop()
        elif c == "]":
            # Case A: stack top is unclosed `obj` inside `arr_obj` — last object missed `}`.
            if len(stack) >= 2 and stack[-1] == "obj" and stack[-2] == "arr_obj":
                k = i - 1
                while k >= 0 and text[k] in " \t\n\r":
                    k -= 1
                if k >= 0 and text[k] in ('"', "]", "}", "l", "e"):  # string/num/null/bool end
                    return text[:i] + "}" + text[i:]
            # Case B: normal close of array
            if stack and stack[-1] in ("arr_obj", "arr"):
                stack.pop()
        i += 1
    return text


def parse(text: str) -> dict | None:
    """Try all parsing strategies. Return dict or None."""
    cleaned = _strip_markdown(text)
    for candidate in (cleaned, _slice_to_braces(cleaned)):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
    # Surgical repair: missing } before ]
    repaired = _repair_missing_brace_before_bracket(_slice_to_braces(cleaned))
    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass
    # Last resort: json-repair library
    if rj_loads is not None:
        try:
            result = rj_loads(repaired)
            if isinstance(result, dict):
                return result
        except Exception:
            pass
    return None


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python s20_json_repair.py <file>")
        sys.exit(1)
    text = open(sys.argv[1], encoding="utf-8").read()
    result = parse(text)
    if result is None:
        print("FAILED")
        sys.exit(2)
    print(json.dumps(result, ensure_ascii=False, indent=2)[:500])
    print(f"\n... keys: {list(result.keys())}")
