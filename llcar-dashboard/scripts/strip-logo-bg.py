"""
Strip dark background from llcar-logo.png via flood-fill from image borders.
Produces public/llcar-logo-transparent.png with alpha=0 on the dark frame,
preserving the silver shield intact.
"""
from __future__ import annotations
from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "llcar-logo.png"
DST = ROOT / "public" / "llcar-logo-transparent.png"

# Pixels whose max-channel value <= this are considered "background dark".
# Shield interior has deeper darks too, but the flood-fill starts only from
# border-connected dark regions, so internal shield darkness is preserved.
LUM_THRESHOLD = 45
# Edge feather: additionally soften alpha near the mask boundary so the
# silver rim doesn't get a hard bitmap edge.
EDGE_SOFTEN = 2  # pixels


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    px = img.load()
    print(f"[strip-logo-bg] loaded {SRC} {w}x{h}")

    visited = bytearray(w * h)

    def idx(x: int, y: int) -> int:
        return y * w + x

    queue: deque[tuple[int, int]] = deque()

    # Seed: every border pixel that qualifies as dark.
    def is_dark(r: int, g: int, b: int) -> bool:
        return max(r, g, b) <= LUM_THRESHOLD

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_dark(r, g, b):
                queue.append((x, y))
                visited[idx(x, y)] = 1
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_dark(r, g, b):
                queue.append((x, y))
                visited[idx(x, y)] = 1

    # 4-connected flood fill across the dark border-connected region.
    while queue:
        x, y = queue.popleft()
        # Fully transparent on the seed region.
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[idx(nx, ny)]:
                r, g, b, _ = px[nx, ny]
                if is_dark(r, g, b):
                    visited[idx(nx, ny)] = 1
                    queue.append((nx, ny))

    # Feather the boundary: any pixel adjacent to a transparent pixel gets
    # its alpha slightly lowered so the rim anti-aliases against the panel bg.
    if EDGE_SOFTEN > 0:
        # Build a set of current-alpha=0 pixels.
        for _ in range(EDGE_SOFTEN):
            to_soften: list[tuple[int, int, int]] = []
            for y in range(h):
                for x in range(w):
                    r, g, b, a = px[x, y]
                    if a == 0:
                        continue
                    # Check neighbours.
                    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            _, _, _, na = px[nx, ny]
                            if na == 0:
                                to_soften.append((x, y, a))
                                break
            for x, y, a in to_soften:
                r, g, b, _ = px[x, y]
                # Halve alpha on each pass at the boundary.
                new_a = max(0, a // 2)
                px[x, y] = (r, g, b, new_a)

    img.save(DST, "PNG", optimize=True)
    print(f"[strip-logo-bg] wrote {DST}")


if __name__ == "__main__":
    main()
