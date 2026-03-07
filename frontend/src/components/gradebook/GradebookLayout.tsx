import type { ReactNode } from "react";

/**
 * Layout component for the gradebook page.
 * @param props - The component props
 * @param props.children - The content to render inside the layout
 * @returns The rendered layout with children
 */
export default function GradebookLayout({ children } : { children: ReactNode }) {
    return (
        <main className="w-full px-6 lg:px-10 pt-2 pb-10">
            { children }
        </main>
    )
}