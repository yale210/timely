import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { usePomodoro } from "@/context/PomodoroContext";
import { formatTime } from "@/utils/timeUtils";
import { PlayIcon, PauseIcon, ArrowPathIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

/**
 * Dropdown component for the Pomofocus timer in the navbar.
 */
export const PomofocusDropdown = () => {
  const {
    timeLeft,
    initialDuration,
    isActive,
    mode,
    setInitialDuration,
    startTimer,
    stopTimer,
    resetTimer,
    adjustTime,
    setMode,
  } = usePomodoro();

  const handleInitialDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setInitialDuration("");
      return;
    }
    const numericVal = parseInt(val, 10);
    if (!isNaN(numericVal)) {
      setInitialDuration(numericVal);
    }
  };

  const handleBlur = () => {
    if (initialDuration === "") {
      setInitialDuration(1);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
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
                mode === "focus" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pomofocus
            </button>
            <button
              onClick={() => setMode("break")}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                mode === "break" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Short Break
            </button>
          </div>

          {/* Timer Display & Input */}
          <div className="flex flex-col items-center gap-2">
            {mode === "focus" && !isActive ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialDuration}
                  onChange={handleInitialDurationChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  className="w-24 rounded border border-gray-300 pr-10 pl-2 py-1 text-center font-mono text-xl focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-3 text-xs font-medium text-gray-400 pointer-events-none">mins</span>
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <span className="font-mono text-4xl font-bold text-gray-800">
                  {formatTime(timeLeft)}
                </span>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      mode === "focus" ? "bg-orange-500" : "bg-teal-500"
                    }`}
                    style={{
                      width: `${(timeLeft / (mode === "focus" ? initialDuration * 60 : 300)) * 100}%`,
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
              onClick={isActive ? stopTimer : startTimer}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${
                isActive ? "bg-red-500" : "bg-cyan-600"
              }`}
            >
              {isActive ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
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
