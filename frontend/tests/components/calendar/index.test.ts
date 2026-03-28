import { describe, it, expect } from 'vitest';
import * as CalendarExports from '../../../src/components/calendar';
import CalendarContent from '../../../src/components/calendar/CalendarContent';
import CalendarSidebar from '../../../src/components/calendar/CalendarSidebar';
import CalendarToolbar from '../../../src/components/calendar/CalendarToolbar';
import CalendarView from '../../../src/components/calendar/CalendarView';

describe('Calendar index', () => {
  it('should export all components', () => {
    expect(CalendarExports.CalendarContent).toBe(CalendarContent);
    expect(CalendarExports.CalendarSidebar).toBe(CalendarSidebar);
    expect(CalendarExports.CalendarToolbar).toBe(CalendarToolbar);
    expect(CalendarExports.CalendarView).toBe(CalendarView);
  });
});
