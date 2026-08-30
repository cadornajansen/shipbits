import { SiteContainer } from "@/components/layout/site-container"
import FeaturedSection from "@/components/landing/featured-section"
import { ProductDirectory } from "@/components/landing/product-directory"
import { LandingSubmissionCta } from "@/components/submissions/landing-submission-cta"
import { getCategories } from "@/features/products/queries"
import { getPublicCategories, getPublicDirectoryProducts } from "@/features/products/public-queries"
import Link from "next/link"

export default async function Page() {
  const [categories, publicCategories, products] = await Promise.all([
    getCategories(),
    getPublicCategories(),
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
          {publicCategories.some((category) => category.productCount > 0) ? (
            <section id="categories" className="w-full border-t py-10">
              <h2 className="font-outfit text-2xl font-semibold">Browse by category</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {publicCategories.filter((category) => category.productCount > 0).map((category) => (
                  <li key={category.id}><Link href={`/categories/${category.slug}`} className="inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-foreground/30">{category.name} <span className="ml-1 text-muted-foreground">{category.productCount}</span></Link></li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </SiteContainer>
    </main>
  )
}
