import { UnifiedSidebar } from "@/components";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";

interface CalendarSidebarProps {
  state: Pick<
    UseCalendarReturn["state"],
    "isSidebarOpen" | "categories" | "selectedItem" | "sidebarMode"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "closeSidebar" | "submitTask" | "submitEvent" | "deleteSelected" | "revertSelectedEvent" | "createCategory" | "updateCategory" | "deleteCategory" | "updateTaskCategories"
  >;
}

/**
 * Renders the calendar task and event sidebar.
 * @param props - Calendar sidebar props.
 * @param props.state - Sidebar state values.
 * @param props.actions - Sidebar action callbacks.
 * @returns The sidebar wrapper around the unified task/event form.
 */
const CalendarSidebar = ({
  state,
  actions,
}: CalendarSidebarProps) => (
  <UnifiedSidebar
    isOpen={state.isSidebarOpen}
    onClose={actions.closeSidebar}
    categories={state.categories}
    onCreateCategory={actions.createCategory}
    onUpdateCategory={actions.updateCategory}
    onDeleteCategory={actions.deleteCategory}
    onTaskCategoryChange={(id, nextCategories) => {
      void actions.updateTaskCategories(id, nextCategories);
    }}
    initialData={state.selectedItem}
    initialMode={state.sidebarMode}
    onSubmitTask={actions.submitTask}
    onSubmitEvent={(data, context) => actions.submitEvent(data, context)}
    onDelete={(context) => actions.deleteSelected(context)}
    onRevertToSeries={(context) => actions.revertSelectedEvent(context)}
  />
);

export default CalendarSidebar;
