"use client"

import { useId, useState, type ReactElement } from "react"
import { ChevronDown } from "lucide-react"

const questions = [
  {
    question: "Can I explore the components for free?",
    answer:
      "Yes. Every collection preview and all Studio editors are available without an account or payment.",
  },
  {
    question: "What do I need to use them?",
    answer:
      "The components use React 19 and Tailwind CSS 4. Open a component’s Install tab for its actual dependencies and source files. Some materials also use Paper Shaders. Mono icons is also available as plain SVGs without a framework.",
  },
  {
    question: "How do I install a component?",
    answer:
      "AI Chat has a shadcn registry command. The other components currently use source files from this project. Their Install tabs list what to copy; they are not separate npm packages. Mono icons also offers individual SVG downloads.",
  },
  {
    question: "What is Studio?",
    answer:
      "Studio holds the material editors. Change a preset, adjust the controls, and copy the code generated from your settings. Studio is open to everyone.",
  },
  {
    question: "Do they work with coding agents?",
    answer:
      "Use Copy prompt on a component page to copy its setup requirements and usage example into your coding agent. For source-copy components, give the agent access to this project’s files.",
  },
]

function FAQItem({
  question,
  answer,
}: {
  question: string
  answer: string
}): ReactElement {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <div
      className="group/faq border-t border-white/[.08] last:border-b [&_button]:focus-visible:rounded-md [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-[#ededed] [&_h3_button]:flex [&_h3_button]:w-full [&_h3_button]:items-center [&_h3_button]:justify-between [&_h3_button]:gap-3 [&_h3_button]:py-4 [&_h3_button]:text-left [&_h3_button]:text-[15px] [&_h3_button]:leading-[22px] [&_h3_button]:font-normal [&_svg]:shrink-0 [&_svg]:text-[#cacaca]/70 [&_svg]:transition-transform [&_svg]:duration-250 [&_svg]:ease-[cubic-bezier(.22,1,.36,1)] [&_svg]:motion-reduce:transition-none [&[data-open=true]_svg]:scale-y-[-1]"
      data-open={open}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {question}
          <ChevronDown size={16} />
        </button>
      </h3>
      <div
        id={id}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-250 ease-[cubic-bezier(.22,1,.36,1)] group-data-[open=true]/faq:grid-rows-[1fr] motion-reduce:transition-none [&_p]:mb-4 [&_p]:pr-7 [&_p]:text-sm [&_p]:leading-[22px] [&_p]:text-[#cacaca]/70 [&>div]:overflow-hidden [&>div]:opacity-0 [&>div]:blur-[2px] [&>div]:transition-[opacity,filter] [&>div]:duration-250 [&>div]:ease-[cubic-bezier(.22,1,.36,1)] group-data-[open=true]/faq:[&>div]:opacity-100 group-data-[open=true]/faq:[&>div]:blur-none [&>div]:motion-reduce:transition-none"
        inert={!open}
      >
        <div>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function SiteFAQ(): ReactElement {
  return (
    <section
      className="mx-auto mt-24 w-full max-w-[1008px] max-sm:mt-16"
      aria-labelledby="faq-title"
    >
      <h2
        id="faq-title"
        className="mb-8 text-center font-heading text-[32px] leading-[38px] font-medium tracking-[-.16px] max-[740px]:text-[28px] max-[740px]:leading-[34px]"
      >
        FAQs
      </h2>
      <div className="mx-auto max-w-[640px]">
        {questions.map((item) => (
          <FAQItem key={item.question} {...item} />
        ))}
      </div>
    </section>
  )
}
