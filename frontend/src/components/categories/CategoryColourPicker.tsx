import { createPortal } from "react-dom";
import type { RefObject } from "react";
import { HexColorPicker } from "react-colorful";

interface CategoryColourPickerProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  pickerRef: RefObject<HTMLDivElement | null>;
  colourInput: string;
  colourError: string | null;
  currentColour: string;
  onColourInputChange: (value: string) => void;
  onColourErrorChange: (value: string | null) => void;
  onCommitInput: () => void;
  onSelect: () => void;
}

export const CategoryColourPicker = ({
  isOpen,
  position,
  pickerRef,
  colourInput,
  colourError,
  currentColour,
  onColourInputChange,
  onColourErrorChange,
  onCommitInput,
  onSelect,
}: CategoryColourPickerProps) => {
  if (!isOpen || !position || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[1000] w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
        Custom Colour
      </div>
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
            if (event.key !== "Enter") return;
            onCommitInput();
          }}
        />
        {colourError && (
          <div className="mt-1 text-[11px] text-red-600">{colourError}</div>
        )}
      </div>
      <div className="px-3 pb-3 flex justify-end">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <span className="material-icons text-[14px]">check</span>
          Select
        </button>
      </div>
    </div>,
    document.body,
  );
};
