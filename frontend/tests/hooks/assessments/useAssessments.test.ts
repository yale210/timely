import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAssessments } from '../../../src/hooks/assessments/useAssessments';
import * as assessmentService from '../../../src/services/assessmentService';
import * as categoryService from '../../../src/services/categoryService';
import type { Assessment, AssessmentSubmission, Category } from '../../../src/types';

vi.mock('../../../src/services/assessmentService', () => ({
  getAssessments: vi.fn(),
  createAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  deleteAssessment: vi.fn(),
}));

vi.mock('../../../src/services/categoryService', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const mockAssessment: Assessment = {
  id: 1,
  title: 'Test Assessment',
  assessment_type: 'COURSEWORK',
  due_date: '2100-03-28T10:00:00Z',
  weighting_of_assessment: 0,
  completed: false,
  categories: [],
  created_at: '2026-03-28T00:00:00Z',
  updated_at: '2026-03-28T00:00:00Z',
};

const mockCategory: Category = {
  id: 1,
  text: 'Test Category',
  colour: '#000000',
  colour_override: false,
};

describe('useAssessments Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assessmentService.getAssessments).mockResolvedValue([mockAssessment]);
    vi.mocked(categoryService.getCategories).mockResolvedValue([mockCategory]);
    localStorage.clear();
  });

  it('initializes and fetches data', async () => {
    const { result } = renderHook(() => useAssessments());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.actions.refresh();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.state.assessments).toEqual([mockAssessment]);
    expect(result.current.state.categories).toEqual([mockCategory]);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch error', async () => {
    vi.mocked(assessmentService.getAssessments).mockRejectedValue(new Error('Fetch failed'));
    
    const { result } = renderHook(() => useAssessments());

    await act(async () => {
      await result.current.actions.refresh();
    });

    expect(result.current.error).toBe('Failed to load assessments.');
  });

  it('handles creating and updating assessments', async () => {
    const { result } = renderHook(() => useAssessments());
    
    await act(async () => {
      await result.current.actions.refresh();
    });

    const newAssessment = { ...mockAssessment, id: 2, title: 'New Assessment' };
    vi.mocked(assessmentService.createAssessment).mockResolvedValue(newAssessment as Assessment);

    await act(async () => {
      await result.current.actions.submitAssessment({ title: 'New Assessment' } as AssessmentSubmission);
    });

    expect(assessmentService.createAssessment).toHaveBeenCalledWith({ title: 'New Assessment' });
    expect(result.current.state.assessments).toContainEqual(newAssessment);
    
    // Update assessment
    const updatedAssessment = { ...newAssessment, title: 'Updated Assessment' };
    vi.mocked(assessmentService.updateAssessment).mockResolvedValue(updatedAssessment as Assessment);

    act(() => {
      result.current.actions.openAssessment(newAssessment as Assessment);
    });

    await act(async () => {
      await result.current.actions.submitAssessment({ title: 'Updated Assessment' } as AssessmentSubmission);
    });

    expect(assessmentService.updateAssessment).toHaveBeenCalledWith(2, { title: 'Updated Assessment' });
    expect(result.current.state.assessments).toContainEqual(updatedAssessment);
  });

  it('handles deleting assessments', async () => {
    const { result } = renderHook(() => useAssessments());

    await act(async () => {
      await result.current.actions.refresh();
    });

    vi.mocked(assessmentService.deleteAssessment).mockResolvedValue(undefined);

    act(() => {
      result.current.actions.openAssessment(mockAssessment);
      result.current.actions.setPendingDeleteId(1);
    });

    await act(async () => {
      await result.current.actions.deleteAssessment();
    });

    expect(assessmentService.deleteAssessment).toHaveBeenCalledWith(1);
    expect(result.current.state.assessments).toEqual([]);
    expect(result.current.state.pendingDeleteId).toBe(null);
    expect(result.current.state.selectedAssessment).toBeUndefined(); // Verify selected assessment is cleared
  });

  it('handles UI actions', () => {
    const { result } = renderHook(() => useAssessments());

    act(() => {
      result.current.actions.setSearch('Test');
      result.current.actions.setSelectedCategoryId(1);
      result.current.actions.openNewAssessment();
    });

    expect(result.current.state.search).toBe('Test');
    expect(result.current.state.selectedCategoryId).toBe(1);
    expect(result.current.state.isSidebarOpen).toBe(true);
    expect(result.current.state.selectedAssessment).toBeUndefined();

    act(() => {
      result.current.actions.openAssessment(mockAssessment);
    });

    expect(result.current.state.selectedAssessment).toEqual(mockAssessment);

    act(() => {
      result.current.actions.closeSidebar();
    });

    expect(result.current.state.isSidebarOpen).toBe(false);
    expect(result.current.state.selectedAssessment).toBeUndefined();

    act(() => {
      result.current.actions.openGradebook(mockAssessment);
    });

    expect(result.current.state.gradebookSource).toEqual(mockAssessment);

    act(() => {
      result.current.actions.closeGradebook();
    });

    expect(result.current.state.gradebookSource).toBe(null);
  });

  it('handles categories', async () => {
    const assessmentWithCategory = {
      ...mockAssessment,
      assessment_category: { id: 2 },
      module_category: { id: 2 },
      categories: [{ id: 2 }],
    };
    vi.mocked(assessmentService.getAssessments).mockResolvedValue([assessmentWithCategory as Assessment]);

    const { result } = renderHook(() => useAssessments());

    await act(async () => {
      await result.current.actions.refresh();
    });

    const newCategory = { id: 2, text: 'New Category' };
    vi.mocked(categoryService.createCategory).mockResolvedValue(newCategory as Category);

    await act(async () => {
      await result.current.actions.createCategory('New Category');
    });

    expect(categoryService.createCategory).toHaveBeenCalledWith('New Category');
    expect(result.current.state.categories).toContainEqual(newCategory);

    const updatedCategory = { ...newCategory, colour: '#ffffff' };
    vi.mocked(categoryService.updateCategory).mockResolvedValue(updatedCategory as Category);

    await act(async () => {
      await result.current.actions.updateCategory(2, { colour: '#ffffff' });
    });

    expect(categoryService.updateCategory).toHaveBeenCalledWith(2, { colour: '#ffffff' });
    
    // Check that assessment categories got updated
    const updatedAssessment = result.current.state.assessments[0];
    expect(updatedAssessment.assessment_category?.colour).toBe('#ffffff');
    expect(updatedAssessment.module_category?.colour).toBe('#ffffff');
    expect(updatedAssessment.categories[0].colour).toBe('#ffffff');

    vi.mocked(categoryService.deleteCategory).mockResolvedValue(undefined);

    act(() => {
      result.current.actions.setSelectedCategoryId(2);
    });

    await act(async () => {
      await result.current.actions.deleteCategory(2);
    });

    expect(categoryService.deleteCategory).toHaveBeenCalledWith(2);
    expect(result.current.state.selectedCategoryId).toBeNull(); // verify selection clears

    // Check that assessment categories got removed
    const deletedCatAssessment = result.current.state.assessments[0];
    expect(deletedCatAssessment.assessment_category).toBeNull();
    expect(deletedCatAssessment.module_category).toBeNull();
    expect(deletedCatAssessment.categories.length).toBe(0);
  });

  it('handles feature flags and completed state', async () => {
    localStorage.setItem('feature_gradebook_enabled', 'false');

    const pastAssessment = { ...mockAssessment, id: 3, title: 'Past', due_date: '2000-01-01T00:00:00Z', completed: true };
    const futureAssessment = { ...mockAssessment, id: 4, title: 'Future', due_date: '2100-01-01T00:00:00Z', completed: false, linked_event_details: { end_time: '2000-01-01T00:00:00Z' } }; // past linked event
    vi.mocked(assessmentService.getAssessments).mockResolvedValue([pastAssessment, futureAssessment] as Assessment[]);

    const { result } = renderHook(() => useAssessments());

    await act(async () => {
      await result.current.actions.refresh();
    });

    expect(result.current.state.isGradebookEnabled).toBe(false);

    expect(result.current.state.sections.completed.length).toBe(2); // both are completed
    expect(result.current.state.sections.upcoming.length).toBe(0);

    act(() => {
      localStorage.setItem('feature_gradebook_enabled', 'true');
      window.dispatchEvent(new Event('feature-flags-changed'));
    });

    expect(result.current.state.isGradebookEnabled).toBe(true);
  });
  
  it('handles filtering', async () => {
    const assessmentWithCat = { ...mockAssessment, id: 5, title: 'MatchMe', assessment_category: { id: 10 } };
    const assessmentWithoutCat = { ...mockAssessment, id: 6, title: 'NoMatch', assessment_category: null };
    
    vi.mocked(assessmentService.getAssessments).mockResolvedValue([assessmentWithCat, assessmentWithoutCat] as Assessment[]);

    const { result } = renderHook(() => useAssessments());

    await act(async () => {
      await result.current.actions.refresh();
    });

    act(() => {
      result.current.actions.setSearch('MatchMe');
    });

    expect(result.current.state.sections.upcoming.some(a => a.id === 5)).toBe(true);
    expect(result.current.state.sections.upcoming.some(a => a.id === 6)).toBe(false);

    act(() => {
      result.current.actions.setSearch('');
      result.current.actions.setSelectedCategoryId(10);
    });

    expect(result.current.state.sections.upcoming.some(a => a.id === 5)).toBe(true);
    expect(result.current.state.sections.upcoming.some(a => a.id === 6)).toBe(false);
  });
});
