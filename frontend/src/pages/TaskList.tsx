import { useEffect, useState } from "react";
import { TaskListSection, UnifiedSidebar } from "@/components";
import TaskListToolbar from "@/components/tasks/TaskListToolbar";
import { useTaskList } from "@/hooks/tasks/useTaskList";
import AppLayout from "@/layouts/AppLayout";

const TaskList = () => {
  const { state, loading, error, actions } = useTaskList();
  const { categories, isSidebarOpen, selectedTask, warning, search, sortBy, filters, sections } = state;
  const [isMobileLayout, setIsMobileLayout] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileLayout(window.innerWidth < 640);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        {isMobileLayout ? (
          <div className="flex flex-wrap items-center gap-3 px-4 pt-5 pb-4">
            <h1 className="order-1 mr-auto text-2xl font-semibold text-black">Tasks</h1>
            <button
              onClick={actions.openNewTask}
              className="order-2 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-300"
            >
              <span className="material-icons text-base">add</span>
            </button>
            <div className="order-3 flex basis-full items-center gap-2">
              <div className="relative min-w-0 flex-1">
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
                containerClassName="flex shrink-0 items-center gap-2"
              />
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-black">Tasks</h1>
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
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
        {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {warning && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</div>}
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
        showModeToggle={false}
        categories={categories}
        onCreateCategory={actions.createCategory}
        onUpdateCategory={actions.updateCategory}
        onDeleteCategory={actions.deleteCategory}
        onTaskCategoryChange={(id, nextCategories) => {
          void actions.updateTaskCategories(id, nextCategories);
        }}
        onSubmitTask={actions.submitTask}
        onSubmitEvent={() => undefined}
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
