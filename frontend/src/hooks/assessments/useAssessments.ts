import { useCallback, useEffect, useMemo, useState } from "react";

import * as assessmentService from "@/services/assessmentService";
import * as categoryService from "@/services/categoryService";
import type { Assessment, AssessmentSubmission, Category } from "@/types";

interface AssessmentSections {
  overdue: Assessment[];
  upcoming: Assessment[];
  completed: Assessment[];
}

/**
 * State exposed by the assessments hook.
 */
export interface UseAssessmentsState {
  assessments: Assessment[];
  categories: Category[];
  sections: AssessmentSections;
  isGradebookEnabled: boolean;
  search: string;
  selectedCategoryId: number | null;
  isSidebarOpen: boolean;
  selectedAssessment: Assessment | undefined;
  pendingDeleteId: number | null;
  gradebookSource: Assessment | null;
}

interface UseAssessmentsActions {
  setSearch: (value: string) => void;
  setSelectedCategoryId: (value: number | null) => void;
  openNewAssessment: () => void;
  openAssessment: (assessment: Assessment) => void;
  closeSidebar: () => void;
  submitAssessment: (data: AssessmentSubmission) => Promise<void>;
  deleteAssessment: () => Promise<void>;
  setPendingDeleteId: (value: number | null) => void;
  openGradebook: (assessment: Assessment) => void;
  closeGradebook: () => void;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseAssessmentsReturn {
  state: UseAssessmentsState;
  loading: boolean;
  error: string | null;
  actions: UseAssessmentsActions;
}

const isAssessmentCompleted = (assessment: Assessment): boolean => {
  if (assessment.completed) return true;
  const comparisonDate = assessment.linked_event_details?.end_time ?? assessment.due_date;
  return new Date(comparisonDate).getTime() < Date.now();
};

const readGradebookFeatureFlag = (): boolean => {
  const raw = localStorage.getItem("feature_gradebook_enabled");
  return raw === null ? true : raw === "true";
};

/**
 * Manages the core state for assessments and categories.
 */
const useAssessmentState = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | undefined>(undefined);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [gradebookSource, setGradebookSource] = useState<Assessment | null>(null);
  const [isGradebookEnabled, setIsGradebookEnabled] = useState<boolean>(() => readGradebookFeatureFlag());

  return useMemo(() => ({
    assessments, setAssessments, categories, setCategories,
    loading, setLoading, error, setError, search, setSearch,
    selectedCategoryId, setSelectedCategoryId, isSidebarOpen, setIsSidebarOpen,
    selectedAssessment, setSelectedAssessment, pendingDeleteId, setPendingDeleteId,
    gradebookSource, setGradebookSource, isGradebookEnabled, setIsGradebookEnabled,
  }), [
    assessments, categories, loading, error, search, selectedCategoryId,
    isSidebarOpen, selectedAssessment, pendingDeleteId, gradebookSource, isGradebookEnabled,
  ]);
};

/**
 * Synchronises the gradebook feature flag state.
 */
const useAssessmentFeatureSync = (
  setIsEnabled: (enabled: boolean) => void,
  setSource: (source: Assessment | null) => void,
) => {
  useEffect(() => {
    const syncFeatureFlag = () => {
      const enabled = readGradebookFeatureFlag();
      setIsEnabled(enabled);
      if (!enabled) setSource(null);
    };

    window.addEventListener("feature-flags-changed", syncFeatureFlag);
    window.addEventListener("storage", syncFeatureFlag);
    return () => {
      window.removeEventListener("feature-flags-changed", syncFeatureFlag);
      window.removeEventListener("storage", syncFeatureFlag);
    };
  }, [setIsEnabled, setSource]);
};

/**
 * Handles fetching logic for assessments and categories.
 */
const useAssessmentData = (state: ReturnType<typeof useAssessmentState>) => {
  const { setAssessments, setCategories, setLoading, setError } = state;

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assessmentService.getAssessments({ ordering: "due_date" });
      setAssessments(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [setAssessments, setError, setLoading]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, [setCategories]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchAssessments(), fetchCategories()]);
  }, [fetchAssessments, fetchCategories]);

  useEffect(() => { void refresh(); }, [refresh]);

  return useMemo(() => ({ refresh }), [refresh]);
};

/**
 * Update assessment categories when a category is modified.
 */
const updateAssessmentsByCategory = (id: number, updated: Category) => (a: Assessment) => ({
  ...a,
  assessment_category: a.assessment_category?.id === id ? { ...a.assessment_category, ...updated } : a.assessment_category,
  module_category: a.module_category?.id === id ? { ...a.module_category, ...updated } : a.module_category,
  categories: a.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
});

/**
 * Remove categories from assessments when a category is deleted.
 */
const removeCategoryFromAssessments = (id: number) => (a: Assessment) => ({
  ...a,
  assessment_category: a.assessment_category?.id === id ? null : a.assessment_category,
  module_category: a.module_category?.id === id ? null : a.module_category,
  categories: a.categories.filter((c) => c.id !== id),
});

/**
 * Handles CRUD operations for categories within the hooks.
 */
