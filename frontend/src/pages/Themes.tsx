import {TextButton, FontButton, Navbar} from "../components/index.ts"

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

export default function Themes(){
  return(
  <div className="bg-[var(--background)] font-[var(--primary-font)] text-[var(--primary-color)] min-h-screen p-4 grid grid-rows-2">
    <div>
      <Navbar />
    </div>
    
    <div>
      <main className="mx-auto px-6 lg:px-8 py-10">

        <h1 className="text-3xl"> Themes </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <TextButton title="dark" themeChangeFunction={themeController}/>
          <TextButton title="light" themeChangeFunction={themeController}/>
          <TextButton title="retro" themeChangeFunction={themeController}/>
          <TextButton title="bento" themeChangeFunction={themeController}/>
          <TextButton title="taro" themeChangeFunction={themeController}/>
        </section>

        <h1 className="text-3xl"> Fonts </h1>
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <FontButton title="poppins" fontChangeFunction={fontController}/>
          <FontButton title="pacifico" fontChangeFunction={fontController}/>
        </section>

    </main>
    </div>
  </div>
  )
}
