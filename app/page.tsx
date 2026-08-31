import { SiteContainer } from "@/components/layout/site-container"
import FeaturedSection from "@/components/landing/featured-section"
import { ProductDirectory } from "@/components/landing/product-directory"
import { LandingSubmissionCta } from "@/components/submissions/landing-submission-cta"
import { getCategories } from "@/features/products/queries"
import {
  getPublicCategories,
  getPublicDirectoryProducts,
} from "@/features/products/public-queries"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { Reveal } from "@/components/motion/reveal"
import { RevealGroup, RevealItem } from "@/components/motion/reveal-group"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data"

export default async function Page() {
  const [categories, publicCategories, products] = await Promise.all([
    getCategories(),
    getPublicCategories(),
    getPublicDirectoryProducts(),
  ])

  return (
    <main>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <SiteContainer className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="flex w-full flex-col items-center gap-5">
          <RevealGroup className="flex w-full flex-col items-center gap-5">
            <RevealItem>
              <div className="flex w-fit items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 font-outfit font-medium shadow-xs">
                Curated products <span className="opacity-40">/</span> Listings
                from ₱1
              </div>
            </RevealItem>
            <RevealItem>
              <h1 className="mt-4 text-center font-outfit text-5xl font-bold md:text-left">
                Discover what Filipinos are shipping.
              </h1>
            </RevealItem>
            <RevealItem>
              <p className="text-center text-lg text-muted-foreground">
                A curated product directory for discovering apps, SaaS,
                developer tools, and startup products built by Filipino
                founders.
              </p>
            </RevealItem>
            <RevealItem>
              <LandingSubmissionCta categories={categories} />
            </RevealItem>
          </RevealGroup>
          <Reveal className="w-full">
            <FeaturedSection products={products.slice(0, 3)} />
          </Reveal>
          <Reveal className="w-full">
            <ProductDirectory products={products.slice(3, 10)} startRank={4} />
          </Reveal>
          {publicCategories.some((category) => category.productCount > 0) ? (
            <Reveal className="w-full">
              <section id="categories" className="w-full py-10">
                <h2 className="font-outfit text-2xl font-semibold">
                  Browse by category
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {publicCategories
                    .filter((category) => category.productCount > 0)
                    .map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/categories/${category.slug}`}
                          className="inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-foreground/30"
                        >
                          {category.name}{" "}
                          <span className="ml-1 text-muted-foreground">
                            {category.productCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            </Reveal>
          ) : null}
          <Reveal className="w-full">
            <section className="grid w-full gap-4 border-t py-10 sm:grid-cols-3">
              <div>
                <h2 className="font-outfit text-lg font-semibold">
                  Explore the directory
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Compare published products by category and open detailed
                  listings.
                </p>
                <Link
                  href="/products"
                  className="mt-3 inline-flex text-sm font-medium text-teal-700 hover:underline"
                >
                  Browse all products
                </Link>
              </div>
              <div>
                <h2 className="font-outfit text-lg font-semibold">
                  Launch resources
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Use practical checks and guides for product launches and
                  distribution.
                </p>
                <Link
                  href="/resources"
                  className="mt-3 inline-flex text-sm font-medium text-teal-700 hover:underline"
                >
                  View founder resources
                </Link>
              </div>
              <div>
                <h2 className="font-outfit text-lg font-semibold">
                  Submit to directories
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Prepare one product profile and track relevant directory
                  submissions.
                </p>
                <Link
                  href="/directory-submission"
                  className="mt-3 inline-flex text-sm font-medium text-teal-700 hover:underline"
                >
                  See directory submission service
                </Link>
              </div>
            </section>
          </Reveal>
        </div>
      </SiteContainer>
    </main>
  )
}
