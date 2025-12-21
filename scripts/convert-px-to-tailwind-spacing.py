#!/usr/bin/env python3
"""
Convert Tailwind CSS arbitrary values to standard Tailwind v4 classes.

=== SPACING UTILITIES (px → spacing scale) ===
- Spacing: p-[8px] → p-2, px-[14px] → px-3.5, gap-[6px] → gap-1.5
- Size: size-[38px] → size-9.5, w-[50px] → w-12.5
- Negative: mb-[-4px] → -mb-1, w-[-50px] → -w-12.5
- Special: top-[1px] → top-px, top-[-1px] → -top-px

Supported:
- Padding: p-, px-, py-, pt-, pr-, pb-, pl-, ps-, pe-
- Margin: m-, mx-, my-, mt-, mr-, mb-, ml-, ms-, me-
- Gap: gap-, gap-x-, gap-y-
- Space: space-x-, space-y-
- Position: top-, bottom-, left-, right-, inset-, inset-x-, inset-y-, start-, end-
- Translate: translate-x-, translate-y-
- Size: size-, w-, h-, max-w-, max-h-, min-w-, min-h-, max-size-, min-size-
- Flex basis: basis-[256px] → basis-64
- Text indent: indent-[32px] → indent-8
- Line height: leading-[18px] → leading-4.5
- Scroll padding/margin: scroll-p-*, scroll-m-*

=== BORDER/OUTLINE UTILITIES (px → number) ===
- Border: border-[2px] → border-2, border-t-[1px] → border-t
- Divide: divide-x-[2px] → divide-x-2
- Ring: ring-[3px] → ring-3
- Outline: outline-[2px] → outline-2, outline-offset-[4px] → outline-offset-4
- Stroke: stroke-[1px] → stroke-1
- Underline offset: underline-offset-[4px] → underline-offset-4

=== BORDER RADIUS (px/rem → named class) ===
- rounded-[8px] → rounded-lg, rounded-[0.5rem] → rounded-lg
- Non-standard: rounded-[10px] → rounded-[0.625rem]

=== DURATION/DELAY (ms → number) ===
- duration-[300ms] → duration-300
- delay-[150ms] → delay-150

=== OPACITY (decimal/% → number) ===
- opacity-[0.75] → opacity-75, opacity-[75%] → opacity-75

=== FILTER UTILITIES (% → number) ===
- brightness-[125%] → brightness-125
- contrast-[125%] → contrast-125
- saturate-[150%] → saturate-150
- grayscale-[50%] → grayscale-50
- sepia-[50%] → sepia-50
- invert-[25%] → invert-25
- backdrop-*: same pattern

=== BLUR UTILITIES (px → named class) ===
- blur-[4px] → blur-sm, blur-[8px] → blur-md
- backdrop-blur-[4px] → backdrop-blur-sm

=== TRANSFORM UTILITIES ===
- scale-[125%] → scale-125, scale-x-[75%] → scale-x-75
- rotate-[45deg] → rotate-45
- skew-x-[12deg] → skew-x-12
- hue-rotate-[90deg] → hue-rotate-90

=== UNITLESS UTILITIES ===
- z-[50] → z-50
- order-[3] → order-3
- columns-[3] → columns-3
- line-clamp-[3] → line-clamp-3
- grow-[3] → grow-3, shrink-[2] → shrink-2
- grid-cols-[12] → grid-cols-12, grid-rows-[6] → grid-rows-6
- col-span-[6] → col-span-6, row-span-[3] → row-span-3

=== TYPOGRAPHY ===
- Font size: text-[14px] → text-sm
- Letter spacing: tracking-[0.07px] → tracking-[0.004375rem]
"""

import re
from pathlib import Path
from typing import Optional


# =============================================================================
# Constants
# =============================================================================

SIZE_UTILITIES = {
  'size-', 'w-', 'h-', 'max-w-', 'max-h-', 'min-w-', 'min-h-',
  'max-size-', 'min-size-',
}

