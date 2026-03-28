/**
 * Colour parsing logic shared for taks and events.
 * @param value A string representing a colour in one of several formats.
 * @returns A string purely in the RGB format.
 */
export function parseColourInput(value: string): string | null {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.startsWith("#") && trimmed.length === 7) {
        return trimmed;
    }

    const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
        .exec(trimmed);

    if (!match) return null;

    const [r, g, b] = match.slice(1).map(clampRgbValue);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clampRgbValue(value: string) {
    return Math.min(255, Math.max(0, Number(value)));
}

function toHex(value: number) {
    return value.toString(16).padStart(2, "0");
}