import { describe, it, expect } from 'vitest';
import * as CalendarExports from '@/components/calendar';
import CalendarContent from '@/components/calendar/CalendarContent';
import CalendarSidebar from '@/components/calendar/CalendarSidebar';
import CalendarToolbar from '@/components/calendar/CalendarToolbar';
import CalendarView from '@/components/calendar/CalendarView';

describe('Calendar index', () => {
  it('should export all components', () => {
    expect(CalendarExports.CalendarContent).toBe(CalendarContent);
    expect(CalendarExports.CalendarSidebar).toBe(CalendarSidebar);
    expect(CalendarExports.CalendarToolbar).toBe(CalendarToolbar);
    expect(CalendarExports.CalendarView).toBe(CalendarView);
  });
});
