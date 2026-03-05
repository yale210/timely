import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { type Category } from "@/types";

interface EventListToolbarProps {
  search: string;
  sortBy: string;
  categories: Category[];
  filterCategory: number | null;
  filterRecurring: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onToggleRecurring: () => void;
}

const EventListToolbar = ({
  search,
  sortBy,
  categories,
  filterCategory,
  filterRecurring,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onToggleRecurring,
}: EventListToolbarProps) => {
  return (
    <div className="px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative w-full sm:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="material-icons text-gray-400">search</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
          placeholder="Search events..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="material-icons text-base mr-1.5">filter_list</span>
            Filter
          </MenuButton>
          <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-20">
            <div className="p-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Attributes</div>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={onToggleRecurring}
                    className={`${
                      focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                    } ${filterRecurring ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
                  >
                    <span
                      className={`material-icons text-sm mr-2 ${
                        filterRecurring ? "text-orange-500" : "text-gray-400"
                      }`}
                    >
                      {filterRecurring ? "check_box" : "check_box_outline_blank"}
                    </span>
                    Recurring Only
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
                      focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                    } ${filterCategory === null ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
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
                        focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                      } ${filterCategory === category.id ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
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
                { label: "Date", value: "start_time" },
                { label: "Title (A-Z)", value: "title" },
              ].map((option) => (
                <MenuItem key={option.value}>
                  {({ focus }) => (
                    <button
                      onClick={() => onSortChange(option.value)}
                      className={`${
                        focus ? "bg-orange-50 text-orange-600" : "text-gray-700"
                      } ${sortBy === option.value ? "bg-orange-50 text-orange-600 font-bold" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm`}
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

export default EventListToolbar;
