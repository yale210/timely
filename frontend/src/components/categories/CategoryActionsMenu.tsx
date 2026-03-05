import { useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { Category } from "@/types";
import { Tooltip } from "@/components";

interface CategoryActionsMenuProps {
  openMenuId: number | null;
  menuPosition: { top: number; left: number } | null;
  menuRef: RefObject<HTMLDivElement | null>;
  menuCategory?: Category;
  presetColours: string[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => void;
  onClose: () => void;
  onTogglePicker: (rect: DOMRect) => void;
}

export const CategoryActionsMenu = ({
  openMenuId,
  menuPosition,
  menuRef,
  menuCategory,
  presetColours,
  onDelete,
  onUpdate,
  onClose,
  onTogglePicker,
}: CategoryActionsMenuProps) => {
  const plusButtonRef = useRef<HTMLButtonElement | null>(null);

  if (openMenuId === null || !menuPosition || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-1000 w-44 rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          onDelete(openMenuId);
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <span className="material-icons text-base">delete</span>
        Delete
      </button>
      <div className="my-1 border-t border-gray-200" />
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
        Colours
      </div>
      <div className="grid grid-cols-6 gap-2 px-3 pb-3">
        {presetColours.map((colour) => (
          <button
            key={colour}
            type="button"
            aria-label={`Set colour ${colour}`}
            onClick={() => onUpdate(openMenuId, { colour })}
            className="h-5 w-5 rounded-full border border-gray-200"
            style={{ backgroundColor: colour }}
          />
        ))}
        <button
          ref={plusButtonRef}
          type="button"
          aria-label="Custom colour"
          onClick={() => {
            const rect = plusButtonRef.current?.getBoundingClientRect();
            if (!rect) return;
            onTogglePicker(rect);
          }}
          className="h-5 w-5 rounded-full border border-gray-200 bg-white flex items-center justify-center"
        >
          <span className="text-[20px] leading-none text-gray-600">+</span>
        </button>
      </div>
      <div className="my-1 border-t border-gray-200" />
      <label className="flex items-center gap-2 px-3 pt-2 pb-3 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(menuCategory?.colour_override)}
          onChange={(event) => {
            onUpdate(openMenuId, { colour_override: event.target.checked });
          }}
          className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-400"
        />
        <span className="flex items-center gap-1">
          Colour override
          <Tooltip content="When enabled, tasks/events using this category inherit its colour.">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[11px] font-semibold text-gray-600 ml-2 cursor-help"
            >
              ?
            </span>
          </Tooltip>
        </span>
      </label>
    </div>,
    document.body,
  );
};
