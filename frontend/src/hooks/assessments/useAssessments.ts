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

/**
 * Determines whether an assessment should be treated as completed in the UI.
 * @param assessment - Assessment to evaluate.
 * @returns Whether the assessment is completed or has already passed.
 */
const isAssessmentCompleted = (assessment: Assessment): boolean => {
  if (assessment.completed) {
    return true;
  }

  const comparisonDate = assessment.linked_event_details?.end_time ?? assessment.due_date;
  return new Date(comparisonDate).getTime() < Date.now();
};

/**
 * Reads the local gradebook feature flag.
 * @returns Whether gradebook is currently enabled.
 */
const readGradebookFeatureFlag = (): boolean => {
  const raw = localStorage.getItem("feature_gradebook_enabled");
  if (raw === null) {
    return true;
  }
  return raw === "true";
};

/**
 * Manages the core state for assessments and categories.
 * @returns State-related variables and their setters.
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
    assessments, setAssessments,
    categories, setCategories,
    loading, setLoading,
    error, setError,
    search, setSearch,
    selectedCategoryId, setSelectedCategoryId,
    isSidebarOpen, setIsSidebarOpen,
    selectedAssessment, setSelectedAssessment,
    pendingDeleteId, setPendingDeleteId,
    gradebookSource, setGradebookSource,
    isGradebookEnabled, setIsGradebookEnabled,
  }), [
    assessments, categories, loading, error, search, selectedCategoryId,
    isSidebarOpen, selectedAssessment, pendingDeleteId, gradebookSource, isGradebookEnabled,
  ]);
};

/**
 * Handles data fetching and synchronization for assessments.
 * @param state - The assessment state object.
 */
const useAssessmentData = (state: ReturnType<typeof useAssessmentState>) => {
  const { setAssessments, setCategories, setLoading, setError, setIsGradebookEnabled, setGradebookSource } = state;

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assessmentService.getAssessments({ ordering: "due_date" });
      setAssessments(data);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [setAssessments, setError, setLoading]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (fetchError) {
      console.error(fetchError);
    }
  }, [setCategories]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchAssessments(), fetchCategories()]);
  }, [fetchAssessments, fetchCategories]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const syncFeatureFlag = () => {
      const enabled = readGradebookFeatureFlag();
      setIsGradebookEnabled(enabled);
      if (!enabled) {
        setGradebookSource(null);
      }
    };

    window.addEventListener("feature-flags-changed", syncFeatureFlag);
    window.addEventListener("storage", syncFeatureFlag);
    return () => {
      window.removeEventListener("feature-flags-changed", syncFeatureFlag);
      window.removeEventListener("storage", syncFeatureFlag);
    };
  }, [setIsGradebookEnabled, setGradebookSource]);

  return useMemo(() => ({ refresh }), [refresh]);
};

/**
 * Defines operations and actions available for assessments.
 * @param state - The assessment state object.
 * @param refresh - Function to refresh data.
 * @returns Memoised actions for assessment management.
 */
