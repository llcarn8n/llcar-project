"""QTP Shape Bitfield Decoder.

Each QTP shape byte encodes a turning point in 8 bits using the LLLDDDDT format:
  - Bits 7-5 (3 bits): Level -- quantized amplitude level (0-6, 7 is clamped to 6)
  - Bits 4-1 (4 bits): Duration -- time offset from previous turning point (log-scale, 0-15)
  - Bit 0 (1 bit): Trend -- direction: 0=down/stable, 1=up

The 7 quantization levels map to window statistics as follows:
  Level 0: min
  Level 1: avg - 0.7 * std
  Level 2: avg - 0.3 * std
  Level 3: avg (center)
  Level 4: avg + 0.3 * std
  Level 5: avg + 0.7 * std
  Level 6: max
"""

from typing import Optional


def decode_shape(byte_val: Optional[int]) -> Optional[dict]:
    """Decode a single QTP shape byte into its components.

    Args:
        byte_val: An integer 0-255 representing a packed shape byte, or None.

    Returns:
        A dict with keys 'level', 'duration', 'trend', or None if input is None.
    """
    if byte_val is None:
        return None

    level = (byte_val >> 5) & 0x07  # bits 7-5
    duration = (byte_val >> 1) & 0x0F  # bits 4-1
    trend = byte_val & 0x01  # bit 0

    # Clamp level 7 to 6 (only 0-6 are valid)
    if level > 6:
        level = 6

    return {"level": level, "duration": duration, "trend": trend}


def decode_shape_bytes(shape_list: list) -> list:
    """Decode a list of QTP shape bytes.

    Args:
        shape_list: List of integer byte values (typically 4 per axis).
                    May contain None values.

    Returns:
        List of decoded dicts (or None for None inputs), same length as input.
    """
    return [decode_shape(b) for b in shape_list]


def level_to_value(level: int, mn: float, mx: float, avg: float, std: float) -> float:
    """Convert a quantization level back to an approximate physical value.

    Args:
        level: Quantization level (0-6).
        mn: Minimum value of the window.
        mx: Maximum value of the window.
        avg: Average value of the window.
        std: Standard deviation of the window.

    Returns:
        Approximate physical value corresponding to the level.
    """
    level_map = {
        0: mn,
        1: avg - 0.7 * std,
        2: avg - 0.3 * std,
        3: avg,
        4: avg + 0.3 * std,
        5: avg + 0.7 * std,
        6: mx,
    }
    return level_map[level]
