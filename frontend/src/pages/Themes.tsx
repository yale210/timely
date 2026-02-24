import {ThemeButton, FontButton, AppNavbar} from "../components/index.ts"

function themeController(themeName : string) :void {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem("theme", themeName);
  console.log("changed theme")
}

function fontController(fontName: string) :void {
  document.documentElement.dataset.font = fontName;
  localStorage.setItem("font", fontName);
  console.log("font changed")
}

/**
 * Renders the standalone themes and fonts selection page.
 */
export default function Themes(){
  return(
  <div>
    <div>
      <AppNavbar />
    </div>
    
    <div>
      <main className="mx-auto px-6 lg:px-8 py-10">

        <h1 className="text-3xl"> Themes </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <ThemeButton title="dark" themeChangeFunction={themeController}/>
          <ThemeButton title="light" themeChangeFunction={themeController}/>
          <ThemeButton title="retro" themeChangeFunction={themeController}/>
          <ThemeButton title="bento" themeChangeFunction={themeController}/>
          <ThemeButton title="taro" themeChangeFunction={themeController}/>
        </section>

        <h1 className="text-3xl"> Fonts </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <FontButton title="poppins" fontChangeFunction={fontController}/>
          <FontButton title="pacifico" fontChangeFunction={fontController}/>
          <FontButton title="comic-sans" fontChangeFunction={fontController}/>
          <FontButton title="bitcount" fontChangeFunction={fontController}/>
          <FontButton title="bebas-neue" fontChangeFunction={fontController}/>
          </section>

    </main>
    </div>
  </div>
  )
}
