import AppLayout from "@/layouts/AppLayout";
import CalendarContent from "@/components/calendar/CalendarContent";
import { useCalendar } from "@/hooks/calendar/useCalendar";

interface CalendarPageProps {
  showNavbar?: boolean;
  useLayout?: boolean;
}

/**
 * Renders the calendar page as a thin container.
 * @param props - Calendar page props.
 * @param props.showNavbar - Whether the shared app navbar should render.
 * @param props.useLayout - Whether to wrap the page with the shared layout.
 * @returns The rendered calendar page.
 */
const CalendarPage = ({ showNavbar = true, useLayout = true }: CalendarPageProps) => {
  const { state, loading, actions } = useCalendar();

  const content = (
    <CalendarContent
      state={state}
      loading={loading}
      actions={actions}
    />
  );

  if (!useLayout) {
    return content;
  }

  return (
    <AppLayout showNavbar={showNavbar}>
      {content}
    </AppLayout>
  );
};

export default CalendarPage;
