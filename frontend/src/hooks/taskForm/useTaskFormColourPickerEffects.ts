import { useEffect, type RefObject } from "react";

type PickerPosition = {
    top: number;
    left: number;
} | null;

interface UseTaskColourPickerEffectArgs {
    showPickerMenu: boolean;
    pickerPosition: PickerPosition;
    pickerRef: RefObject<HTMLDivElement | null>;
    setShowPickerMenu: (value: boolean | ((prev: boolean) => boolean)) => void;
    setPickerPosition: (value: { top: number; left: number }) => void;
}

const getClampedPosition = (
    rect: DOMRect,
    position: { top: number; left: number },
) => {
    const padding = 8;
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
 * Keeps the task colour picker positioned on-screen and closes it on outside click.
 * @param root0 Hook arguments.
 * @param root0.showPickerMenu Whether the picker is currently open.
 * @param root0.pickerPosition The current picker position.
 * @param root0.pickerRef Ref for the picker element.
 * @param root0.setShowPickerMenu Updates the picker open state.
 * @param root0.setPickerPosition Updates the picker position.
 */
export default function useTaskColourPickerEffect({
    showPickerMenu,
    pickerPosition,
    pickerRef,
    setShowPickerMenu,
    setPickerPosition,
}: UseTaskColourPickerEffectArgs) {
    useEffect(() => {
        if (!showPickerMenu) return;

        const handleOutsideClick = (event: MouseEvent) => {
        if (pickerRef.current?.contains(event.target as Node)) return;
        setShowPickerMenu(false);
        };

        const raf = window.requestAnimationFrame(() => {
        if (!pickerRef.current || !pickerPosition) return;
        const rect = pickerRef.current.getBoundingClientRect();
        const nextPosition = getClampedPosition(rect, pickerPosition);
        if (nextPosition.left === pickerPosition.left && nextPosition.top === pickerPosition.top) return;
        setPickerPosition(nextPosition);
        });

        window.addEventListener("mousedown", handleOutsideClick);
        return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [showPickerMenu, pickerPosition, pickerRef, setShowPickerMenu, setPickerPosition]);
}