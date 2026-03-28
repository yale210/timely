import { describe, it, expect } from 'vitest';
import * as AnalyticsExports from '../../../src/components/analytics';
import AnalyticsBackground from '../../../src/components/analytics/AnalyticsBackground';

describe('Analytics index', () => {
  it('should export AnalyticsBackground', () => {
    expect(AnalyticsExports.AnalyticsBackground).toBe(AnalyticsBackground);
  });
});
