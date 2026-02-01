import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import AppLayout from "../layouts/AppLayout";
import { TaskListSection, TaskSidebar, TaskCard } from "../components";
import * as taskService from "../services/taskService";
import { type Task, type Category, type TaskSubmission } from "../types";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [search, setSearch] = useState("");
  
  // Sorting and Filtering States
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [filterHighImportance, setFilterHighImportance] = useState(false);
  const [filterQuickWins, setFilterQuickWins] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {
        ordering: sortBy,
      };
      
      if (filterCategory) {
        params.categories = filterCategory;
      }
      
      if (filterCompleted === "completed") {
        params.completed = "true";
      } else if (filterCompleted === "pending") {
        params.completed = "false";
      }

      const data = await taskService.getTasks(params);
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, [sortBy, filterCategory, filterCompleted]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await taskService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
      await fetchCategories();
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise TaskList:", err);
    });
  }, [fetchTasks, fetchCategories]);

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      await taskService.updateTask(id, { completed: !task.completed });
      await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsSidebarOpen(true);
  };

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setIsSidebarOpen(true);
  };

  const handleSubmitTask = async (data: TaskSubmission) => {
    try {
      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, data);
      } else {
        await taskService.createTask(data);
      }
      await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesHighImportance = !filterHighImportance || t.importance >= 8;
    const matchesQuickWins = !filterQuickWins || (t.estimated_minutes > 0 && t.estimated_minutes <= 30);
    return matchesSearch && matchesHighImportance && matchesQuickWins;
  });

  const now = moment();
  const sevenDaysAgo = moment().subtract(7, "days").startOf("day");

  const pastTasks = filteredTasks.filter(
    (t) =>
      t.completed &&
      moment(t.deadline).isBetween(sevenDaysAgo, now, undefined, "[]")
  );

  const overdueTasks = filteredTasks.filter(
    (t) => !t.completed && moment(t.deadline).isBefore(now)
  );

  const todayTasks = filteredTasks.filter(
    (t) =>
      moment(t.deadline).isSame(now, "day") &&
      !overdueTasks.some((ot) => ot.id === t.id) &&
      !pastTasks.some((pt) => pt.id === t.id)
  );

  const upcomingTasks = filteredTasks.filter(
    (t) =>
      moment(t.deadline).isAfter(now) && !moment(t.deadline).isSame(now, "day")
  );

  // Group upcoming tasks by their deadline date to facilitate daily sections in the UI.
  const groupedUpcomingTasks = upcomingTasks.reduce((groups, task) => {
    // Normalise the deadline to the start of the day for consistent grouping keys.
    const date = moment(task.deadline).startOf("day").format("YYYY-MM-DD");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  // Sort the grouped date keys chronologically to ensure upcoming tasks appear in order.
  const sortedUpcomingDates = Object.keys(groupedUpcomingTasks).sort();

  const formatDayLabel = (dateStr: string) => {
    const d = moment(dateStr);
    const tomorrow = moment().add(1, "day").startOf("day");
    if (d.isSame(tomorrow, "day")) {
      return "Tomorrow";
    }
    return d.format("ddd D MMM");
  };

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">
              My Tasks
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Keep track of your daily goals and schedule.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleNewTask}
              className="bg-primary hover:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors"
            >
              <span className="material-icons text-lg mr-1">add</span>
              New Task
            </button>
          </div>
        </div>
        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-gray-400">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              placeholder="Search tasks..."
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Filter Menu */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="material-icons text-base mr-1.5">filter_list</span>
                Filter
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
                <div className="p-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</div>
                  {["all", "completed", "pending"].map((status) => (
                    <MenuItem key={status}>
                      {({ focus }) => (
                        <button
                          onClick={() => setFilterCompleted(status)}
                          className={`${
                            focus ? "bg-blue-50 text-primary" : "text-gray-700"
                          } ${filterCompleted === status ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm capitalize`}
                        >
                          {status}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Attributes</div>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => setFilterHighImportance(!filterHighImportance)}
                        className={`${
                          focus ? "bg-blue-50 text-primary" : "text-gray-700"
                        } ${filterHighImportance ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        <span className={`material-icons text-sm mr-2 ${filterHighImportance ? "text-primary" : "text-gray-400"}`}>
                          {filterHighImportance ? "check_box" : "check_box_outline_blank"}
                        </span>
                        High Importance Only
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => setFilterQuickWins(!filterQuickWins)}
                        className={`${
                          focus ? "bg-blue-50 text-primary" : "text-gray-700"
                        } ${filterQuickWins ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        <span className={`material-icons text-sm mr-2 ${filterQuickWins ? "text-primary" : "text-gray-400"}`}>
                          {filterQuickWins ? "check_box" : "check_box_outline_blank"}
                        </span>
                        ≤ 30 mins (Quick wins)
                      </button>
                    )}
                  </MenuItem>
                  <div className="border-t border-gray-100 my-1" />
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Category</div>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => setFilterCategory(null)}
                        className={`${
                          focus ? "bg-blue-50 text-primary" : "text-gray-700"
                        } ${filterCategory === null ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        All Categories
                      </button>
                    )}
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id}>
                      {({ focus }) => (
                        <button
                          onClick={() => setFilterCategory(cat.id)}
                          className={`${
                            focus ? "bg-blue-50 text-primary" : "text-gray-700"
                          } ${filterCategory === cat.id ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {cat.text}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>

            {/* Sort Menu */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="material-icons text-base mr-1.5">sort</span>
                Sort
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
                <div className="p-1">
                  {[
                    { label: "Date", value: "deadline" },
                    { label: "Importance", value: "-importance" },
                    { label: "Estimated Time", value: "estimated_minutes" },
                  ].map((option) => (
                    <MenuItem key={option.value}>
                      {({ focus }) => (
                        <button
                          onClick={() => setSortBy(option.value)}
                          className={`${
                            focus ? "bg-blue-50 text-primary" : "text-gray-700"
                          } ${sortBy === option.value ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {option.label}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {pastTasks.length > 0 && (
          <TaskListSection
            title="Past (7 days)"
            tasks={pastTasks}
            onToggleComplete={(id: number) => { void handleToggleComplete(id); }}
            onTaskClick={handleTaskClick}
            isCollapsible={true}
            defaultCollapsed={true}
          />
        )}
        {overdueTasks.length > 0 && (
          <TaskListSection
            title="Overdue"
            tasks={overdueTasks}
            onToggleComplete={(id: number) => { void handleToggleComplete(id); }}
            onTaskClick={handleTaskClick}
          />
        )}
        <TaskListSection
          title="Today"
          tasks={todayTasks}
          onToggleComplete={(id: number) => { void handleToggleComplete(id); }}
          onTaskClick={handleTaskClick}
        />
        
        {upcomingTasks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black flex items-center">
                Upcoming
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">
                  {upcomingTasks.length}
                </span>
              </h3>
            </div>
            <div className="space-y-6">
              {sortedUpcomingDates.map((date) => (
                <div key={date} className="relative">
                  <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {formatDayLabel(date)}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {groupedUpcomingTasks[date].length} {groupedUpcomingTasks[date].length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedUpcomingTasks[date].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={(id: number) => { void handleToggleComplete(id); }}
                        onClick={handleTaskClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleNewTask}
          className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-primary hover:text-primary hover:bg-blue-50 transition-colors flex items-center justify-center font-medium"
        >
          <span className="material-icons mr-2">add</span>
          Add New Task
        </button>
      </div>

      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        onSubmit={(data) => { void handleSubmitTask(data); }}
        onDelete={(id) => { void handleDeleteTask(id); }}
        initialData={selectedTask}
      />
    </AppLayout>
  );
};

export default TaskList;