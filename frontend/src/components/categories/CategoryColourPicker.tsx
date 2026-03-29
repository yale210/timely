import { createPortal } from "react-dom";
import type { RefObject } from "react";
import { HexColorPicker } from "react-colorful";
import type { FloatingPosition } from "./CategoryMultiSelect.types";

/**
 * Props for the category colour picker.
 * @param root0 - Component props.
 * @param root0.isOpen - Whether the picker is visible.
 * @param root0.position - The screen position for the picker.
 * @param root0.pickerRef - Ref for the picker container.
 * @param root0.colourInput - The current colour input value.
 * @param root0.colourError - Current validation error.
 * @param root0.currentColour - The colour shown in the picker.
 * @param root0.onColourInputChange - Updates the colour input.
 * @param root0.onColourErrorChange - Updates the colour error.
 * @param root0.onCommitInput - Validates and commits the input.
 * @param root0.onSelect - Confirms the selected colour.
 */
interface CategoryColourPickerProps {
  isOpen: boolean;
  position: FloatingPosition | null;
  pickerRef: RefObject<HTMLDivElement | null>;
  colourInput: string;
  colourError: string | null;
  currentColour: string;
  onColourInputChange: (value: string) => void;
  onColourErrorChange: (value: string | null) => void;
  onCommitInput: () => void;
  onSelect: () => void;
}

const ColourPickerHeader = ({ onSelect }: { onSelect: () => void }) => (
  <div className="flex items-center justify-between px-3 py-2">
    <div className="text-xs font-semibold text-gray-500 uppercase">
      Custom Colour
    </div>
    <button
      type="button"
      onClick={onSelect}
      className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
    >
      Select
    </button>
  </div>
);

const ColourPickerGrid = ({
  currentColour,
  onColourInputChange,
  onColourErrorChange,
}: {
  currentColour: string;
  onColourInputChange: (value: string) => void;
  onColourErrorChange: (value: string | null) => void;
}) => (
  <div className="px-3 pb-3">
    <div className="rounded-lg border border-gray-200 bg-white p-2 overflow-hidden">
      <HexColorPicker
        color={currentColour}
        onChange={(value) => {
          onColourInputChange(value);
          onColourErrorChange(null);
        }}
        style={{ width: "100%", height: "160px" }}
        className="rounded-md"
      />
    </div>
  </div>
);

const ColourInputSection = ({
  colourInput,
  colourError,
  onColourInputChange,
  onColourErrorChange,
  onCommitInput,
}: {
  colourInput: string;
  colourError: string | null;
  onColourInputChange: (value: string) => void;
  onColourErrorChange: (value: string | null) => void;
  onCommitInput: () => void;
}) => (
  <div className="px-3 pb-3">
    <input
      type="text"
      value={colourInput}
      onChange={(event) => {
        onColourInputChange(event.target.value);
        onColourErrorChange(null);
      }}
      placeholder="Hex (#RRGGBB) or rgb(...)"
      className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700"
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommitInput();
      }}
    />
    {colourError && (
      <div className="mt-1 text-[11px] text-red-600">{colourError}</div>
    )}
  </div>
);

const ColourPickerBody = ({
  currentColour,
  colourInput,
  colourError,
  onColourInputChange,
  onColourErrorChange,
  onCommitInput,
  onSelect,
}: Omit<CategoryColourPickerProps, "isOpen" | "position" | "pickerRef">) => (
  <>
    <ColourPickerHeader onSelect={onSelect} />
    <ColourPickerGrid
      currentColour={currentColour}
      onColourInputChange={onColourInputChange}
      onColourErrorChange={onColourErrorChange}
    />
    <ColourInputSection
      colourInput={colourInput}
      colourError={colourError}
      onColourInputChange={onColourInputChange}
      onColourErrorChange={onColourErrorChange}
      onCommitInput={onCommitInput}
    />
  </>
);

/**
 * Renders the custom colour picker popover.
 * @param root0 - Component props.
 * @param root0.isOpen - Whether the picker is visible.
 * @param root0.position - The screen position for the picker.
 * @param root0.pickerRef - Ref for the picker container.
 * @param root0.colourInput - The current colour input value.
 * @param root0.colourError - Current validation error.
 * @param root0.currentColour - The colour shown in the picker.
 * @param root0.onColourInputChange - Updates the colour input.
 * @param root0.onColourErrorChange - Updates the colour error.
 * @param root0.onCommitInput - Validates and commits the input.
 * @param root0.onSelect - Confirms the selected colour.
 */
export const CategoryColourPicker = ({
  isOpen,
  position,
  pickerRef,
  ...props
}: CategoryColourPickerProps) => {
  if (!isOpen || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-1000 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ColourPickerBody {...props} />
    </div>,
    document.body,
  );
};
