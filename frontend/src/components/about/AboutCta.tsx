import { Link } from "react-router-dom"
import useReveal from "@/hooks/common/useReveal"

/**
 * Call-to-action section at the bottom of the About page.
 * @returns The rendered CTA section.
 */
export default function AboutCta() {
  const [ref, visible] = useReveal()

  return (
    <section className="bg-indigo-600 py-16 sm:py-24">
      <div
        ref={ref}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
        className="mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          Ready to take control of your time?
        </h2>
        <p className="mt-4 text-lg text-indigo-200">
          Join students who plan smarter, study better, and actually stay on top of their work.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow hover:bg-indigo-50"
          >
            Create your free account
          </Link>
          <Link to="/login" className="text-sm font-semibold text-white">
            Already have an account? Log in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
