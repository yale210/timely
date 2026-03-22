import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { type Category } from "@/types";

type TaskCompletionFilter = "all" | "completed" | "pending";

interface TaskListToolbarProps {
  search: string;
  sortBy: string;
  categories: Category[];
  filterCategory: number | null;
  filterCompleted: TaskCompletionFilter;
  filterHighImportance: boolean;
  filterQuickWins: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onCompletedChange: (value: TaskCompletionFilter) => void;
  onToggleHighImportance: () => void;
  onToggleQuickWins: () => void;
  showSearch?: boolean;
  containerClassName?: string;
}

const TaskListToolbar = ({
  search,
  sortBy,
  categories,
  filterCategory,
  filterCompleted,
  filterHighImportance,
  filterQuickWins,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onCompletedChange,
  onToggleHighImportance,
  onToggleQuickWins,
  showSearch = true,
  containerClassName,
}: TaskListToolbarProps) => {
  return (
    <div className={containerClassName ?? "px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"}>
      {showSearch ? (
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-gray-400">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            placeholder="Search tasks..."
          />
        </div>
      ) : null}
      <div className="flex items-center space-x-2">
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="material-icons text-base mr-1.5">filter_list</span>
            Filter
          </MenuButton>
          <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
            <div className="p-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</div>
              {(["all", "completed", "pending"] as TaskCompletionFilter[]).map((status) => (
                <MenuItem key={status}>
                  {({ focus }) => (
                    <button
                      onClick={() => onCompletedChange(status)}
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
                    onClick={onToggleHighImportance}
                    className={`${
                      focus ? "bg-blue-50 text-primary" : "text-gray-700"
                    } ${filterHighImportance ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                  >
                    <span
                      className={`material-icons text-sm mr-2 ${
                        filterHighImportance ? "text-primary" : "text-gray-400"
                      }`}
                    >
                      {filterHighImportance ? "check_box" : "check_box_outline_blank"}
                    </span>
                    High Importance Only
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={onToggleQuickWins}
                    className={`${
                      focus ? "bg-blue-50 text-primary" : "text-gray-700"
                    } ${filterQuickWins ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                  >
                    <span
                      className={`material-icons text-sm mr-2 ${
                        filterQuickWins ? "text-primary" : "text-gray-400"
                      }`}
                    >
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
                    onClick={() => onCategoryChange(null)}
                    className={`${
                      focus ? "bg-blue-50 text-primary" : "text-gray-700"
                    } ${filterCategory === null ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                  >
                    All Categories
                  </button>
                )}
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id}>
                  {({ focus }) => (
                    <button
                      onClick={() => onCategoryChange(category.id)}
                      className={`${
                        focus ? "bg-blue-50 text-primary" : "text-gray-700"
                      } ${filterCategory === category.id ? "bg-blue-50 text-primary font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                    >
                      {category.text}
                    </button>
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Menu>

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
                      onClick={() => onSortChange(option.value)}
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
  );
};

export default TaskListToolbar;

