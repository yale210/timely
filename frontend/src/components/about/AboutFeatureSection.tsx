import useReveal from "@/hooks/common/useReveal"
import type { Feature } from "./aboutFeatures"
import { MOCKUPS } from "./aboutFeatures"

interface AboutFeatureSectionProps {
  feature: Feature
  index: number
}


/**
 * Renders the "About Feature" section with alternating layouts of image and text panels.
 *
 * @param props - The props for the component.
 * @param props.feature - The feature data to display in the section.
 * @param props.index - The index of the feature, used to alternate panel layout.
 * @return The rendered "About Feature" section.
 */
export default function AboutFeatureSection({ feature, index }: AboutFeatureSectionProps) {
  const imageLeft = index % 2 === 0
  const [imageRef, imageVisible] = useReveal()
  const [textRef, textVisible] = useReveal()

  const MockupComponent = MOCKUPS[feature.id]

  const imagePanel = (
    <div
      ref={imageRef}
      style={{
        opacity: imageVisible ? 1 : 0,
        transform: imageVisible ? "none" : `translateX(${imageLeft ? "-32px" : "32px"})`,
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
      className="flex flex-1 items-center justify-center lg:w-1/2 lg:flex-none"
    >
      <div className="w-full max-w-md">
        <MockupComponent />
      </div>
    </div>
  )

  const textPanel = (
    <div
      ref={textRef}
      style={{
        opacity: textVisible ? 1 : 0,
        transform: textVisible ? "none" : `translateX(${imageLeft ? "32px" : "-32px"})`,
        transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
      }}
      className="flex-1 lg:w-1/2 lg:flex-none"
    >
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
        {feature.subtitle}
      </p>
      <h2 className="mb-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        {feature.title}
      </h2>
      <p className="mb-8 text-lg leading-relaxed text-gray-500">{feature.description}</p>
      <ul className="flex flex-col gap-3">
        {feature.highlights.map((highlight) => (
          <li key={highlight} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${feature.accent}`}
            >
              <span className="material-icons" style={{ fontSize: "14px" }}>
                check
              </span>
            </span>
            <span className="text-sm font-medium text-gray-700">{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <section className={`py-16 sm:py-24 ${index % 2 !== 0 ? "bg-gray-50" : "bg-white"}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20">
          {imageLeft ? imagePanel : textPanel}
          {imageLeft ? textPanel : imagePanel}
        </div>
      </div>
    </section>
  )
}
