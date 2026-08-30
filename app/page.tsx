import { SiteContainer } from "@/components/layout/site-container"
import FeaturedSection from "@/components/landing/featured-section"
import { ProductDirectory } from "@/components/landing/product-directory"
import { LandingSubmissionCta } from "@/components/submissions/landing-submission-cta"
import { getCategories } from "@/features/products/queries"
import { getPublicDirectoryProducts } from "@/features/products/public-queries"

export default async function Page() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getPublicDirectoryProducts(),
  ])

  return (
    <main>
      <SiteContainer className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex w-fit items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 font-outfit font-medium shadow-xs">
            Curated products <span className="opacity-40">/</span> Listings from
            ₱1
          </div>
          <h1 className="mt-4 font-outfit text-5xl font-bold">
            Discover what Filipinos are shipping.
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            A curated directory of apps, tools, and products worth checking out.
          </p>
          <LandingSubmissionCta categories={categories} />
          <FeaturedSection products={products.slice(0, 3)} />
          <ProductDirectory products={products.slice(3, 10)} startRank={4} />
        </div>
      </SiteContainer>
    </main>
  )
}
