import { useEffect, useMemo, useRef, useState } from "react";
import { XP_GAINED_EVENT, type XpGainedDetail } from "@/utils/xpEvents";

interface ToastState {
  amount: number;
  id: number;
}

const XPToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const message = useMemo(() => {
    if (!toast) return "";
    return `+${toast.amount} XP`;
  }, [toast]);

  useEffect(() => {
    const handleXpGained = (event: Event) => {
      const detail = (event as CustomEvent<XpGainedDetail>).detail;
      if (!detail?.amount) return;

      setToast({ amount: detail.amount, id: Date.now() });
      setIsVisible(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 2200);
    };

    window.addEventListener(XP_GAINED_EVENT, handleXpGained);
    return () => {
      window.removeEventListener(XP_GAINED_EVENT, handleXpGained);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-40">
      <div
        key={toast.id}
        className={`flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-lg transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <span className="material-icons text-base">auto_awesome</span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default XPToast;
