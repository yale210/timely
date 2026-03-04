interface FontProps {
  title: string;
  fontChangeFunction: (fontName: string) => void;
}

/**
 * Renders a button that applies a font theme when selected.
 * @param root0 - Component props.
 * @param root0.title - The font label and identifier.
 * @param root0.fontChangeFunction - Callback to update the active font.
 */
export default function FontButton({ title, fontChangeFunction }: FontProps) {
  return(
    <div data-font={title}>
      <button onClick={() => fontChangeFunction(title)} className="flex border-2 hover:border-(--border) hover:border-2 justify-center items-center w-full rounded-lg bg-(--background) text-(--primary-color) border-(--border) group hover:scale-110 "> {title} </button>
    </div>
  )
}

