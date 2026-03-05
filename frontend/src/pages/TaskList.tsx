import AppLayout from "@/layouts/AppLayout";
import { TaskListSection, TaskSidebar } from "@/components";
import TaskListHeader from "@/components/tasks/TaskListHeader";
import TaskListToolbar from "@/components/tasks/TaskListToolbar";
import TaskUpcomingSection from "@/components/tasks/TaskUpcomingSection";
import { useTaskList } from "@/hooks/tasks/useTaskList";

const TaskList = () => {
  const { state, loading, error, actions } = useTaskList();
  const { categories, isSidebarOpen, selectedTask, search, sortBy, filters, sections } = state;

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        <TaskListHeader onNewTask={actions.openNewTask} />
        <TaskListToolbar
          search={search}
          sortBy={sortBy}
          categories={categories}
          filterCategory={filters.category}
          filterCompleted={filters.completed}
          filterHighImportance={filters.highImportance}
          filterQuickWins={filters.quickWins}
          onSearchChange={actions.setSearch}
          onSortChange={actions.setSortBy}
          onCategoryChange={actions.setFilterCategory}
          onCompletedChange={actions.setFilterCompleted}
          onToggleHighImportance={actions.toggleFilterHighImportance}
          onToggleQuickWins={actions.toggleFilterQuickWins}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && state.tasks.length === 0 && <p className="mb-4 text-sm text-gray-500">Loading tasks...</p>}

        {sections.pastTasks.length > 0 && (
          <TaskListSection
            title="Past (7 days)"
            tasks={sections.pastTasks}
            onToggleComplete={(id) => {
              void actions.toggleComplete(id);
            }}
            onTaskClick={actions.openTask}
            isCollapsible={true}
            defaultCollapsed={true}
          />
        )}

        {sections.overdueTasks.length > 0 && (
          <TaskListSection
            title="Overdue"
            tasks={sections.overdueTasks}
            onToggleComplete={(id) => {
              void actions.toggleComplete(id);
            }}
            onTaskClick={actions.openTask}
          />
        )}

        <TaskListSection
          title="Today"
          tasks={sections.todayTasks}
          onToggleComplete={(id) => {
            void actions.toggleComplete(id);
          }}
          onTaskClick={actions.openTask}
        />

        <TaskUpcomingSection
          upcomingTasks={sections.upcomingTasks}
          groupedUpcomingTasks={sections.groupedUpcomingTasks}
          sortedUpcomingDates={sections.sortedUpcomingDates}
          formatDayLabel={actions.formatDayLabel}
          onTaskClick={actions.openTask}
          onToggleComplete={(id) => {
            void actions.toggleComplete(id);
          }}
        />

        <button
          onClick={actions.openNewTask}
          className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-primary hover:text-primary hover:bg-blue-50 transition-colors flex items-center justify-center font-medium"
        >
          <span className="material-icons mr-2">add</span>
          Add New Task
        </button>
      </div>

      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={actions.closeSidebar}
        categories={categories}
        onCreateCategory={actions.createCategory}
        onUpdateCategory={actions.updateCategory}
        onDeleteCategory={actions.deleteCategory}
        onCategoryChange={(id, nextCategories) => {
          void actions.updateTaskCategories(id, nextCategories);
        }}
        onSubmit={(data) => {
          void actions.submitTask(data);
        }}
        onDelete={(id) => {
          void actions.deleteTask(id);
        }}
        initialData={selectedTask}
      />
    </AppLayout>
  );
};

export default TaskList;
