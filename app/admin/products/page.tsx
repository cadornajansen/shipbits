import { AddProductDialog } from "@/components/admin/products/add-product-dialog"
import { ImportProductDialog } from "@/components/admin/products/import-product-dialog"
import { ProductBoard } from "@/components/admin/products/product-board"
import { getProductBoardData } from "@/features/imports/queries"
import { getCategories } from "@/features/products/queries"

export default async function AdminProductsPage() {
  const [categories, boardData] = await Promise.all([
    getCategories(),
    getProductBoardData(),
  ])

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Add and moderate the products listed in ShipBits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddProductDialog categories={categories} />
          <ImportProductDialog />
        </div>
      </div>
      <ProductBoard categories={categories} data={boardData} />
    </section>
  )
}
