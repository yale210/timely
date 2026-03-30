import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";

import { PomodoroModal } from "@/components/layout/PomodoroModal";
import PomodoroTimerPanel from "@/components/pomodoro/PomodoroTimerPanel";
import { usePomodoro } from "@/context/PomodoroContext";
import AppLayout from "@/layouts/AppLayout";
import { getTasks, updateTask } from "@/services/taskService";
import type { Task } from "@/types";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";

/**
 * Dedicated Pomodoro page surfaced from the Extras section.
 */
const Pomodoro = () => {
  const {
    mode,
    isActive,
    initialDuration,
    shortBreakDuration,
    longBreakDuration,
    setInitialDuration,
    setShortBreakDuration,
    setLongBreakDuration,
  } = usePomodoro();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusInput, setFocusInput] = useState(String(initialDuration));
  const [shortBreakInput, setShortBreakInput] = useState(String(shortBreakDuration));
  const [longBreakInput, setLongBreakInput] = useState(String(longBreakDuration));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const openSettings = () => {
    setFocusInput(String(initialDuration));
    setShortBreakInput(String(shortBreakDuration));
    setLongBreakInput(String(longBreakDuration));
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setInitialDuration(Math.max(1, Number(focusInput) || initialDuration));
    setShortBreakDuration(Math.max(1, Number(shortBreakInput) || shortBreakDuration));
    setLongBreakDuration(Math.max(1, Number(longBreakInput) || longBreakDuration));
    setIsSettingsOpen(false);
  };

  const toggleTaskComplete = async (task: Task) => {
    const nextCompleted = !task.completed;

    setTasks((currentTasks) => currentTasks.map((currentTask) => (
      currentTask.id === task.id
        ? {
          ...currentTask,
          completed: nextCompleted,
        }
        : currentTask
    )));

    try {
      await updateTask(task.id, {
        completed: nextCompleted,
      });
    } catch {
      setTasks((currentTasks) => currentTasks.map((currentTask) => (
        currentTask.id === task.id
          ? {
            ...currentTask,
            completed: task.completed,
          }
          : currentTask
      )));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const nextTasks = await getTasks();
        if (!isMounted) {
          return;
        }
        setTasks(nextTasks);
      } catch {
        if (!isMounted) {
          return;
        }
        setTasks([]);
      } finally {
        if (isMounted) {
          setLoadingTasks(false);
        }
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingScheduledTasks = useMemo(() => {
    const now = Date.now();

    return tasks
      .filter((task) => !task.completed && (task.allocation?.length ?? 0) > 0)
      .map((task) => {
        const nextSlot = [...(task.allocation ?? [])]
          .map((slot) => ({
            start: new Date(slot.start).getTime(),
            end: new Date(slot.end).getTime(),
            rawStart: slot.start,
            rawEnd: slot.end,
          }))
          .filter((slot) => slot.end >= now)
          .sort((left, right) => left.start - right.start)[0];

        if (!nextSlot) {
          return null;
        }

        return {
          task,
          nextSlot,
        };
      })
      .filter((entry): entry is { task: Task; nextSlot: { start: number; end: number; rawStart: string; rawEnd: string } } => entry !== null)
      .sort((left, right) => left.nextSlot.start - right.nextSlot.start)
      .slice(0, 5);
  }, [tasks]);

  const formatSlotTime = (value: string) => (
    formatDateTimeInTimezone(value, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const pageBackground = useMemo(() => {
    if (!isActive) {
      return "radial-gradient(circle at top, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 34%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--text-color) 4%, var(--background)) 100%)";
    }

    if (mode === "focus") {
      return "radial-gradient(circle at top, rgba(249, 115, 22, 0.22) 0%, transparent 34%), linear-gradient(180deg, color-mix(in srgb, #f97316 10%, var(--background)) 0%, color-mix(in srgb, #f97316 18%, var(--background)) 100%)";
    }

    if (mode === "longBreak") {
      return "radial-gradient(circle at top, rgba(37, 99, 235, 0.2) 0%, transparent 34%), linear-gradient(180deg, color-mix(in srgb, #2563eb 10%, var(--background)) 0%, color-mix(in srgb, #2563eb 16%, var(--background)) 100%)";
    }

    return "radial-gradient(circle at top, rgba(20, 184, 166, 0.2) 0%, transparent 34%), linear-gradient(180deg, color-mix(in srgb, #14b8a6 10%, var(--background)) 0%, color-mix(in srgb, #14b8a6 16%, var(--background)) 100%)";
  }, [isActive, mode]);

  return (
    <AppLayout>
      <PomodoroModal />
      <div
        className="min-h-full"
        style={{
          background: pageBackground,
        }}
      >
        <header
          className="border-b border-gray-200 backdrop-blur"
          style={{
            backgroundColor: "color-mix(in srgb, var(--background) 92%, transparent)",
          }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-3 sm:flex-wrap sm:items-start sm:gap-4">
              <h1 className="text-2xl font-semibold text-black">Pomodoro</h1>
              <p className="text-right text-sm font-medium text-gray-500">
                {isActive ? "Running" : "Paused"} | {mode === "focus" ? "Focus period" : mode === "shortBreak" ? "Short break" : "Long break"}
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <PomodoroTimerPanel onOpenSettings={openSettings} />

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-black">Tasks</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {upcomingScheduledTasks.length}
                </span>
              </div>

              {loadingTasks ? (
                <p className="mt-5 text-sm text-gray-500">Loading scheduled tasks...</p>
              ) : upcomingScheduledTasks.length === 0 ? (
                <p className="mt-5 text-sm text-gray-500">No upcoming scheduled task blocks.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {upcomingScheduledTasks.map(({ task, nextSlot }) => (
                    <article
                      key={`${task.id}-${nextSlot.rawStart}`}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {
                              void toggleTaskComplete(task);
                            }}
                            className="task-circle-checkbox mt-0.5 text-cyan-600"
                          />
                          <div className="min-w-0">
                            <h3 className={`truncate text-sm font-semibold ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                              {task.title}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatSlotTime(nextSlot.rawStart)} to {formatSlotTime(nextSlot.rawEnd)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200">
                          {task.estimated_minutes} min
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <Transition show={isSettingsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsSettingsOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="w-full transform bg-white shadow-xl transition-all sm:max-w-md sm:rounded-2xl">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <DialogTitle className="text-lg font-semibold text-black">
                      Timer settings
                    </DialogTitle>
                  </div>

                  <div className="space-y-4 px-6 py-5">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">Focus period</span>
                      <input
                        type="number"
                        min="1"
                        value={focusInput}
                        onChange={(event) => setFocusInput(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">Short break</span>
                      <input
                        type="number"
                        min="1"
                        value={shortBreakInput}
                        onChange={(event) => setShortBreakInput(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">Long break</span>
                      <input
                        type="number"
                        min="1"
                        value={longBreakInput}
                        onChange={(event) => setLongBreakInput(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveSettings}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-300"
                    >
                      Save
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AppLayout>
  );
};

export default Pomodoro;
