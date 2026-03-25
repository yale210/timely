interface LogoMarkProps {
  className?: string;
}

/**
 * Renders the Timely mark using the SVG as a mask so it can follow theme colours.
 * @param props - Component props.
 * @param props.className - Optional size classes for the mark.
 * @returns The themed logo mark.
 */
export default function LogoMark({ className = "h-6 w-6" }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-(--primary) ${className}`}
      style={{
        maskImage: "url('/t.svg')",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: "url('/t.svg')",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
