import "../styles/index_theme.css"

interface textButtonProps {
  title: string;
  themeChangeFunction : (themeName: string) => void;
}

export default function TextButton({title, themeChangeFunction}: textButtonProps) {
  return(
    <div data-theme={title}>
      <button onClick={() => themeChangeFunction(title)} className="hover:border-[var(--border)] hover:border-2 flex p-1 justify-center items-center w-full rounded-lg bg-[var(--background)] text-[var(--primary-color)] group hover:scale-110"> 
        {title}

        <div className="absolute right-4 ml-auto flex gap-2 group-hover:opacity-100 opacity-0">
          <div className="rounded-full w-4 h-4 bg-[var(--primary-color)]"></div>
          <div className="rounded-full w-4 h-4 bg-[var(--primary)]"></div>
          <div className="rounded-full w-4 h-4 bg-[var(--border)]"></div>
        </div>
       

      </button>
    </div>
  )
}


