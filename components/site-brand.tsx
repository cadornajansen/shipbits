import Image from "next/image"
import Link from "next/link"
import type { ReactElement } from "react"

export function SiteBrand(): ReactElement {
  return (
    <Link
      href="/"
      className="inline-flex h-[35px] shrink-0 items-center gap-1.5 py-[5px] text-[15px] leading-none font-semibold tracking-[-.01em] whitespace-nowrap transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ededed] motion-reduce:transition-none motion-reduce:hover:scale-100"
      aria-label="Shipbits.dev home"
    >
      <span
        className="flex size-6 flex-col justify-center gap-0.5"
        aria-hidden="true"
      >
        <Image src="/hero/shipbits-stripe.svg" width={20} height={6} alt="" />
        <Image
          src="/hero/shipbits-middle.svg"
          width={20}
          height={6}
          alt=""
          className="-scale-x-100"
        />
        <Image src="/hero/shipbits-stripe.svg" width={20} height={6} alt="" />
      </span>
      <span>
        Shipbits<span className="text-[#cacaca]/70">.dev</span>
      </span>
    </Link>
  )
}
