import { Download } from "lucide-react"
import type { ReactElement } from "react"
import { AnimatedMonoIcon } from "@/components/ui/animated-mono-icon"
import { monoIcons } from "@/lib/mono-icons"

export function MonoIconsGallery(): ReactElement {
  return (
    <section aria-label="Mono icons">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#969696]">
        <span>{monoIcons.length} icons · 24 × 24 · SVG</span>
        <span>Select an icon to download</span>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 min-[68.75rem]:grid-cols-4">
        {monoIcons.map((icon) => (
          <li key={icon.name}>
            <a
              href={icon.href}
              download={`shipbits-${icon.name}.svg`}
              aria-label={`Download ${icon.label} SVG`}
              data-mono-icon-trigger
              className="group block rounded-3xl bg-[#181818] p-3 shadow-(--site-ring) hover:bg-[#1c1c1c] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            >
              <div
                data-mono-icon-preview
                className="flex aspect-[1.25] items-center justify-center rounded-[14px] bg-[#131313] shadow-[inset_0_0_0_1px_rgb(255_255_255/.02),inset_0_0_0_1px_rgb(191_192_203/.1)]"
              >
                <AnimatedMonoIcon name={icon.name} width={64} height={64} />
              </div>
              <div className="flex items-center justify-between gap-2 px-1 pt-4 pb-1 text-sm font-medium text-[#ededed]">
                <span>{icon.label}</span>
                <Download
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-[#777] group-hover:text-white group-focus-visible:text-white"
                />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
