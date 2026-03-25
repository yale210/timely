import { useEffect, useRef, useState, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }
    // Wait one frame so the tooltip can measure its rendered size before we clamp it to the viewport.
    const raf = window.requestAnimationFrame(() => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;
      const gap = 12;
      let left: number;
      let top: number;

      if (cursorPosition) {
        left = cursorPosition.x + gap;
        top = cursorPosition.y + gap;
      } else {
        const child = triggerRef.current.firstElementChild as HTMLElement | null;
        const rect = (child ?? triggerRef.current).getBoundingClientRect();
        left = rect.right + gap;
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
      }

      // Keep the tooltip inside the viewport when the trigger sits near an edge.
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setPosition({ left, top });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [content, cursorPosition, isOpen]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseMove={(event) => {
        setCursorPosition({ x: event.clientX, y: event.clientY });
      }}
      onMouseLeave={() => {
        setIsOpen(false);
        setPosition(null);
        setCursorPosition(null);
      }}
      onFocus={() => {
        setCursorPosition(null);
        setIsOpen(true);
      }}
      onBlur={() => {
        setIsOpen(false);
        setPosition(null);
        setCursorPosition(null);
      }}
    >
      {children}
      {isOpen && (
        <span
          ref={tooltipRef}
          className="fixed z-[1000] max-w-80 whitespace-normal break-words rounded-md border px-3 py-2 text-[11px] leading-snug shadow-sm"
          style={{
            left: position?.left,
            top: position?.top,
            maxWidth: 320,
            backgroundColor: "var(--background)",
            color: "var(--text-color)",
            borderColor: "var(--border)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