SPACING_UTILITIES = {
  # Padding
  'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'ps-', 'pe-',
  # Margin
  'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', 'ms-', 'me-',
  # Gap
  'gap-', 'gap-x-', 'gap-y-',
  # Space
  'space-x-', 'space-y-',
  # Position
  'top-', 'bottom-', 'left-', 'right-', 'inset-', 'inset-x-', 'inset-y-',
  'start-', 'end-',
  # Translate
  'translate-x-', 'translate-y-',
  # Line height
  'leading-',
  # Flex basis
  'basis-',
  # Text indent
  'indent-',
  # Scroll padding
  'scroll-p-', 'scroll-px-', 'scroll-py-',
  'scroll-pt-', 'scroll-pr-', 'scroll-pb-', 'scroll-pl-',
  'scroll-ps-', 'scroll-pe-',
  # Scroll margin
  'scroll-m-', 'scroll-mx-', 'scroll-my-',
  'scroll-mt-', 'scroll-mr-', 'scroll-mb-', 'scroll-ml-',
  'scroll-ms-', 'scroll-me-',
}

NEGATIVE_SPACING_UTILITIES = {
  # Margin
  '-m-', '-mx-', '-my-', '-mt-', '-mr-', '-mb-', '-ml-', '-ms-', '-me-',
  # Translate
  '-translate-x-', '-translate-y-',
  # Position
  '-top-', '-bottom-', '-left-', '-right-', '-inset-', '-inset-x-', '-inset-y-',
  '-start-', '-end-',
  # Text indent
  '-indent-',
  # Scroll padding (logical)
  '-scroll-ps-', '-scroll-pe-',
  # Scroll margin
  '-scroll-m-', '-scroll-mx-', '-scroll-my-',
  '-scroll-mt-', '-scroll-mr-', '-scroll-mb-', '-scroll-ml-',
  '-scroll-ms-', '-scroll-me-',
}

ALL_UTILITIES = SPACING_UTILITIES | SIZE_UTILITIES | NEGATIVE_SPACING_UTILITIES

# Tailwind v4: xs (2px) → sm (4px) → md (6px) → lg (8px) → xl (12px) → 2xl (16px) → 3xl (24px) → 4xl (32px)
ROUNDED_MAPPING_PX = {2: 'xs', 4: 'sm', 6: 'md', 8: 'lg', 12: 'xl', 16: '2xl', 24: '3xl', 32: '4xl'}
ROUNDED_MAPPING_REM = {0.125: 'xs', 0.25: 'sm', 0.375: 'md', 0.5: 'lg', 0.75: 'xl', 1.0: '2xl', 1.5: '3xl', 2.0: '4xl'}
ROUNDED_DIRECTIONS = {'t', 'r', 'b', 'l', 'tl', 'tr', 'bl', 'br', 's', 'e', 'ss', 'se', 'es', 'ee'}

# border-[1px] → border (empty suffix)
BORDER_WIDTH_MAPPING = {0: '0', 1: '', 2: '2', 4: '4', 8: '8'}
BORDER_DIRECTIONS = {'t', 'r', 'b', 'l', 'x', 'y', 's', 'e', 'ss', 'se', 'es', 'ee'}

FONT_SIZE_MAPPING = {
  12: 'xs', 14: 'sm', 16: 'base', 18: 'lg', 20: 'xl', 24: '2xl',
  30: '3xl', 36: '4xl', 48: '5xl', 60: '6xl', 72: '7xl', 96: '8xl', 128: '9xl',
}

REM_TO_FONT_SIZE = {
  0.75: 'xs', 0.875: 'sm', 1.0: 'base', 1.125: 'lg', 1.25: 'xl', 1.5: '2xl',
  1.875: '3xl', 2.25: '4xl', 3.0: '5xl', 3.75: '6xl', 4.5: '7xl', 6.0: '8xl', 8.0: '9xl',
}

# Blur mapping: px → named class (Tailwind v4)
BLUR_MAPPING_PX = {2: 'xs', 4: 'sm', 8: 'md', 12: 'lg', 16: 'xl', 24: '2xl', 40: '3xl'}

