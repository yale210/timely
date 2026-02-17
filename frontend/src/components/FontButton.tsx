interface fontProps {
  title: string;
  fontChangeFunction : (fontName : string) => void;
}

export default function FontButton({title, fontChangeFunction} : fontProps) {
  return(
    <div>
      <button onClick={() => fontChangeFunction(title)}> {title} </button>
    </div>
  )
}


