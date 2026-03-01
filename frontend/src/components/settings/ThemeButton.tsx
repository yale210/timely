import "@/styles/index_theme.css"

interface textButtonProps {
  title: string;
  themeChangeFunction : (themeName: string) => void;
}

/**
 * Renders a button that applies a theme when selected.
 * @param root0 - Component props.
 * @param root0.title - The theme name and identifier.
 * @param root0.themeChangeFunction - Callback to update the active theme.
 */
export default function TextButton({title, themeChangeFunction}: textButtonProps) {
  return(
    <div data-theme={title}>
      <button onClick={() => themeChangeFunction(title)} className="hover:border-[var(--border)] hover:border-2 flex p-1 justify-center items-center w-full rounded-lg bg-[var(--background)] text-[var(--text-color)] group hover:scale-110"> 
        {title}

        <div className="absolute right-4 ml-auto flex gap-2 group-hover:opacity-100 opacity-0">
          <div className="rounded-full w-4 h-4 bg-[var(--text-color)]" />
          <div className="rounded-full w-4 h-4 bg-[var(--primary)]" />
          <div className="rounded-full w-4 h-4 bg-[var(--border)]" />
        </div>
       

      </button>
    </div>
  )
}
