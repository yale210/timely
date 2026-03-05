import { useEffect, useRef, useState, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const child = triggerRef.current.firstElementChild as HTMLElement | null;
      const rect = (child ?? triggerRef.current).getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      const gap = 2;
      let top = rect.bottom - tooltipRect.height - gap;

      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setPosition({ left, top });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen, content]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      {isOpen && (
        <span
          ref={tooltipRef}
          className="fixed z-[1000] max-w-60 whitespace-normal break-words rounded-md border px-2 py-1 text-[11px] leading-snug shadow-sm"
          style={{
            left: position?.left,
            top: position?.top,
            maxWidth: 240,
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
