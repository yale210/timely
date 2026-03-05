import React from "react"

/**
 *
 */
export default function GradebookHeader({setModalOpen}: {setModalOpen: React.Dispatch<React.SetStateAction<boolean>>}) {
    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold">Gradebook</h1>
            <div className="flex flex-wrap items-center gap-3">
            <button
                onClick={() => setModalOpen(true)}
                className="rounded-lg bg-primary hover:bg-blue-300 active:scale-95 transition transform duration-150 px-4 py-2.5 text-white text-base font-medium shadow-sm"
            >
                Add grade
            </button>
            </div>
      </div>
        </>
    )
}