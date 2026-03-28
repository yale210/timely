import { Tooltip } from "@/components";
import type { MouseEvent as ReactMouseEvent } from "react";

interface Props {
    isColourLocked: boolean;
    displayColour: string;
    handleColourPickerToggle: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    title: string;
    setTitle: (value: string) => void;
    baseInputClass: string;
    errorClass: string;
    hasTitleError?: boolean;
}

interface ColourButtonProps {
    locked: boolean;
    colour: string;
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

const getColourStyle = (locked: boolean, colour: string) => ({
    backgroundColor: locked ? "#e2e8f0" : colour,
});

function ColourButton({ locked, colour, onClick }: ColourButtonProps) {
    return (
        <button
        type="button"
        disabled={locked}
        onClick={onClick}
        className="h-7 w-7 rounded-md border border-gray-300 p-0.5 disabled:cursor-not-allowed"
        style={getColourStyle(locked, colour)}
        aria-label="Task colour"
        />
    );
}

/**
 * Renders the title input and colour selector for the task form.
 * @param props The component props.
 * @param props.isColourLocked Whether the selected category override locks the colour picker.
 * @param props.displayColour The colour currently shown to the user.
 * @param props.handleColourPickerToggle Opens or closes the colour picker.
 * @param props.title The current task title.
 * @param props.setTitle Updates the task title.
 * @param props.baseInputClass Base styling for the title input.
 * @param props.errorClass Error styling for invalid title state.
 * @param props.hasTitleError Indicates whether the title input has a server-side error.
 * @returns The title and colour header section of the task form.
 */
export default function TaskFormHeader({
    isColourLocked,
    displayColour,
    handleColourPickerToggle,
    title,
    setTitle,
    baseInputClass,
    errorClass,
    hasTitleError = false,
}: Props) {
    return (
        <div>
        <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="task-title" className="text-sm font-medium text-gray-700">
            Title
            </label>

            {isColourLocked ? (
            <Tooltip content="Category colour override set. To set a custom colour, uncheck category colour override.">
                <ColourButton
                locked
                colour={displayColour}
                onClick={handleColourPickerToggle}
                />
            </Tooltip>
            ) : (
            <ColourButton
                locked={false}
                colour={displayColour}
                onClick={handleColourPickerToggle}
            />
            )}
        </div>

        <input
            id="task-title"
            className={`${baseInputClass} ${hasTitleError ? errorClass : ""}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
        />
        </div>
    );
}
