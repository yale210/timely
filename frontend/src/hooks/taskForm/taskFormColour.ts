import { getOverrideColour } from "@/utils/colorUtils";
import type { Category } from "@/types";

/**
 * Returns only selected categories.
 * @param categories All valid categories.
 * @param selectedCategoryIds list of ids of selected categories.
 * @returns List of selected categories as Category[].
 */
export function getSelectedCategoryObjects(
    categories: Category[],
    selectedCategoryIds: number[],
) {
    return categories.filter((category) => selectedCategoryIds.includes(category.id));
}

/**
 * Creates TaskForm states relating to colour.
 * @param categories All categories.
 * @param selectedCategoryIds Selected category ids.
 * @param colour String of colour to be shown if no override.
 * @returns States relating to colour.
 */
export function getTaskFormColourState(
    categories: Category[],
    selectedCategoryIds: number[],
    colour: string,
) {
    const selectedCategoryObjects = getSelectedCategoryObjects(
        categories,
        selectedCategoryIds,
    );
    const overrideColour = getOverrideColour(selectedCategoryObjects);
    const isColourLocked = Boolean(overrideColour);
    const displayColour = overrideColour ?? colour;

    return {
        selectedCategoryObjects,
        overrideColour,
        isColourLocked,
        displayColour,
    };
}

/**
 * Builds an object of the picker's position from a DOMrect.
 * @param rect DOMrect representing the colour picker.
 */
export function buildPickerPosition(rect: DOMRect) {
    return {
        top: rect.bottom + 8,
        left: rect.right - 272,
    };
}