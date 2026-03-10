import { TaskListSection, UnifiedSidebar } from "@/components";
import TaskListToolbar from "@/components/tasks/TaskListToolbar";
import { useTaskList } from "@/hooks/tasks/useTaskList";
import AppLayout from "@/layouts/AppLayout";
import * as eventService from "@/services/eventService";

const TaskList = () => {
  const { state, loading, error, actions } = useTaskList();
  const { categories, isSidebarOpen, selectedTask, search, sortBy, filters, sections } = state;

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-black">Tasks</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400 text-base">search</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => actions.setSearch(event.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                placeholder="Search tasks"
              />
            </div>
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
              showSearch={false}
              containerClassName="flex items-center gap-2"
            />
            <button
              onClick={actions.openNewTask}
              className="bg-primary hover:bg-blue-300 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center shadow-sm transition-colors"
            >
              <span className="material-icons text-base mr-1">add</span>
              New
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
        {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && state.tasks.length === 0 && <p className="mb-4 text-sm text-gray-500">Loading tasks...</p>}

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

        {sections.upcomingTasks.length > 0 && (
          <TaskListSection
            title="Upcoming"
            tasks={sections.upcomingTasks}
            onToggleComplete={(id) => {
              void actions.toggleComplete(id);
            }}
            onTaskClick={actions.openTask}
          />
        )}

        {sections.completedTasks.length > 0 && (
          <TaskListSection
            title="Completed"
            tasks={sections.completedTasks}
            onToggleComplete={(id) => {
              void actions.toggleComplete(id);
            }}
            onTaskClick={actions.openTask}
            isCollapsible={true}
            defaultCollapsed={true}
          />
        )}

      </div>

      <UnifiedSidebar
        isOpen={isSidebarOpen}
        onClose={actions.closeSidebar}
        initialMode="task"
        showModeToggle={true}
        categories={categories}
        onCreateCategory={actions.createCategory}
        onUpdateCategory={actions.updateCategory}
        onDeleteCategory={actions.deleteCategory}
        onTaskCategoryChange={(id, nextCategories) => {
          void actions.updateTaskCategories(id, nextCategories);
        }}
        onSubmitTask={(data) => {
          void actions.submitTask(data);
        }}
        onSubmitEvent={(data) => {
          void eventService.createEvent(data);
        }}
        onDelete={() => {
          if (selectedTask?.id) {
            void actions.deleteTask(selectedTask.id);
          }
        }}
        initialData={selectedTask}
      />
    </AppLayout>
  );
};

export default TaskList;
