import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assessmentService from '../../src/services/assessmentService';
import type { Assessment, AssessmentSubmission } from '../../src/types';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../../src/services/api', () => ({
  default: mockApi,
}));

describe('assessmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssessment: Assessment = { 
    id: 1, 
    title: 'Test',
    description: '',
    course: 1,
    course_name: 'Course',
    due_date: '2026-01-01',
    weight: 10,
    category: 1,
    category_name: 'Category',
    is_completed: false,
    created_at: '',
    updated_at: ''
  };

  describe('getAssessments', () => {
    it('should call api.get with correct url and params', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: [mockAssessment] });
      const filters = { search: 'test' };

      const result = await assessmentService.getAssessments(filters);

      expect(mockApi.get).toHaveBeenCalledWith('/api/assessments/', { params: filters });
      expect(result).toEqual([mockAssessment]);
    });

    it('should handle undefined filters', async () => {
      vi.mocked(mockApi.get).mockResolvedValue({ data: [mockAssessment] });

      const result = await assessmentService.getAssessments();

      expect(mockApi.get).toHaveBeenCalledWith('/api/assessments/', { params: undefined });
      expect(result).toEqual([mockAssessment]);
    });
  });

  describe('createAssessment', () => {
    it('should call api.post with correct data', async () => {
      vi.mocked(mockApi.post).mockResolvedValue({ data: mockAssessment });
      const data: AssessmentSubmission = { title: 'New', description: '', course: 1, due_date: '', weight: 0, category: 1 };

      const result = await assessmentService.createAssessment(data);

      expect(mockApi.post).toHaveBeenCalledWith('/api/assessments/', data);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('updateAssessment', () => {
    it('should call api.patch with correct url and data', async () => {
      vi.mocked(mockApi.patch).mockResolvedValue({ data: mockAssessment });
      const data: AssessmentSubmission = { title: 'Updated', description: '', course: 1, due_date: '', weight: 0, category: 1 };

      const result = await assessmentService.updateAssessment(1, data);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/assessments/1/', data);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('deleteAssessment', () => {
    it('should call api.delete with correct url', async () => {
      vi.mocked(mockApi.delete).mockResolvedValue({});

      await assessmentService.deleteAssessment(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/api/assessments/1/');
    });
  });
});
