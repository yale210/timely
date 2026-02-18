/**
 * A functional component that renders the signup page.
 * @returns The rendered signup page component.
 */
export default function Signup() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");    
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      console.log("loaded saved theme")
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);

  return (
    <div>
        Signup
    </div>
  )
}
