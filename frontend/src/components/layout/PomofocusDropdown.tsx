import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { usePomodoro } from "@/context/PomodoroContext";
import { formatTime } from "@/utils/timeUtils";
import { convertMinutesToHHMM, convertHHMMToMinutes, parseAndValidateHHMM } from "@/utils/timeFormatters";
import { PlayIcon, PauseIcon, ArrowPathIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

/**
 * Dropdown component for the Pomofocus timer in the navbar.
 */
export const PomofocusDropdown = () => {
  const {
    timeLeft,
    initialDuration,
    isActive,
    mode,
    viewingMode,
    setInitialDuration,
    startTimer,
    stopTimer,
    resetTimer,
    adjustTime,
    setMode,
  } = usePomodoro();

  const [hh, setHH] = useState("");
  const [mm, setMM] = useState("");

  // Update local HH:MM when initialDuration or viewingMode changes
  useEffect(() => {
    if (viewingMode === "focus") {
      const totalMins = typeof initialDuration === "number" ? initialDuration : 0;
      const { hours, minutes } = convertMinutesToHHMM(totalMins);
      setHH(hours.toString().padStart(2, "0"));
      setMM(minutes.toString().padStart(2, "0"));
    }
  }, [initialDuration, viewingMode]);

  const handleHHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setHH(val);
      const h = val === "" ? 0 : parseInt(val, 10);
      const m = mm === "" ? 0 : parseInt(mm, 10);
      setInitialDuration(convertHHMMToMinutes(h, m));
    }
  };

  const handleMMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setMM(val);
      const h = hh === "" ? 0 : parseInt(hh, 10);
      const m = val === "" ? 0 : parseInt(val, 10);
      setInitialDuration(convertHHMMToMinutes(h, m));
    }
  };

  const handleBlur = () => {
    const finalMins = parseAndValidateHHMM(hh, mm);
    setInitialDuration(finalMins);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isActive) {
        stopTimer();
      } else {
        startTimer();
      }
    }
  };

  return (
    <Menu as="div" className="relative flex h-8 items-center">
      <MenuButton className="inline-flex h-8 items-center justify-center gap-2 rounded-md px-2.5 py-0 text-sm font-semibold leading-none text-gray-900 hover:bg-gray-100 focus:outline-none">
        Pomofocus
      </MenuButton>

      <MenuItems
        modal={false}
        className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-lg border border-gray-200 bg-white p-4 shadow-lg focus:outline-none z-50"
      >
        <div className="flex flex-col gap-4">
          {/* Mode Selector */}
          <div className="flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setMode("focus")}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                viewingMode === "focus" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pomofocus
            </button>
            <button
              onClick={() => setMode("break")}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                viewingMode === "break" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Short Break
            </button>
          </div>

          {/* Timer Display & Input */}
          <div className="flex flex-col items-center gap-2">
            {viewingMode === mode && !isActive && viewingMode === "focus" ? (
              <div className="flex items-center gap-1 font-mono text-4xl font-bold text-gray-800">
                <input
                  type="text"
                  inputMode="numeric"
                  value={hh}
                  onChange={handleHHChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  className="w-14 rounded border border-gray-300 p-1 text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="00"
                />
                <span>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={mm}
                  onChange={handleMMChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  className="w-14 rounded border border-gray-300 p-1 text-center focus:border-cyan-500 focus:outline-none"
                  placeholder="00"
                />
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <span className="font-mono text-4xl font-bold text-gray-800">
                  {viewingMode === mode ? formatTime(timeLeft) : (viewingMode === "focus" ? formatTime((typeof initialDuration === 'number' ? initialDuration : 25) * 60) : "05:00")}
                </span>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      viewingMode === "focus" ? "bg-orange-500" : "bg-teal-500"
                    }`}
                    style={{
                      width: viewingMode === mode ? `${(timeLeft / (mode === "focus" ? (typeof initialDuration === 'number' ? initialDuration : 25) * 60 : 300)) * 100}%` : '100%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustTime(-300)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="-5 mins"
            >
              <MinusIcon className="h-5 w-5" />
            </button>

            <button
              onClick={isActive && viewingMode === mode ? stopTimer : startTimer}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${
                isActive && viewingMode === mode ? "bg-red-500" : "bg-cyan-600"
              }`}
              title={isActive && viewingMode !== mode ? `Switch to ${viewingMode}` : (isActive ? "Stop" : "Start")}
            >
              {isActive && viewingMode === mode ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>

            <button
              onClick={() => adjustTime(300)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="+5 mins"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={resetTimer}
            className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowPathIcon className="h-3 w-3" />
            Restart
          </button>
        </div>
      </MenuItems>
    </Menu>
  );
};
