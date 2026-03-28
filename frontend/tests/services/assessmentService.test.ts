import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as assessmentService from '../../src/services/assessmentService';
import api from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('assessmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssessment = { id: 1, title: 'Test' };

  describe('getAssessments', () => {
    it('should call api.get with correct url and params', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockAssessment] });
      const filters = { search: 'test' };

      const result = await assessmentService.getAssessments(filters);

      expect(api.get).toHaveBeenCalledWith('/api/assessments/', { params: filters });
      expect(result).toEqual([mockAssessment]);
    });

    it('should handle undefined filters', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [mockAssessment] });

      const result = await assessmentService.getAssessments();

      expect(api.get).toHaveBeenCalledWith('/api/assessments/', { params: undefined });
      expect(result).toEqual([mockAssessment]);
    });
  });

  describe('createAssessment', () => {
    it('should call api.post with correct data', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: mockAssessment });
      const data = { title: 'New' } as any;

      const result = await assessmentService.createAssessment(data);

      expect(api.post).toHaveBeenCalledWith('/api/assessments/', data);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('updateAssessment', () => {
    it('should call api.patch with correct url and data', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: mockAssessment });
      const data = { title: 'Updated' } as any;

      const result = await assessmentService.updateAssessment(1, data);

      expect(api.patch).toHaveBeenCalledWith('/api/assessments/1/', data);
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('deleteAssessment', () => {
    it('should call api.delete with correct url', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await assessmentService.deleteAssessment(1);

      expect(api.delete).toHaveBeenCalledWith('/api/assessments/1/');
    });
  });
});
