import type { ReactNode } from "react";

export default function GradebookLayout({ children } : { children: ReactNode }) {
    return (
        <main className="w-full px-6 lg:px-10 pt-2 pb-10">
            { children }
        </main>
    )
}