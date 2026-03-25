import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import type { Dispatch, SetStateAction } from "react"

interface GradebookHeaderProps {
  setModalOpen: Dispatch<SetStateAction<boolean>>
  search: string
  sortBy: "date_desc" | "date_asc" | "percentage_desc" | "percentage_asc" | "name_asc"
  performanceFilter: "all" | "excellent" | "good" | "needs_attention"
  selectedCategoryId: number | null
  categories: { id: number; text: string }[]
  onSearchChange: Dispatch<SetStateAction<string>>
  onSortChange: Dispatch<SetStateAction<"date_desc" | "date_asc" | "percentage_desc" | "percentage_asc" | "name_asc">>
  onPerformanceFilterChange: Dispatch<SetStateAction<"all" | "excellent" | "good" | "needs_attention">>
  onCategoryChange: Dispatch<SetStateAction<number | null>>
}

/**
 * Render the gradebook page header and add-grade action.
 * @param props - Header callbacks.
 * @returns The header section for the gradebook page.
 */
export default function GradebookHeader(props: GradebookHeaderProps) {
  const {
    setModalOpen,
    search,
    sortBy,
    performanceFilter,
    selectedCategoryId,
    categories,
    onSearchChange,
    onSortChange,
    onPerformanceFilterChange,
    onCategoryChange,
  } = props

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <h1 className="text-2xl font-semibold text-black">Gradebook</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-icons text-base text-gray-400">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-black placeholder-gray-500 focus:border-primary focus:outline-none"
              placeholder="Search grades"
            />
          </div>

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <span className="material-icons mr-1.5 text-base">filter_list</span>
              Filter
            </MenuButton>
            <MenuItems className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none">
              <div className="p-1">
                <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">Performance</div>
                {[
                  { value: "all", label: "All grades" },
                  { value: "excellent", label: "Excellent (85%+)" },
                  { value: "good", label: "Good (55-84.9%)" },
                  { value: "needs_attention", label: "Needs attention (<55%)" },
                ].map((option) => (
                  <MenuItem key={option.value}>
                    {({ focus }) => (
                      <button
                        onClick={() => onPerformanceFilterChange(option.value as "all" | "excellent" | "good" | "needs_attention")}
                        className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${performanceFilter === option.value ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        {option.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">Category</div>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => onCategoryChange(null)}
                      className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${selectedCategoryId === null ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                    >
                      All categories
                    </button>
                  )}
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id}>
                    {({ focus }) => (
                      <button
                        onClick={() => onCategoryChange(category.id)}
                        className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${selectedCategoryId === category.id ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
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
            <MenuButton className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <span className="material-icons mr-1.5 text-base">sort</span>
              Sort
            </MenuButton>
            <MenuItems className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none">
              <div className="p-1">
                {[
                  { value: "date_desc", label: "Newest first" },
                  { value: "date_asc", label: "Oldest first" },
                  { value: "percentage_desc", label: "Highest percentage" },
                  { value: "percentage_asc", label: "Lowest percentage" },
                  { value: "name_asc", label: "Name" },
                ].map((option) => (
                  <MenuItem key={option.value}>
                    {({ focus }) => (
                      <button
                        onClick={() => onSortChange(option.value as "date_desc" | "date_asc" | "percentage_desc" | "percentage_asc" | "name_asc")}
                        className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${sortBy === option.value ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        {option.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-300"
          >
            <span className="material-icons mr-1 text-base">add</span>
            New
          </button>
        </div>
      </div>
    </header>
  )
}