const useAssessmentOperations = (
  state: ReturnType<typeof useAssessmentState>,
  refresh: () => Promise<void>,
) => {
  const {
    setAssessments, setCategories, setSearch, setSelectedCategoryId,
    setIsSidebarOpen, setSelectedAssessment, setPendingDeleteId, setGradebookSource,
    selectedAssessment, pendingDeleteId, selectedCategoryId,
  } = state;

  const submitAssessment = useCallback(async (data: AssessmentSubmission) => {
    if (selectedAssessment) {
      const updated = await assessmentService.updateAssessment(selectedAssessment.id, data);
      setAssessments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedAssessment(updated);
    } else {
      const created = await assessmentService.createAssessment(data);
      setAssessments((prev) => [...prev, created].sort((left, right) => (
        new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
      )));
      setSelectedAssessment(created);
    }
  }, [selectedAssessment, setAssessments, setSelectedAssessment]);

  const deleteAssessment = useCallback(async () => {
    if (pendingDeleteId === null) {
      return;
    }
    await assessmentService.deleteAssessment(pendingDeleteId);
    setAssessments((prev) => prev.filter((item) => item.id !== pendingDeleteId));
    if (selectedAssessment?.id === pendingDeleteId) {
      setSelectedAssessment(undefined);
      setIsSidebarOpen(false);
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, selectedAssessment?.id, setAssessments, setIsSidebarOpen, setPendingDeleteId, setSelectedAssessment]);

  const createCategory = useCallback(async (text: string) => {
    const created = await categoryService.createCategory(text.trim());
    setCategories((prev) => [...prev, created].sort((a, b) => a.text.localeCompare(b.text)));
    return created;
  }, [setCategories]);

  const updateCategory = useCallback(async (
    id: number,
    patch: { colour?: string | null; colour_override?: boolean },
  ) => {
    const updated = await categoryService.updateCategory(id, patch);
    setCategories((prev) => prev.map((category) => (
      category.id === id ? { ...category, ...updated } : category
    )));
    setAssessments((prev) => prev.map((assessment) => ({
      ...assessment,
      assessment_category: assessment.assessment_category?.id === id
        ? { ...assessment.assessment_category, ...updated }
        : assessment.assessment_category,
      module_category: assessment.module_category?.id === id
        ? { ...assessment.module_category, ...updated }
        : assessment.module_category,
      categories: assessment.categories.map((category) => (
        category.id === id ? { ...category, ...updated } : category
      )),
    })));
    return updated;
  }, [setCategories, setAssessments]);

  const deleteCategory = useCallback(async (id: number) => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setAssessments((prev) => prev.map((assessment) => ({
      ...assessment,
      assessment_category: assessment.assessment_category?.id === id
        ? null
        : assessment.assessment_category,
      module_category: assessment.module_category?.id === id
        ? null
        : assessment.module_category,
      categories: assessment.categories.filter((category) => category.id !== id),
    })));
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
  }, [selectedCategoryId, setCategories, setAssessments, setSelectedCategoryId]);

  return useMemo(() => ({
    setSearch,
    setSelectedCategoryId,
    openNewAssessment: () => {
      setSelectedAssessment(undefined);
      setIsSidebarOpen(true);
    },
    openAssessment: (assessment: Assessment) => {
      setSelectedAssessment(assessment);
      setIsSidebarOpen(true);
    },
    closeSidebar: () => {
      setSelectedAssessment(undefined);
      setIsSidebarOpen(false);
    },
    submitAssessment,
    deleteAssessment,
    setPendingDeleteId,
    openGradebook: (assessment: Assessment) => setGradebookSource(assessment),
    closeGradebook: () => setGradebookSource(null),
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  }), [
    setSearch, setSelectedCategoryId, setSelectedAssessment, setIsSidebarOpen,
    submitAssessment, deleteAssessment, setPendingDeleteId, setGradebookSource,
    createCategory, updateCategory, deleteCategory, refresh,
  ]);
};

/**
 * Provides state and actions for the assessments page.
 * @returns Structured assessments state, loading, error, and actions.
 */
export const useAssessments = (): UseAssessmentsReturn => {
  const state = useAssessmentState();
  const { refresh } = useAssessmentData(state);
  const actions = useAssessmentOperations(state, refresh);

  const filteredAssessments = useMemo(() => state.assessments.filter((assessment) => {
    const matchesSearch = assessment.title.toLowerCase().includes(state.search.toLowerCase());
    const matchesCategory = state.selectedCategoryId === null || [
      assessment.assessment_category?.id,
      assessment.module_category?.id,
      ...assessment.categories.map((category) => category.id),
    ].includes(state.selectedCategoryId);
    return matchesSearch && matchesCategory;
  }), [state.assessments, state.search, state.selectedCategoryId]);

  const sections = useMemo<AssessmentSections>(() => ({
    overdue: [],
    upcoming: filteredAssessments.filter((assessment) => !isAssessmentCompleted(assessment)),
    completed: filteredAssessments
      .filter((assessment) => isAssessmentCompleted(assessment))
      .sort((left, right) => new Date(right.due_date).getTime() - new Date(left.due_date).getTime()),
  }), [filteredAssessments]);

  return {
    state: {
      assessments: state.assessments,
      categories: state.categories,
      sections,
      isGradebookEnabled: state.isGradebookEnabled,
      search: state.search,
      selectedCategoryId: state.selectedCategoryId,
      isSidebarOpen: state.isSidebarOpen,
      selectedAssessment: state.selectedAssessment,
      pendingDeleteId: state.pendingDeleteId,
      gradebookSource: state.gradebookSource,
    },
    loading: state.loading,
    error: state.error,
    actions,
  };
};
