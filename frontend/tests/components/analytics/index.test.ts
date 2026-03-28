import { describe, it, expect } from 'vitest';
import * as AnalyticsExports from '@/components/analytics';
import AnalyticsBackground from '@/components/analytics/AnalyticsBackground';

describe('Analytics index', () => {
  it('should export AnalyticsBackground', () => {
    expect(AnalyticsExports.AnalyticsBackground).toBe(AnalyticsBackground);
  });
});