# Filter utilities that use percentage values
FILTER_UTILITIES = ['brightness', 'contrast', 'saturate', 'grayscale', 'sepia', 'invert']
BACKDROP_FILTER_UTILITIES = [f'backdrop-{u}' for u in FILTER_UTILITIES] + ['backdrop-opacity']


# =============================================================================
# Type Alias
# =============================================================================

Match = tuple[int, int, str, str]  # (start, end, old_class, new_class)


# =============================================================================
# Conversion Helpers
# =============================================================================

def format_number(value: float) -> str:
  """Format a number for Tailwind class (remove trailing zeros)."""
  if value == int(value):
    return str(int(value))
  return f'{value:.10f}'.rstrip('0').rstrip('.')


def px_to_tailwind(px_value: float, allow_decimal: bool = False) -> Optional[str]:
  """Convert pixel value to Tailwind spacing scale."""
  if abs(px_value - 1.0) < 0.001:
    return 'px'

  if allow_decimal:
    return format_number(px_value / 4.0)

  if abs(px_value % 4) > 0.001:
    return None
  return str(int(px_value // 4))


def px_to_rem(px_value: float) -> str:
  """Convert pixel value to rem (16px base)."""
  rem_value = px_value / 16.0
  return f'{format_number(rem_value)}rem'


def px_to_rounded(px_value: float) -> tuple[Optional[str], bool]:
  """Convert pixel value to Tailwind rounded class suffix or rem value.

  Returns (value, is_arbitrary):
  - For standard values: returns class suffix ('xs', 'sm', etc.) and False
  - For non-standard values: returns rem value and True
  """
  if px_value == int(px_value) and int(px_value) in ROUNDED_MAPPING_PX:
    return ROUNDED_MAPPING_PX[int(px_value)], False
  return px_to_rem(px_value), True


def rem_to_rounded(rem_value: float) -> tuple[Optional[str], bool]:
  """Convert rem value to Tailwind rounded class suffix.

  Returns (value, is_arbitrary):
  - For standard rem values: returns class suffix and False
  - For non-standard values: returns None and True (keep original)
  """
  for standard_rem, class_name in ROUNDED_MAPPING_REM.items():
    if abs(rem_value - standard_rem) < 0.001:
      return class_name, False
  return None, True


def px_to_border(px_value: float) -> str:
  """Convert pixel value to Tailwind border width class suffix."""
  px_int = int(px_value) if px_value == int(px_value) else None
  if px_int is not None and px_int in BORDER_WIDTH_MAPPING:
    return BORDER_WIDTH_MAPPING[px_int]
  return format_number(px_value)


def build_border_class(direction: Optional[str], suffix: str) -> str:
  """Build border class from direction and suffix."""
  if direction:
    return f'border-{direction}' if suffix == '' else f'border-{direction}-{suffix}'
  return 'border' if suffix == '' else f'border-{suffix}'


def decimal_to_percent(decimal_part: str) -> int:
  """Convert decimal string (e.g., '75' from 0.75) to percentage."""
  return int(decimal_part.ljust(2, '0')[:2])


# =============================================================================
# Generic Match Finder
# =============================================================================

def find_simple_px_classes(
  content: str,
  pattern: str,
  build_class: callable,
) -> list[Match]:
  """Generic finder for simple pixel-to-number conversions."""
  matches = []
  for match in re.finditer(pattern, content):
    full_match = match.group(0)
    px_value = float(match.group(1))
    if px_value >= 0:
      new_class = build_class(px_value)
      if new_class:
        matches.append((match.start(), match.end(), full_match, new_class))
  return matches


def find_percent_classes(content: str, utilities: list[str]) -> list[Match]:
  """Find utility classes with percentage or decimal values."""
  matches = []

  for utility in utilities:
    # Pattern for percentage: utility-[125%] → utility-125
    for match in re.finditer(rf'{re.escape(utility)}-\[(\d+)%\]', content):
      percent = int(match.group(1))
      matches.append((match.start(), match.end(), match.group(0), f'{utility}-{percent}'))

    # Pattern for decimal: utility-[.5] → utility-50
    for match in re.finditer(rf'{re.escape(utility)}-\[\.(\d+)\]', content):
      percent = decimal_to_percent(match.group(1))
      matches.append((match.start(), match.end(), match.group(0), f'{utility}-{percent}'))

  return matches


# =============================================================================
# Class Finders
# =============================================================================

def find_rounded_classes(content: str) -> list[Match]:
  """Find all rounded classes with arbitrary pixel or rem values."""
  matches = []

  # Pixel values: rounded-[8px], rounded-t-[8px]
  for match in re.finditer(r'rounded(?:-([a-z]+))?-\[([\d.]+)px\]', content):
    full_match, direction, px_value = match.group(0), match.group(1), float(match.group(2))

    if px_value < 0 or (direction and direction not in ROUNDED_DIRECTIONS):
      continue

    rounded_value, is_arbitrary = px_to_rounded(px_value)
    if rounded_value is None:
      continue

    if is_arbitrary:
      new_class = f'rounded-{direction}-[{rounded_value}]' if direction else f'rounded-[{rounded_value}]'
    else:
      new_class = f'rounded-{direction}-{rounded_value}' if direction else f'rounded-{rounded_value}'
    matches.append((match.start(), match.end(), full_match, new_class))

  # Rem values: rounded-[0.5rem], rounded-t-[0.5rem]
  for match in re.finditer(r'rounded(?:-([a-z]+))?-\[([\d.]+)rem\]', content):
    full_match, direction, rem_value = match.group(0), match.group(1), float(match.group(2))

    if rem_value < 0 or (direction and direction not in ROUNDED_DIRECTIONS):
      continue

    rounded_value, is_arbitrary = rem_to_rounded(rem_value)
    if is_arbitrary:
      continue

    new_class = f'rounded-{direction}-{rounded_value}' if direction else f'rounded-{rounded_value}'
    matches.append((match.start(), match.end(), full_match, new_class))

  return matches


def find_border_classes(content: str) -> list[Match]:
  """Find all border width classes with arbitrary pixel values."""
  matches = []

  for match in re.finditer(r'border(?:-([a-z]+))?-\[([\d.]+)px\]', content):
    full_match, direction, px_value = match.group(0), match.group(1), float(match.group(2))

    if px_value < 0 or (direction and direction not in BORDER_DIRECTIONS):
      continue

    border_suffix = px_to_border(px_value)
    matches.append((match.start(), match.end(), full_match, build_border_class(direction, border_suffix)))

  return matches


def find_border_shorthand_classes(content: str) -> list[Match]:
  """Find border shorthand classes: border-[0px_0px_1px] → border-b."""
  matches = []

  for match in re.finditer(r'border-\[([\d.]+)px(?:_([\d.]+)px)(?:_([\d.]+)px)?(?:_([\d.]+)px)?\]', content):
    values = [round(float(g)) for g in match.groups() if g is not None]
    if len(values) < 2:
      continue

    sides = _get_border_sides(values)
    border_classes = [
      build_border_class(direction, px_to_border(px_value))
      for direction, px_value in sides.items()
      if px_value > 0
    ]

    if border_classes:
      matches.append((match.start(), match.end(), match.group(0), ' '.join(border_classes)))

  return matches


def _get_border_sides(values: list[int]) -> dict[Optional[str], int]:
  """Parse CSS border shorthand values into individual sides."""
  n = len(values)
  if n == 1:
    return {None: values[0]}
  if n == 2:
    return {'y': values[0], 'x': values[1]}
  if n == 3:
    return {'t': values[0], 'r': values[1], 'b': values[2], 'l': values[1]}
  return {'t': values[0], 'r': values[1], 'b': values[2], 'l': values[3]}


def find_ring_classes(content: str) -> list[Match]:
  """Find ring width classes: ring-[3px] → ring-3."""
  matches = []

  for match in re.finditer(r'([^:"\'\s]+:)?ring-\[([\d.]+)px\]', content):
    modifier, px_value = match.group(1) or '', float(match.group(2))
    if px_value >= 0:
      matches.append((match.start(), match.end(), match.group(0), f'{modifier}ring-{format_number(px_value)}'))

  return matches


def find_divide_classes(content: str) -> list[Match]:
  """Find divide width classes: divide-x-[2px] → divide-x-2."""
  matches = []

  for match in re.finditer(r'divide-([xy])-\[([\d.]+)px\]', content):
    direction, px_value = match.group(1), float(match.group(2))
    if px_value >= 0:
      matches.append((match.start(), match.end(), match.group(0), f'divide-{direction}-{format_number(px_value)}'))

  return matches


def find_outline_classes(content: str) -> list[Match]:
  """Find outline width and offset classes with arbitrary pixel values."""
  matches = []

  for pattern, prefix in [(r'([^:"\'\s]+:)?outline-\[([\d.]+)px\]', 'outline'),
                          (r'([^:"\'\s]+:)?outline-offset-\[([\d.]+)px\]', 'outline-offset')]:
    for match in re.finditer(pattern, content):
      modifier, px_value = match.group(1) or '', float(match.group(2))
      if px_value >= 0:
        matches.append((match.start(), match.end(), match.group(0), f'{modifier}{prefix}-{format_number(px_value)}'))

  return matches


def find_stroke_classes(content: str) -> list[Match]:
  """Find stroke width classes: stroke-[1px] → stroke-1."""
  return find_simple_px_classes(
    content,
    r'stroke-\[([\d.]+)px\]',
    lambda px: f'stroke-{format_number(px)}'
  )


def find_underline_offset_classes(content: str) -> list[Match]:
  """Find underline offset classes: underline-offset-[4px] → underline-offset-4."""
  return find_simple_px_classes(
    content,
    r'underline-offset-\[([\d.]+)px\]',
    lambda px: f'underline-offset-{format_number(px)}'
  )


def find_duration_delay_classes(content: str) -> list[Match]:
  """Find duration and delay classes: duration-[300ms] → duration-300."""
  matches = []

  for prefix in ['duration', 'delay']:
    for match in re.finditer(rf'{prefix}-\[(\d+)ms\]', content):
      ms_value = int(match.group(1))
      matches.append((match.start(), match.end(), match.group(0), f'{prefix}-{ms_value}'))

  return matches


def find_opacity_classes(content: str) -> list[Match]:
  """Find opacity classes: opacity-[0.75] → opacity-75, opacity-[75%] → opacity-75."""
  matches = []

  # Decimal format: opacity-[0.75] → opacity-75
  for match in re.finditer(r'opacity-\[0?\.(\d+)\]', content):
    percent = decimal_to_percent(match.group(1))
    matches.append((match.start(), match.end(), match.group(0), f'opacity-{percent}'))

  # Percentage format: opacity-[75%] → opacity-75
  for match in re.finditer(r'opacity-\[(\d+)%\]', content):
    percent = int(match.group(1))
    matches.append((match.start(), match.end(), match.group(0), f'opacity-{percent}'))

  return matches


def find_filter_classes(content: str) -> list[Match]:
  """Find filter utility classes with percentage values."""
  return find_percent_classes(content, FILTER_UTILITIES)


def find_backdrop_filter_classes(content: str) -> list[Match]:
  """Find backdrop filter utility classes with percentage values."""
  return find_percent_classes(content, BACKDROP_FILTER_UTILITIES)


def find_blur_classes(content: str) -> list[Match]:
  """Find blur classes: blur-[4px] → blur-sm, backdrop-blur-[8px] → backdrop-blur-md."""
  matches = []

  for prefix in ['blur', 'backdrop-blur']:
    for match in re.finditer(rf'{prefix}-\[(\d+)px\]', content):
      px_value = int(match.group(1))
      if px_value in BLUR_MAPPING_PX:
        matches.append((match.start(), match.end(), match.group(0), f'{prefix}-{BLUR_MAPPING_PX[px_value]}'))

  return matches


def find_transform_classes(content: str) -> list[Match]:
  """Find transform utility classes with arbitrary values.

  Supports negative values both as prefix AND inside brackets:
  - scale-y-[-100%] → -scale-y-100
  - -scale-x-[75%] → -scale-x-75
  - rotate-[-45deg] → -rotate-45
  - skew-x-[-12deg] → -skew-x-12
  """
  matches = []

  # Pattern format: (neg_prefix)(utility)-[(neg_value)(number)(unit)]
  # Using XOR logic: if prefix XOR value is negative, result is negative
  # IMPORTANT: Order matters! More specific patterns must come BEFORE less specific ones
  # Each pattern uses negative lookbehinds to avoid partial matches
  transform_patterns = [
    (r'(-?)(scale(?:-[xy])?)-\[(-?)(\d+)%\]', '%'),
    (r'(-?)(skew(?:-[xy])?)-\[(-?)(\d+)deg\]', 'deg'),
    # backdrop-hue-rotate MUST come before hue-rotate
    (r'(-?)(backdrop-hue-rotate)-\[(-?)(\d+)deg\]', 'deg'),
    # hue-rotate uses lookbehind to avoid matching 'backdrop-hue-rotate'
    (r'(?<!backdrop-)(?<!backdrop)(-?)(hue-rotate)-\[(-?)(\d+)deg\]', 'deg'),
    # rotate uses lookbehind to avoid matching 'hue-rotate'
    (r'(?<!hue-)(?<!hue)(-?)(rotate)-\[(-?)(\d+)deg\]', 'deg'),
  ]

  for pattern, _ in transform_patterns:
    for match in re.finditer(pattern, content):
      neg_prefix = match.group(1)   # '-' or ''
      utility = match.group(2)       # 'scale', 'scale-x', 'rotate', etc.
      neg_value = match.group(3)     # '-' or ''
      value = int(match.group(4))

      # XOR logic: negative if prefix XOR value is negative
      is_negative = bool(neg_prefix) != bool(neg_value)
      prefix = '-' if is_negative else ''

      new_class = f'{prefix}{utility}-{value}'
      matches.append((match.start(), match.end(), match.group(0), new_class))

  return matches


def find_unitless_classes(content: str) -> list[Match]:
  """Find unitless utility classes: z-[50] → z-50, grid-cols-[12] → grid-cols-12."""
  matches = []

  # Utilities that support negative values
  for utility in ['z', 'order']:
    for match in re.finditer(rf'(-?{utility})-\[(\d+)\]', content):
      prefix, value = match.group(1), int(match.group(2))
      matches.append((match.start(), match.end(), match.group(0), f'{prefix}-{value}'))

  # Utilities that don't support negative values
  for utility in ['columns', 'line-clamp', 'grow', 'shrink', 'grid-cols', 'grid-rows', 'col-span', 'row-span']:
    for match in re.finditer(rf'{utility}-\[(\d+)\]', content):
      value = int(match.group(1))
      matches.append((match.start(), match.end(), match.group(0), f'{utility}-{value}'))

  return matches


def find_leading_rem_classes(content: str) -> list[Match]:
  """Find leading- classes with rem or unitless values."""
  matches = []

  # leading-[1.125rem] → leading-4.5
  for match in re.finditer(r'leading-\[(-?[\d.]+)rem\]', content):
    rem_value = float(match.group(1))
    px_value = rem_value * 16
    is_negative = px_value < 0

    tailwind_value = px_to_tailwind(abs(px_value), allow_decimal=True)
    if tailwind_value:
      prefix = '-' if is_negative else ''
      matches.append((match.start(), match.end(), match.group(0), f'{prefix}leading-{tailwind_value}'))

  # leading-[16] (unitless)
  for match in re.finditer(r'leading-\[(-?\d+(?:\.\d+)?)\]', content):
    px_value = float(match.group(1))
    is_negative = px_value < 0

    tailwind_value = px_to_tailwind(abs(px_value), allow_decimal=True)
    if tailwind_value:
      prefix = '-' if is_negative else ''
      matches.append((match.start(), match.end(), match.group(0), f'{prefix}leading-{tailwind_value}'))

  return matches


def find_typography_classes(content: str) -> list[Match]:
  """Find typography classes (tracking-, text-) with arbitrary pixel values."""
  matches = []

  # tracking-[0.07px] → tracking-[0.004375rem]
  for match in re.finditer(r'tracking-\[(-?[\d.]+)px\]', content):
    px_value = float(match.group(1))
    rem_value = ('-' + px_to_rem(abs(px_value))) if px_value < 0 else px_to_rem(px_value)
    matches.append((match.start(), match.end(), match.group(0), f'tracking-[{rem_value}]'))

  # text-[14px] → text-sm (or text-[0.875rem] for non-standard)
  for match in re.finditer(r'text-\[(\d+(?:\.\d+)?)px\]', content):
    px_value = float(match.group(1))
    px_value_int = round(px_value)

    if px_value_int in FONT_SIZE_MAPPING:
      new_class = f'text-{FONT_SIZE_MAPPING[px_value_int]}'
    else:
      new_class = f'text-[{px_to_rem(px_value)}]'
    matches.append((match.start(), match.end(), match.group(0), new_class))

  return matches


def find_font_size_rem_classes(content: str) -> list[Match]:
  """Find text- classes with rem values to convert to Tailwind font sizes."""
  matches = []

  for match in re.finditer(r'text-\[([\d.]+)rem\]', content):
    rem_value = float(match.group(1))
    for standard_rem, font_class in REM_TO_FONT_SIZE.items():
      if abs(rem_value - standard_rem) < 0.001:
        matches.append((match.start(), match.end(), match.group(0), f'text-{font_class}'))
        break

  return matches


def find_spacing_classes(content: str) -> list[Match]:
  """Find all spacing classes with arbitrary pixel values."""
  matches = []

  # Sort by length (longest first) to match longer utilities first
  sorted_utilities = sorted(ALL_UTILITIES, key=len, reverse=True)
  utilities_pattern = '|'.join(re.escape(util) for util in sorted_utilities)
  pattern = rf'(?:^|(?<![-\w]))({utilities_pattern})\[(-?[\d.]+)px\]'

  for match in re.finditer(pattern, content):
    full_match, utility, px_value = match.group(0), match.group(1), float(match.group(2))

    is_negative_value = px_value < 0
    tailwind_value = px_to_tailwind(abs(px_value), allow_decimal=True)

    if tailwind_value is None:
      continue

    if is_negative_value:
      base_utility = utility[1:] if utility.startswith('-') else utility
      new_class = f'-{base_utility}{tailwind_value}'
    else:
      new_class = f'{utility}{tailwind_value}'

    matches.append((match.start(), match.end(), full_match, new_class))


  return matches


def find_theme_spacing_classes(content: str) -> list[Match]:
  """Find and convert theme(spacing.X) to --spacing(X).
  
  Example: [--radius:theme(spacing.5)] → [--radius:--spacing(5)]
  """
  matches = []
  
  # Pattern: theme(spacing.X) where X is a number/decimal/key
  # We look for it typically inside arbitrary values or specific positions
  for match in re.finditer(r'theme\(spacing\.([^)]+)\)', content):
    full_match = match.group(0)
    spacing_key = match.group(1)
    
    new_value = f'--spacing({spacing_key})'
    matches.append((match.start(), match.end(), full_match, new_value))
    
  return matches

def find_gradient_classes(content: str) -> list[Match]:
  """Find and convert bg-gradient-* to bg-linear-*.
  
  Tailwind v4 renamed bg-gradient to bg-linear.
  """
  matches = []
  
  # bg-gradient-to-r -> bg-linear-to-r
  for match in re.finditer(r'bg-gradient-([a-z0-9-]+)', content):
    full_match = match.group(0)
    suffix = match.group(1)
    
    new_class = f'bg-linear-{suffix}'
    matches.append((match.start(), match.end(), full_match, new_class))
    
  return matches


def find_overflow_classes(content: str) -> list[Match]:
  """Find and convert overflow-ellipsis to text-ellipsis.
  
  Tailwind v4 removed overflow-ellipsis in favor of text-ellipsis.
  """
  matches = []
  
  # overflow-ellipsis -> text-ellipsis
  for match in re.finditer(r'overflow-ellipsis', content):
    full_match = match.group(0)
    matches.append((match.start(), match.end(), full_match, 'text-ellipsis'))
    
  return matches


# =============================================================================
# Main Processing
# =============================================================================

# All finder functions to run
FINDERS = [
  find_spacing_classes,
  find_rounded_classes,
  find_border_shorthand_classes,
  find_border_classes,
  find_divide_classes,
  find_ring_classes,
  find_outline_classes,
  find_stroke_classes,
  find_underline_offset_classes,
  find_duration_delay_classes,
  find_opacity_classes,
  find_filter_classes,
  find_backdrop_filter_classes,
  find_blur_classes,
  find_transform_classes,
  find_unitless_classes,
  find_typography_classes,
  find_font_size_rem_classes,
  find_leading_rem_classes,
  find_theme_spacing_classes,
  find_gradient_classes,
  find_overflow_classes,
]


def convert_px_to_spacing(content: str) -> tuple[str, int]:
  """Convert arbitrary values to Tailwind classes."""
  all_matches = []
  for finder in FINDERS:
    all_matches.extend(finder(content))

  if not all_matches:
    return content, 0

  # Sort by position (reverse order) for safe replacement
  all_matches.sort(key=lambda x: x[0], reverse=True)

  replacements = 0
  for start, end, old_class, new_class in all_matches:
    if content[start:end] == old_class:
      content = content[:start] + new_class + content[end:]
      replacements += 1

  return content, replacements


def process_file(file_path: Path) -> tuple[bool, int]:
  """Process a single file. Returns (was_modified, number_of_replacements)."""
  try:
    content = file_path.read_text(encoding='utf-8')
    new_content, replacements = convert_px_to_spacing(content)

    if new_content != content:
      file_path.write_text(new_content, encoding='utf-8')
      return True, replacements
    return False, 0
  except Exception as e:
    print(f"Error processing {file_path}: {e}")
    return False, 0


def find_files_to_process(root_dir: Path) -> list[Path]:
  """Find all TypeScript, TSX, JavaScript, and JSX files to process."""
  exclude_dirs = {'node_modules', '.next', 'dist', 'build', '.git', '.turbo', '.output'}
  files = []

  for ext in ['.ts', '.tsx', '.js', '.jsx']:
    files.extend(
      f for f in root_dir.rglob(f'*{ext}')
      if not any(excluded in f.parts for excluded in exclude_dirs)
    )

  files.sort(key=lambda f: f.stat().st_size if f.exists() else 0, reverse=True)
  return files


def main():
  """Main function."""
  script_dir = Path(__file__).parent
  project_root = script_dir.parent

  print(f"Converting pixel values to Tailwind spacing scale in: {project_root}")
  print("=" * 60)

  files = find_files_to_process(project_root)
  print(f"Found {len(files)} files to process\n")

  total_replacements = 0
  modified_files = []

  for file_path in files:
    was_modified, replacements = process_file(file_path)
    if was_modified:
      modified_files.append(file_path)
      total_replacements += replacements
      print(f"✓ {file_path.relative_to(project_root)}: {replacements} conversions")

  print("\n" + "=" * 60)
  print(f"Summary:")
  print(f"  Files modified: {len(modified_files)}")
  print(f"  Total conversions: {total_replacements}")
  print("=" * 60)


if __name__ == '__main__':
  main()
