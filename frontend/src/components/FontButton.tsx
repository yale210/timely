interface fontProps {
  title: string;
  fontChangeFunction : (fontName : string) => void;
}

export default function FontButton({title, fontChangeFunction} : fontProps) {
  return(
    <div data-font={title}>
      <button onClick={() => fontChangeFunction(title)} className="flex border-black border-2 hover:border-[var(--border)] hover:border-2 justify-center items-center w-full rounded-lg bg-[var(--background)] text-[var(--primary-color)] border-[var(--border)] group hover:scale-110 "> {title} </button>
    </div>
  )
}


