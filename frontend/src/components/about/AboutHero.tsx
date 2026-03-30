import { Link } from "react-router-dom"
import BlurBackground from "@/components/layout/BlurBackground"
import useReveal from "@/hooks/common/useReveal"

/**
 * Hero section for the About page with a fade-and-rise entrance animation.
 * @returns The rendered hero section.
 */
export default function AboutHero() {
  const [ref, visible] = useReveal(0)

  return (
    <div className="relative isolate overflow-hidden bg-white px-6 pb-16 pt-28 sm:pb-24 sm:pt-36 lg:px-8">
      <BlurBackground />
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
        className="mx-auto max-w-3xl text-center"
      >
        <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl lg:text-7xl">
          Everything you need to{" "}
          <span className="bg-linear-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            study smarter
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Timely brings together task management, calendar scheduling, grade tracking, and social
          motivation — all in one seamless platform built for students.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-md bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get started
          </Link>
          <Link to="/login" className="text-sm/6 font-semibold text-gray-900">
            Log in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
