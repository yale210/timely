import { useEffect, useState } from "react";

interface XPBarProps {
  xp?: number;
  level?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const XPBar = ({ xp = 0, level = 1 }: XPBarProps) => {
  const nextLevel = Math.max(1, level + 1);
  const requiredExp = Math.round(100 * nextLevel ** 1.5);
  const progress = requiredExp > 0 ? clamp((xp / requiredExp) * 100, 0, 100) : 0;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setAnimatedProgress(0);
    const frame = window.requestAnimationFrame(() => {
      setAnimatedProgress(progress);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <div className="hidden sm:flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
      <div className="flex flex-col leading-none">
        <span className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Level</span>
        <span className="text-sm font-semibold text-gray-900">{level}</span>
      </div>
      <div className="w-32">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>EXP</span>
          <span>{xp}/{requiredExp}</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-white ring-1 ring-gray-200">
          <div
            className="h-2 rounded-full bg-cyan-500 transition-all duration-700"
            style={{ width: `${animatedProgress}%` }}
            data-testid="xp-bar-fill"
          />
        </div>
      </div>
    </div>
  );
};

export default XPBar;