const useCategoryOperations = (state: ReturnType<typeof useAssessmentState>) => {
  const { setCategories, setAssessments, setSelectedCategoryId, selectedCategoryId } = state;

  const createCategory = useCallback(async (text: string) => {
    const created = await categoryService.createCategory(text.trim());
    setCategories((prev) => [...prev, created].sort((a, b) => a.text.localeCompare(b.text)));
    return created;
  }, [setCategories]);

  const updateCategory = useCallback(async (id: number, patch: { colour?: string | null; colour_override?: boolean }) => {
    const updated = await categoryService.updateCategory(id, patch);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    setAssessments((prev) => prev.map(updateAssessmentsByCategory(id, updated)));
    return updated;
  }, [setCategories, setAssessments]);

  const deleteCategory = useCallback(async (id: number) => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setAssessments((prev) => prev.map(removeCategoryFromAssessments(id)));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  }, [selectedCategoryId, setCategories, setAssessments, setSelectedCategoryId]);

  return useMemo(() => ({ createCategory, updateCategory, deleteCategory }), [createCategory, updateCategory, deleteCategory]);
};

/**
 * Handles CRUD operations for assessments.
 */
const useAssessmentCRUDOperations = (state: ReturnType<typeof useAssessmentState>) => {
  const { setAssessments, setSelectedAssessment, setIsSidebarOpen, setPendingDeleteId, selectedAssessment, pendingDeleteId } = state;

  const submitAssessment = useCallback(async (data: AssessmentSubmission) => {
    if (selectedAssessment) {
      const updated = await assessmentService.updateAssessment(selectedAssessment.id, data);
      setAssessments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedAssessment(updated);
    } else {
      const created = await assessmentService.createAssessment(data);
      setAssessments((prev) => [...prev, created].sort((l, r) => new Date(l.due_date).getTime() - new Date(r.due_date).getTime()));
      setSelectedAssessment(created);
    }
  }, [selectedAssessment, setAssessments, setSelectedAssessment]);

  const deleteAssessment = useCallback(async () => {
    if (pendingDeleteId === null) return;
    await assessmentService.deleteAssessment(pendingDeleteId);
    setAssessments((prev) => prev.filter((item) => item.id !== pendingDeleteId));
    if (selectedAssessment?.id === pendingDeleteId) {
      setSelectedAssessment(undefined);
      setIsSidebarOpen(false);
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, selectedAssessment?.id, setAssessments, setIsSidebarOpen, setPendingDeleteId, setSelectedAssessment]);

  return useMemo(() => ({ submitAssessment, deleteAssessment }), [submitAssessment, deleteAssessment]);
};

/**
 * Organises all assessment-related actions into a single stable object.
 */
const useAssessmentOperations = (state: ReturnType<typeof useAssessmentState>, refresh: () => Promise<void>) => {
  const cats = useCategoryOperations(state);
  const crud = useAssessmentCRUDOperations(state);
  const { setSearch, setSelectedCategoryId, setSelectedAssessment, setIsSidebarOpen, setPendingDeleteId, setGradebookSource } = state;

  return useMemo(() => ({
    ...cats, ...crud, setSearch, setSelectedCategoryId, setPendingDeleteId, refresh,
    openNewAssessment: () => { setSelectedAssessment(undefined); setIsSidebarOpen(true); },
    openAssessment: (a: Assessment) => { setSelectedAssessment(a); setIsSidebarOpen(true); },
    closeSidebar: () => { setSelectedAssessment(undefined); setIsSidebarOpen(false); },
    openGradebook: (a: Assessment) => setGradebookSource(a),
    closeGradebook: () => setGradebookSource(null),
  }), [cats, crud, setSearch, setSelectedCategoryId, setPendingDeleteId, refresh, setSelectedAssessment, setIsSidebarOpen, setGradebookSource]);
};

/**
 * Handles filtering and sectioning logic for assessments.
 */
const useAssessmentFilters = (state: ReturnType<typeof useAssessmentState>) => {
  const filtered = useMemo(() => state.assessments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(state.search.toLowerCase());
    const ids = [a.assessment_category?.id, a.module_category?.id, ...a.categories.map((c) => c.id)];
    return matchesSearch && (state.selectedCategoryId === null || ids.includes(state.selectedCategoryId));
  }), [state.assessments, state.search, state.selectedCategoryId]);

  const sections = useMemo<AssessmentSections>(() => ({
    overdue: [],
    upcoming: filtered.filter((a) => !isAssessmentCompleted(a)),
    completed: filtered.filter((a) => isAssessmentCompleted(a)).sort((l, r) => new Date(r.due_date).getTime() - new Date(l.due_date).getTime()),
  }), [filtered]);

  return useMemo(() => ({ sections }), [sections]);
};

/**
 * Orchestrates the assessment hook logic.
 */
export const useAssessments = (): UseAssessmentsReturn => {
  const state = useAssessmentState();
  useAssessmentFeatureSync(state.setIsGradebookEnabled, state.setGradebookSource);
  const { refresh } = useAssessmentData(state);
  const actions = useAssessmentOperations(state, refresh);
  const { sections } = useAssessmentFilters(state);

  return {
    state: {
      ...state,
      sections,
    },
    loading: state.loading,
    error: state.error,
    actions,
  };
};
