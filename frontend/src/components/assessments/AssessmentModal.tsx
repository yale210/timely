import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";

import { Tooltip } from "@/components";
import { hexToRgba } from "@/utils/colorUtils";
import type { Assessment, AssessmentSubmission, AssessmentType, Category } from "@/types";
import {
  getStoredUserTimezone,
  timezoneDateTimeLocalToIso,
  toTimezoneDateTimeLocalValue,
} from "@/utils/userTimezone";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment?: Assessment;
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  onSubmit: (data: AssessmentSubmission) => Promise<void>;
  onDelete: () => void;
}

type AssessmentMode = "DEADLINE" | "EVENT";

const flattenErrorMessages = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenErrorMessages);
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => (
      flattenErrorMessages(nestedValue).map((message) => `${key}: ${message}`)
    ));
  }
  return [];
};

const getSubmissionErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response;
    if (response && typeof response === "object" && "data" in response) {
      const messages = flattenErrorMessages(response.data);
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Failed to save assessment.";
};

const AssessmentModal = ({
  isOpen,
  onClose,
  assessment,
  categories,
  onSubmit,
  onDelete,
}: AssessmentModalProps) => {
  const userTimezone = getStoredUserTimezone();
  const [title, setTitle] = useState(assessment?.title ?? "");
  const [assessmentType] = useState<AssessmentType>(assessment?.assessment_type ?? "OTHER");
  const [dueDate, setDueDate] = useState(toTimezoneDateTimeLocalValue(assessment?.due_date, userTimezone));
  const [weighting, setWeighting] = useState<number | "">(assessment?.weighting_of_assessment ?? "");
  const [notes, setNotes] = useState(assessment?.notes ?? "");
  const [assessmentCategoryId, setAssessmentCategoryId] = useState<number | "">(assessment?.assessment_category?.id ?? "");
  const [moduleCategoryId, setModuleCategoryId] = useState<number | "">(assessment?.module_category?.id ?? "");
  const [mode, setMode] = useState<AssessmentMode>(assessment?.linked_event_details ? "EVENT" : "DEADLINE");
  const [eventStart, setEventStart] = useState(toTimezoneDateTimeLocalValue(assessment?.linked_event_details?.start_time, userTimezone));
  const [eventEnd, setEventEnd] = useState(toTimezoneDateTimeLocalValue(assessment?.linked_event_details?.end_time, userTimezone));
  const [eventLocation, setEventLocation] = useState(assessment?.linked_event_details?.location ?? "");
  const [error, setError] = useState<string | null>(null);
  const formKey = assessment ? `${assessment.id}-${assessment.updated_at}` : "new";

  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none";
  const canDelete = Boolean(assessment?.id);
  const selectedAssessmentCategory = useMemo(
    () => categories.find((category) => category.id === assessmentCategoryId),
    [assessmentCategoryId, categories],
  );
  const selectedModuleCategory = useMemo(
    () => categories.find((category) => category.id === moduleCategoryId),
    [moduleCategoryId, categories],
  );

  const getCategorySelectStyle = (category?: Category) => {
    if (!category?.colour) {
      return undefined;
    }

    return {
      borderColor: category.colour,
      boxShadow: `inset 0 0 0 1px ${hexToRgba(category.colour, 0.2)}`,
    };
  };

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (mode === "DEADLINE" && !dueDate) {
      setError("Due date is required.");
      return;
    }
    if (mode === "EVENT") {
      if (!eventStart || !eventEnd) {
        setError("Start and end time are required when calendar event is enabled.");
        return;
      }
      if (new Date(eventEnd).getTime() <= new Date(eventStart).getTime()) {
        setError("Calendar event end time must be after start time.");
        return;
      }
    }

    const mergedCategories = [...new Set(
      [assessmentCategoryId, moduleCategoryId]
        .filter((value): value is number => typeof value === "number"),
    )];

    try {
      await onSubmit({
        title: title.trim(),
        assessment_type: assessmentType,
        due_date: timezoneDateTimeLocalToIso(mode === "EVENT" ? eventStart : dueDate, userTimezone),
        length_of_assessment: null,
        weighting_of_assessment: typeof weighting === "number" ? weighting : 0,
        notes: notes.trim(),
        reminder_offset: null,
        assessment_category: typeof assessmentCategoryId === "number" ? assessmentCategoryId : null,
        module_category: typeof moduleCategoryId === "number" ? moduleCategoryId : null,
        categories: mergedCategories,
        completed: assessment?.completed ?? false,
        event_details: mode === "EVENT"
          ? {
              start_time: timezoneDateTimeLocalToIso(eventStart, userTimezone),
              end_time: timezoneDateTimeLocalToIso(eventEnd, userTimezone),
              location: eventLocation.trim(),
            }
          : null,
      });

      onClose();
    } catch (submitError) {
      setError(getSubmissionErrorMessage(submitError));
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
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
              <DialogPanel className="w-full transform bg-white shadow-xl transition-all sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl">
                <form key={formKey} onSubmit={(event) => void handleSubmit(event)} className="flex max-h-[100dvh] flex-col sm:max-h-[90vh]">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-lg font-semibold text-black">
                        {assessment ? "Edit assessment" : "New assessment"}
                      </DialogTitle>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={onDelete}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Delete assessment"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <span className="material-icons text-lg">close</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    {error ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </div>
                    ) : null}

                    <div className="rounded-xl border border-gray-200 p-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { value: "DEADLINE", label: "Deadline assessment", description: "Tracked by due date only." },
                          { value: "EVENT", label: "Event assessment", description: "Scheduled with a calendar event." },
                        ].map((option) => {
                          const isActive = mode === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setMode(option.value as AssessmentMode)}
                              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                isActive
                                  ? "border-primary bg-blue-50 text-black"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <div className="text-sm font-semibold">{option.label}</div>
                              <div className="mt-1 text-xs text-gray-500">{option.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="assessment-title" className="mb-2 block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        id="assessment-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className={baseInputClass}
                        placeholder="Assessment title"
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <label htmlFor="assessment-category" className="block text-sm font-medium text-gray-700">
                            Assessment type
                          </label>
                          <Tooltip content="Select from your existing categories. Create or edit categories from tasks, calendar, or settings first.">
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                              aria-label="Explain assessment category"
                            >
                              ?
                            </button>
                          </Tooltip>
                        </div>
                        <select
                          id="assessment-category"
                          value={assessmentCategoryId}
                          onChange={(event) => setAssessmentCategoryId(
                            event.target.value === "" ? "" : Number(event.target.value),
                          )}
                          className={baseInputClass}
                          style={getCategorySelectStyle(selectedAssessmentCategory)}
                        >
                          <option value="">None</option>
                          {categories.map((category) => (
                            <option
                              key={category.id}
                              value={category.id}
                              style={category.colour ? { backgroundColor: hexToRgba(category.colour, 0.18) } : undefined}
                            >
                              {category.text}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <label htmlFor="assessment-module" className="block text-sm font-medium text-gray-700">
                            Subject / module
                          </label>
                          <Tooltip content="Select from your existing categories. Use a category you already created for your subject or module.">
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                              aria-label="Explain subject or module"
                            >
                              ?
                            </button>
                          </Tooltip>
                        </div>
                        <select
                          id="assessment-module"
                          value={moduleCategoryId}
                          onChange={(event) => setModuleCategoryId(
                            event.target.value === "" ? "" : Number(event.target.value),
                          )}
                          className={baseInputClass}
                          style={getCategorySelectStyle(selectedModuleCategory)}
                        >
                          <option value="">None</option>
                          {categories.map((category) => (
                            <option
                              key={category.id}
                              value={category.id}
                              style={category.colour ? { backgroundColor: hexToRgba(category.colour, 0.18) } : undefined}
                            >
                              {category.text}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {mode === "DEADLINE" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="assessment-due-date" className="mb-2 block text-sm font-medium text-gray-700">
                          Due date
                        </label>
                        <input
                          id="assessment-due-date"
                          type="datetime-local"
                          value={dueDate}
                          onChange={(event) => setDueDate(event.target.value)}
                          className={baseInputClass}
                          required
                        />
                        </div>
                        <div>
                          <label htmlFor="assessment-weighting" className="mb-2 block text-sm font-medium text-gray-700">
                            Weighting %
                          </label>
                          <input
                            id="assessment-weighting"
                            type="number"
                            min="0"
                            max="100"
                            value={String(weighting)}
                            onChange={(event) => setWeighting(event.target.value === "" ? "" : Number(event.target.value))}
                            className={baseInputClass}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label htmlFor="assessment-notes" className="mb-2 block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="assessment-notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        className={`${baseInputClass} resize-none`}
                        placeholder="Optional notes"
                      />
                    </div>

                    {mode === "EVENT" ? (
                      <div className="rounded-xl border border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-medium text-gray-900">Event details</p>
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            Event
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <div>
                            <label htmlFor="assessment-weighting" className="mb-2 block text-sm font-medium text-gray-700">
                              Weighting %
                            </label>
                            <input
                              id="assessment-weighting"
                              type="number"
                              min="0"
                              max="100"
                              value={String(weighting)}
                              onChange={(event) => setWeighting(event.target.value === "" ? "" : Number(event.target.value))}
                              className={baseInputClass}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="assessment-event-start" className="mb-2 block text-sm font-medium text-gray-700">
                                Start
                              </label>
                              <input
                                id="assessment-event-start"
                                type="datetime-local"
                                value={eventStart}
                                onChange={(event) => setEventStart(event.target.value)}
                                className={baseInputClass}
                                required={mode === "EVENT"}
                              />
                            </div>
                            <div>
                              <label htmlFor="assessment-event-end" className="mb-2 block text-sm font-medium text-gray-700">
                                End
                              </label>
                              <input
                                id="assessment-event-end"
                                type="datetime-local"
                                value={eventEnd}
                                onChange={(event) => setEventEnd(event.target.value)}
                                className={baseInputClass}
                                required={mode === "EVENT"}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="assessment-event-location" className="mb-2 block text-sm font-medium text-gray-700">
                              Location
                            </label>
                            <input
                              id="assessment-event-location"
                              value={eventLocation}
                              onChange={(event) => setEventLocation(event.target.value)}
                              className={baseInputClass}
                              placeholder="Optional location"
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-300"
                    >
                      Save assessment
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AssessmentModal;
