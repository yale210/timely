/**
 * A functional component that renders the login page.
 * @returns The rendered login page component.
 */
export default function Login() {
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
        Login
    </div>
  )
}
