import { Tooltip } from "@/components";
import type { MouseEvent as ReactMouseEvent } from "react";

interface EventFormColourProps {
    isColourLocked: boolean;
    handleColourPickerToggle: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    displayColour: string;
    baseInputClass: string;
    title: string;
    setTitle: (value: string) => void;
}

const getColourStyle = (isColourLocked: boolean, displayColour: string) => ({
    backgroundColor: isColourLocked ? "#e2e8f0" : displayColour,
});

const renderColourButton = (
    isColourLocked: boolean,
    handleColourPickerToggle: (event: ReactMouseEvent<HTMLButtonElement>) => void,
    displayColour: string,
) => (
    <button
        type="button"
        disabled={isColourLocked}
        onClick={handleColourPickerToggle}
        className="h-7 w-7 rounded-md border border-gray-300 p-0.5 disabled:cursor-not-allowed"
        style={getColourStyle(isColourLocked, displayColour)}
        aria-label="Event colour"
    />
);

/**
 * Renders the event title field together with the event colour control.
 * @param root0 - The props for the colour and title section.
 * @param root0.isColourLocked - Whether the colour picker is locked by a category override.
 * @param root0.handleColourPickerToggle - Opens or closes the colour picker menu.
 * @param root0.displayColour - The colour currently displayed for the event.
 * @param root0.baseInputClass - The shared base class applied to the title input.
 * @param root0.title - The current event title value.
 * @param root0.setTitle - Updates the event title value.
 * @returns The rendered colour and title section.
 */
export default function EventFormColour({
    isColourLocked,
    handleColourPickerToggle,
    displayColour,
    baseInputClass,
    title,
    setTitle,
}: EventFormColourProps) {
    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-2">
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
                Title
            </label>
            <div className="flex items-center">
                {isColourLocked ? (
                <Tooltip content="Category colour override set. To set a custom colour, uncheck category colour override.">
                    {renderColourButton(isColourLocked, handleColourPickerToggle, displayColour)}
                </Tooltip>
                ) : (
                renderColourButton(isColourLocked, handleColourPickerToggle, displayColour)
                )}
            </div>
            </div>
            <input
            id="event-title"
            className={baseInputClass}
            placeholder="Event title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            />
        </div>
    );
}