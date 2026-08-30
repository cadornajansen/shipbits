import assert from "node:assert/strict"
import test from "node:test"

import { directoryPageHref, parseDirectoryPage } from "../features/products/pagination"
import {
  DIRECTORY_SEARCH_MAX_LENGTH,
  parseDirectorySearch,
  toDirectorySearchPattern,
} from "../features/products/search"
import { absoluteUrl, getSiteUrl } from "../lib/site"

test("directory pagination accepts only positive safe integer pages", () => {
  assert.equal(parseDirectoryPage(undefined), 1)
  assert.equal(parseDirectoryPage("1"), 1)
  assert.equal(parseDirectoryPage("20"), 20)
  for (const value of ["0", "-1", "1.5", "01", "x", ["1", "2"], String(Number.MAX_SAFE_INTEGER + 1)]) {
    assert.equal(parseDirectoryPage(value), null)
  }
})

test("directory hrefs omit the implicit first page and keep other params", () => {
  assert.equal(directoryPageHref("/products", 1), "/products")
  assert.equal(directoryPageHref("/products", 3), "/products?page=3")
  assert.equal(directoryPageHref("/products", 1, { q: "ship bits" }), "/products?q=ship+bits")
  assert.equal(directoryPageHref("/products", 2, { q: "ship" }), "/products?q=ship&page=2")
})

test("directory search normalizes and caps the query", () => {
  assert.equal(parseDirectorySearch(undefined), "")
  assert.equal(parseDirectorySearch(["a", "b"]), "")
  assert.equal(parseDirectorySearch("   "), "")
  assert.equal(parseDirectorySearch("  ship   bits "), "ship bits")
  assert.equal(parseDirectorySearch("x".repeat(200)).length, DIRECTORY_SEARCH_MAX_LENGTH)
})

test("directory search patterns strip PostgREST filter metacharacters", () => {
  assert.equal(toDirectorySearchPattern("ship"), "%ship%")
  assert.equal(toDirectorySearchPattern("a,b"), "%a b%")
  assert.equal(toDirectorySearchPattern("100%_off"), "%100 off%")
  assert.equal(toDirectorySearchPattern("or(name.eq.x)"), "%or name.eq.x%")
})

test("site URLs resolve against the configured canonical origin", () => {
  assert.equal(new URL(absoluteUrl("/products/example")).origin, getSiteUrl())
  assert.equal(absoluteUrl("/products/example"), `${getSiteUrl()}/products/example`)
})
