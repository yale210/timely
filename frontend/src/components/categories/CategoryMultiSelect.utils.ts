import type {
  DropdownPosition,
  FloatingPosition,
} from "./CategoryMultiSelect.types";

const FLOATING_PADDING = 8;
const DROPDOWN_PREFERRED_HEIGHT = 224;
const DROPDOWN_MIN_HEIGHT = 160;
const DROPDOWN_OFFSET = 6;
const MENU_WIDTH = 176;
const MENU_ESTIMATED_HEIGHT = 220;
const PICKER_OFFSET = 280;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normaliseHex = (value: string): string | null => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("#") && trimmed.length === 7) {
    return trimmed;
  }
  return null;
};

const rgbToHex = (value: string): string | null => {
  const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
    .exec(value.trim().toLowerCase());

  if (!match) {
    return null;
  }

  const [r, g, b] = match
    .slice(1)
    .map((channel) => clamp(Number(channel), 0, 255));
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Normalize free-text category input for matching.
 * @param value - Raw category text.
 * @returns The trimmed, lowercased value.
 */
export const normalise = (value: string) => value.trim().toLowerCase();

/**
 * Pick a random fallback colour from the preset swatch list.
 * @param presetColours - Available preset colours.
 * @returns A random preset colour.
 */
export const getRandomPresetColour = (presetColours: string[]) =>
  presetColours[Math.floor(Math.random() * presetColours.length)];

/**
 * Clamp a floating menu or picker back into the viewport.
 * @param position - The preferred floating position.
 * @param rect - The rendered element bounds.
 * @param padding - Minimum viewport padding.
 * @returns A viewport-safe floating position.
 */
export const fitFloatingPosition = (
  position: FloatingPosition,
  rect: DOMRect,
  padding = FLOATING_PADDING,
): FloatingPosition => {
  let nextLeft = position.left;
  let nextTop = position.top;

  if (rect.right > window.innerWidth - padding) {
    nextLeft = Math.max(padding, window.innerWidth - rect.width - padding);
  }
  if (rect.left < padding) {
    nextLeft = padding;
  }
  if (rect.bottom > window.innerHeight - padding) {
    nextTop = Math.max(padding, window.innerHeight - rect.height - padding);
  }
  if (rect.top < padding) {
    nextTop = padding;
  }

  return { left: nextLeft, top: nextTop };
};

/**
 * Calculate dropdown placement and height from the input element.
 * @param input - The category input element.
 * @returns Dropdown position and max height, or null when unavailable.
 */
export const getDropdownLayout = (
  input: HTMLInputElement | null,
): { position: DropdownPosition; maxHeight: number } | null => {
  if (!input) {
    return null;
  }

  const rect = input.getBoundingClientRect();
  const width = rect.width;
  const left = Math.min(
    Math.max(rect.left, FLOATING_PADDING),
    window.innerWidth - width - FLOATING_PADDING,
  );
  const spaceBelow = window.innerHeight - rect.bottom - FLOATING_PADDING;
  const spaceAbove = rect.top - FLOATING_PADDING;
  const useAbove =
    spaceBelow < DROPDOWN_PREFERRED_HEIGHT && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    DROPDOWN_MIN_HEIGHT,
    Math.min(
      DROPDOWN_PREFERRED_HEIGHT,
      useAbove ? spaceAbove : spaceBelow,
    ),
  );
  const top = useAbove
    ? rect.top - maxHeight - DROPDOWN_OFFSET
    : rect.bottom + DROPDOWN_OFFSET;

  return {
    position: { top, left, width },
    maxHeight,
  };
};

/**
 * Calculate the initial actions menu position from its trigger button.
 * @param target - The menu trigger button.
 * @returns The preferred screen position for the menu.
 */
export const getMenuPosition = (target: HTMLButtonElement): FloatingPosition => {
  const rect = target.getBoundingClientRect();
  const preferredLeft = rect.right - MENU_WIDTH;
  const left = Math.min(
    Math.max(preferredLeft, FLOATING_PADDING),
    window.innerWidth - MENU_WIDTH - FLOATING_PADDING,
  );
  const preferredTop = rect.bottom + DROPDOWN_OFFSET;
  const top = Math.min(
    Math.max(preferredTop, FLOATING_PADDING),
    window.innerHeight - MENU_ESTIMATED_HEIGHT - FLOATING_PADDING,
  );

  return { top, left };
};

/**
 * Calculate the initial custom colour picker position.
 * @param rect - The trigger element bounds.
 * @returns The preferred screen position for the picker.
 */
export const getPickerPosition = (rect: DOMRect): FloatingPosition => ({
  top: rect.top - PICKER_OFFSET,
  left: rect.left - PICKER_OFFSET,
});

/**
 * Parse a colour input string into a normalized hex value.
 * @param value - Raw colour input.
 * @returns A normalized hex colour or null when invalid.
 */
export const parseColourInput = (value: string): string | null =>
  normaliseHex(value) ?? rgbToHex(value);
