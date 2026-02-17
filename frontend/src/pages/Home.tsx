import { Navbar, Footer } from "@/components/index"
import heroImage from "@/assets/hero-content-img.svg"
import { Link } from "react-router-dom"
import { useEffect } from "react"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    //const savedFont = localStorage.getItem("font");
    
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
    <div className="bg-[var(--background)] font-[var--(--primary-font)]">
      <Navbar />
    
      <div className="relative isolate px-6 lg:px-8">

        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#34d399] to-[#60a5fa] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        
        <div className="mx-auto max-w-7xl py-16 sm:py-24 sm:pt-32">
          <div className="flex flex-col gap-12 lg:flex-row md:flex-row">

            <div className="flex-[3]">
              <div className="hidden sm:mb-8 sm:flex sm:justify-start">
                <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                  Work Timeless. {' '}
                  <Link to="/signup" className="font-semibold text-indigo-600">
                    <span aria-hidden="true" className="absolute inset-0" />
                    Make an Account <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              
              <div className="text-left">
                <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
                  Plan Your Day. <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">Protect Your Time.</span>
                </h1>
                <p className="mt-8 text-md font-medium text-pretty text-gray-500 sm:max-w-md md:max-w-lg lg:max-w-xl">
                  A simple personal scheduler that helps you capture tasks, block time, and stay on top of deadlines—
                  without turning your calendar into a horror movie.
                </p>
                <div className="mt-10 flex items-center justify-start gap-x-6">
                  <Link
                    to="/signup"
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Get started
                  </Link>
                  <Link to="/signup" className="text-sm/6 font-semibold text-gray-900">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-[2] flex justify-center items-center">
              <img src={heroImage} className="w-full lg:w-96 sm:w-82 w-48" alt="Person managing schedule"/>
            </div>
            
          </div>
        </div>

      </div>

      <Footer />
    </div>

  )
}
