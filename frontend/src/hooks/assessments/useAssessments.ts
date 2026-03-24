import { useCallback, useEffect, useMemo, useState } from "react";

import * as assessmentService from "@/services/assessmentService";
import * as categoryService from "@/services/categoryService";
import type { Assessment, AssessmentSubmission, Category } from "@/types";

interface AssessmentSections {
  overdue: Assessment[];
  upcoming: Assessment[];
  completed: Assessment[];
}

export interface UseAssessmentsState {
  assessments: Assessment[];
  categories: Category[];
  sections: AssessmentSections;
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
  toggleCompleted: (assessment: Assessment) => Promise<void>;
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

export const useAssessments = (): UseAssessmentsReturn => {
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
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (fetchError) {
      console.error(fetchError);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchAssessments(), fetchCategories()]);
  }, [fetchAssessments, fetchCategories]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
  }, [selectedAssessment]);

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
  }, [pendingDeleteId, selectedAssessment?.id]);

  const toggleCompleted = useCallback(async (assessment: Assessment) => {
    const updated = await assessmentService.updateAssessment(assessment.id, {
      completed: !assessment.completed,
    });
    setAssessments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (selectedAssessment?.id === updated.id) {
      setSelectedAssessment(updated);
    }
  }, [selectedAssessment?.id]);

  const createCategory = useCallback(async (text: string) => {
    const created = await categoryService.createCategory(text.trim());
    setCategories((prev) => [...prev, created].sort((a, b) => a.text.localeCompare(b.text)));
    return created;
  }, []);

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
  }, []);

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
  }, [selectedCategoryId]);

  const filteredAssessments = useMemo(() => assessments.filter((assessment) => {
    const matchesSearch = assessment.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategoryId === null || [
      assessment.assessment_category?.id,
      assessment.module_category?.id,
      ...assessment.categories.map((category) => category.id),
    ].includes(selectedCategoryId);
    return matchesSearch && matchesCategory;
  }), [assessments, search, selectedCategoryId]);

  const sections = useMemo<AssessmentSections>(() => {
    const now = new Date();
    return {
      overdue: filteredAssessments.filter((assessment) => (
        !assessment.completed && new Date(assessment.due_date).getTime() < now.getTime()
      )),
      upcoming: filteredAssessments.filter((assessment) => (
        !assessment.completed && new Date(assessment.due_date).getTime() >= now.getTime()
      )),
      completed: filteredAssessments
        .filter((assessment) => assessment.completed)
        .sort((left, right) => (
          new Date(right.due_date).getTime() - new Date(left.due_date).getTime()
        )),
    };
  }, [filteredAssessments]);

  return {
    state: {
      assessments,
      categories,
      sections,
      search,
      selectedCategoryId,
      isSidebarOpen,
      selectedAssessment,
      pendingDeleteId,
      gradebookSource,
    },
    loading,
    error,
    actions: {
      setSearch,
      setSelectedCategoryId,
      openNewAssessment: () => {
        setSelectedAssessment(undefined);
        setIsSidebarOpen(true);
      },
      openAssessment: (assessment) => {
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
      toggleCompleted,
      openGradebook: setGradebookSource,
      closeGradebook: () => setGradebookSource(null),
      createCategory,
      updateCategory,
      deleteCategory,
      refresh,
    },
  };
};
