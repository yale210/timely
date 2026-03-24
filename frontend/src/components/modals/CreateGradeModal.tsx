import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";

import useCategories from "@/hooks/tasks/useCategories";
import { hexToRgba } from "@/utils/colorUtils";
import type { Category } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  initialData?: {
    id?: number;
    name?: string;
    score?: number | "";
    total?: number | "";
    date?: string;
    categoryId?: number | null;
  };
}

const getCookie = (name: string): string | null => {
  const regex = new RegExp(`(^| )${name}=([^;]+)`);
  const match = regex.exec(document.cookie);
  return match ? decodeURIComponent(match[2]) : null;
};

const CreateGradeModal = ({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialData,
}: Props) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [score, setScore] = useState<number | "">(initialData?.score ?? "");
  const [total, setTotal] = useState<number | "">(initialData?.total ?? "");
  const [date, setDate] = useState(initialData?.date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(initialData?.categoryId ?? null);
  const { categories } = useCategories();

  useEffect(() => {
    setName(initialData?.name ?? "");
    setScore(initialData?.score ?? "");
    setTotal(initialData?.total ?? "");
    setDate(initialData?.date ?? "");
    setCategoryId(initialData?.categoryId ?? null);
    setError(null);
  }, [initialData, open]);

  const selectedCategory = useMemo(
    () => categories.find((category: Category) => category.id === categoryId),
    [categories, categoryId],
  );

  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none";

  const getCategorySelectStyle = (category?: Category) => {
    if (!category?.colour) {
      return undefined;
    }

    return {
      borderColor: category.colour,
      boxShadow: `inset 0 0 0 1px ${hexToRgba(category.colour, 0.2)}`,
    };
  };

  if (!open) {
    return null;
  }

  const createGrade = async (payload: Record<string, unknown>) => {
    const csrf = getCookie("csrftoken");
    return fetch("/api/grades/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {}),
      },
      body: JSON.stringify(payload),
    });
  };

  const updateGrade = async (id: number, payload: Record<string, unknown>) => {
    const csrf = getCookie("csrftoken");
    return fetch(`/api/grades/${id}/`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {}),
      },
      body: JSON.stringify(payload),
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (typeof score !== "number" || typeof total !== "number") {
      setError("Please provide numeric values for score and total.");
      return;
    }
    if (score > total) {
      setError("Score must be less than or equal to total.");
      return;
    }

    const payload = {
      name: name.trim(),
      category: categoryId,
      score,
      total_possible: total,
      date_achieved: date,
    };

    const response = typeof initialData?.id === "number"
      ? await updateGrade(initialData.id, payload)
      : await createGrade(payload);

    if (response.ok) {
      if (typeof initialData?.id === "number") {
        void onUpdated?.();
      } else {
        void onCreated?.();
      }
      return;
    }

    try {
      const data = await response.json() as Record<string, unknown>;
      const firstMessage = Object.values(data).flat().find((value) => typeof value === "string");
      setError(typeof firstMessage === "string" ? firstMessage : "Failed to save grade.");
    } catch {
      setError(typeof initialData?.id === "number" ? "Failed to update grade." : "Failed to create grade.");
    }
  };

  return (
    <Transition show={open} as={Fragment}>
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
              <DialogPanel className="w-full transform bg-white shadow-xl transition-all sm:max-w-xl sm:rounded-2xl">
                <form onSubmit={(event) => void submit(event)} className="flex max-h-[100dvh] flex-col sm:max-h-[90vh]">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <DialogTitle className="text-lg font-semibold text-black">
                      {initialData ? "Edit grade" : "Create grade"}
                    </DialogTitle>
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

                    <div>
                      <label htmlFor="grade-name" className="mb-2 block text-sm font-medium text-gray-700">
                        Assessment name
                      </label>
                      <input
                        id="grade-name"
                        placeholder="Assessment name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className={baseInputClass}
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="grade-score" className="mb-2 block text-sm font-medium text-gray-700">
                          Score
                        </label>
                        <input
                          id="grade-score"
                          type="number"
                          placeholder="Score"
                          value={String(score)}
                          onChange={(event) => {
                            setScore(event.target.value === "" ? "" : (
                              Number(event.target.value) > 100000 ? 100000 : Number(event.target.value)
                            ));
                          }}
                          className={baseInputClass}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="grade-total" className="mb-2 block text-sm font-medium text-gray-700">
                          Total possible
                        </label>
                        <input
                          id="grade-total"
                          type="number"
                          placeholder="Total"
                          value={String(total)}
                          onChange={(event) => {
                            setTotal(event.target.value === "" ? "" : (
                              Number(event.target.value) > 100000 ? 100000 : Number(event.target.value)
                            ));
                          }}
                          className={baseInputClass}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="grade-category">
                          Category
                        </label>
                        <select
                          id="grade-category"
                          value={categoryId ?? ""}
                          onChange={(event) => setCategoryId(event.target.value === "" ? null : Number(event.target.value))}
                          className={`${baseInputClass} cursor-pointer`}
                          style={getCategorySelectStyle(selectedCategory)}
                        >
                          <option value="">None</option>
                          {categories?.map((category: Category) => (
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
                        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="grade-date-input">
                          Date achieved
                        </label>
                        <input
                          id="grade-date-input"
                          type="date"
                          value={date}
                          onChange={(event) => setDate(event.target.value)}
                          className={baseInputClass}
                          required
                        />
                      </div>
                    </div>
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
                      {initialData ? "Update grade" : "Create grade"}
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

export default CreateGradeModal;
