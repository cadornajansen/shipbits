import type { ReactElement } from "react"
import { CollectionSidebar } from "@/components/collection-sidebar"
import { EffectIcon } from "@/components/effect-icon"
import { MaterialLab } from "@/components/material-lab"
import { materialDefinitions } from "@/lib/materials/registry"
import type { MaterialKind } from "@/lib/materials/types"

export function MaterialPage({
  material,
}: {
  material: MaterialKind
}): ReactElement {
  const definition = materialDefinitions[material]
  return (
    <div>
      <a
        href={`#${material}-lab`}
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to {definition.title} lab
      </a>
      <div className="mx-auto grid max-w-(--site-width) gap-8 px-(--site-gutter) pt-8 pb-16 lg:grid-cols-[192px_minmax(0,1fr)] lg:gap-12">
        <CollectionSidebar activeEffect={material} />
        <main
          id={`${material}-lab`}
          tabIndex={-1}
          className="min-w-0 outline-none"
        >
          <div className="mb-6">
            <EffectIcon effect={material} className="mb-3 size-10 rounded-xl" />
            <h1 className="text-[32px] font-medium tracking-tight">
              {definition.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {definition.description}
            </p>
          </div>
          <MaterialLab material={material} />
        </main>
      </div>
    </div>
  )
}
