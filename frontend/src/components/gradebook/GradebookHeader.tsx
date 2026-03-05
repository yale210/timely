import type { Dispatch, SetStateAction } from "react"

interface GradebookHeaderProps {
  setModalOpen: Dispatch<SetStateAction<boolean>>
}

/**
 * Render the gradebook page header and add-grade action.
 * @param props - Header callbacks.
 * @returns The header section for the gradebook page.
 */
export default function GradebookHeader(props: GradebookHeaderProps) {
  const { setModalOpen } = props

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl font-bold">Gradebook</h1>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white shadow-sm transition transform duration-150 hover:bg-blue-300 active:scale-95"
        >
          Add grade
        </button>
      </div>
    </div>
  )
}
