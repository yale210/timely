import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";

import type { Assessment, AssessmentSubmission, AssessmentType, Category } from "@/types";
import {
  getStoredUserTimezone,
  timezoneDateTimeLocalToIso,
  toTimezoneDateTimeLocalValue,
} from "@/utils/userTimezone";
import AssessmentCategorySelect from "@/components/assessments/AssessmentCategorySelect";
import AssessmentDeadlineFields from "@/components/assessments/AssessmentDeadlineFields";
import AssessmentEventSection from "@/components/assessments/AssessmentEventSection";
import AssessmentModeSelector from "@/components/assessments/AssessmentModeSelector";
import {
  getSubmissionErrorMessage,
  type AssessmentMode,
} from "@/components/assessments/assessmentModalUtils";

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

  if (!isOpen) {
    return null;
  }

  const validateAssessmentForm = (): string | null => {
    if (!title.trim()) {
      return "Title is required.";
    }
    if (mode === "DEADLINE" && !dueDate) {
      return "Due date is required.";
    }
    if (mode !== "EVENT") {
      return null;
    }
    if (!eventStart || !eventEnd) {
        return "Start and end time are required when calendar event is enabled.";
    }
    if (new Date(eventEnd).getTime() <= new Date(eventStart).getTime()) {
        return "Calendar event end time must be after start time.";
    }
    return null;
  };



  const getMergedCategories = (): number[] => {
    return [...new Set(
      [assessmentCategoryId, moduleCategoryId]
        .filter((value): value is number => typeof value === "number"),
    )];
  };


  const buildAssessmentSubmission = (): AssessmentSubmission => {
    return {
        title: title.trim(),
        assessment_type: assessmentType,
        due_date: timezoneDateTimeLocalToIso(mode === "EVENT" ? eventStart : dueDate, userTimezone),
        length_of_assessment: null,
        weighting_of_assessment: typeof weighting === "number" ? weighting : 0,
        notes: notes.trim(),
        reminder_offset: null,
        assessment_category: typeof assessmentCategoryId === "number" ? assessmentCategoryId : null,
        module_category: typeof moduleCategoryId === "number" ? moduleCategoryId : null,
        categories: getMergedCategories(),
        completed: assessment?.completed ?? false,
        event_details: mode === "EVENT"
          ? {
              start_time: timezoneDateTimeLocalToIso(eventStart, userTimezone),
              end_time: timezoneDateTimeLocalToIso(eventEnd, userTimezone),
              location: eventLocation.trim(),
            }
          : null,
      
    };
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const validationError = validateAssessmentForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(buildAssessmentSubmission());
      onClose();
    } catch (submitError) {
      setError(getSubmissionErrorMessage(submitError));
    }
  }
    

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

                    <AssessmentModeSelector mode={mode} onChange={setMode} />

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
                      <AssessmentCategorySelect
                        id="assessment-category"
                        label="Assessment type"
                        tooltip="Select from your existing categories. Create or edit categories from tasks, calendar, or settings first."
                        value={assessmentCategoryId}
                        categories={categories}
                        category={selectedAssessmentCategory}
                        inputClassName={baseInputClass}
                        ariaLabel="Explain assessment category"
                        onChange={setAssessmentCategoryId}
                      />
                      <AssessmentCategorySelect
                        id="assessment-module"
                        label="Subject / module"
                        tooltip="Select from your existing categories. Use a category you already created for your subject or module."
                        value={moduleCategoryId}
                        categories={categories}
                        category={selectedModuleCategory}
                        inputClassName={baseInputClass}
                        ariaLabel="Explain subject or module"
                        onChange={setModuleCategoryId}
                      />
                    </div>

                    {mode === "DEADLINE" ? (
                      <AssessmentDeadlineFields
                        dueDate={dueDate}
                        weighting={weighting}
                        inputClassName={baseInputClass}
                        onDueDateChange={setDueDate}
                        onWeightingChange={setWeighting}
                      />
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
                      <AssessmentEventSection
                        weighting={weighting}
                        eventStart={eventStart}
                        eventEnd={eventEnd}
                        eventLocation={eventLocation}
                        inputClassName={baseInputClass}
                        onWeightingChange={setWeighting}
                        onEventStartChange={setEventStart}
                        onEventEndChange={setEventEnd}
                        onEventLocationChange={setEventLocation}
                      />
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
