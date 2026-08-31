"use client"

import { useState, type CSSProperties } from "react"

type MarketingDirectory = {
  name: string
  domain: string
  category: string
}

type DirectoryColumn = {
  direction: "down" | "up"
  speed: string
  delay: string
  directories: MarketingDirectory[]
}

const directoryColumns: DirectoryColumn[] = [
  {
    direction: "down",
    speed: "34s",
    delay: "-17s",
    directories: [
      {
        name: "Product Hunt",
        domain: "producthunt.com",
        category: "Product launches",
      },
      {
        name: "BetaList",
        domain: "betalist.com",
        category: "Early-stage",
      },
      {
        name: "Reddit",
        domain: "reddit.com",
        category: "Communities",
      },
      {
        name: "Indie Hackers",
        domain: "indiehackers.com",
        category: "Founder community",
      },
      {
        name: "Hacker News",
        domain: "news.ycombinator.com",
        category: "Tech community",
      },
    ],
  },

  {
    direction: "up",
    speed: "40s",
    delay: "-9s",
    directories: [
      {
        name: "AppSumo",
        domain: "appsumo.com",
        category: "Software deals",
      },
      {
        name: "Uneed",
        domain: "uneed.best",
        category: "Launch platform",
      },
      {
        name: "Toolify",
        domain: "toolify.ai",
        category: "AI tools",
      },
      {
        name: "BetaPage",
        domain: "betapage.co",
        category: "Early-stage",
      },
      {
        name: "Crunchbase",
        domain: "crunchbase.com",
        category: "Company data",
      },
    ],
  },

  {
    direction: "down",
    speed: "37s",
    delay: "-25s",
    directories: [
      {
        name: "G2",
        domain: "g2.com",
        category: "Reviews",
      },
      {
        name: "Capterra",
        domain: "capterra.com",
        category: "Reviews",
      },
      {
        name: "SaaSHub",
        domain: "saashub.com",
        category: "SaaS discovery",
      },
      {
        name: "AlternativeTo",
        domain: "alternativeto.net",
        category: "Alternatives",
      },
      {
        name: "SaaSworthy",
        domain: "saasworthy.com",
        category: "Reviews",
      },
      {
        name: "Trustpilot",
        domain: "trustpilot.com",
        category: "Reviews",
      },
    ],
  },
]

function getDirectoryFavicon(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function DirectoryFavicon({ directory }: { directory: MarketingDirectory }) {
  const [failed, setFailed] = useState(false)

  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-[10px] font-medium text-slate-400">
      <span aria-hidden="true">{directory.name.charAt(0)}</span>

      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getDirectoryFavicon(directory.domain)}
          alt=""
          width={24}
          height={24}
          className="absolute size-6 object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

function DirectoryItem({ directory }: { directory: MarketingDirectory }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-1 py-2.5">
      <DirectoryFavicon directory={directory} />

      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-slate-900">
          {directory.name}
        </p>

        <p className="mt-0.5 truncate text-[10px] leading-none text-slate-400">
          {directory.category}
        </p>
      </div>
    </div>
  )
}

/**
 * One exact marquee cycle.
 *
 * Important:
 * Both copies must have exactly the same dimensions so translating
 * the parent by 50% creates a seamless loop.
 */ function DirectorySequence({
  directories,
  hidden = false,
}: {
  directories: MarketingDirectory[]
  hidden?: boolean
}) {
  return (
    <ul
      className="flex shrink-0 flex-col gap-5 pb-5"
      aria-hidden={hidden || undefined}
    >
      {directories.map((directory) => (
        <li key={`${hidden ? "duplicate-" : ""}${directory.domain}`}>
          <DirectoryItem directory={directory} />
        </li>
      ))}
    </ul>
  )
}

export function MarketingPreviewCard() {
  return (
    <div
      className="directory-marquee relative grid h-[430px] w-full max-w-[640px] min-w-0 grid-cols-2 gap-10 justify-self-center overflow-hidden sm:h-[470px] sm:grid-cols-3 sm:gap-12 lg:h-[500px] lg:gap-14 lg:justify-self-end"
      aria-label="Illustrative directory distribution network"
    >
      {directoryColumns.map((column, index) => (
        <div
          key={`${column.direction}-${index}`}
          className={`min-w-0 overflow-hidden ${
            index === 2 ? "hidden sm:block" : ""
          }`}
        >
          <div
            className={`directory-marquee-track flex flex-col ${
              column.direction === "up"
                ? "directory-marquee-up"
                : "directory-marquee-down"
            }`}
            style={
              {
                "--marquee-speed": column.speed,
                "--marquee-delay": column.delay,
              } as CSSProperties
            }
          >
            {/* Four identical copies = enough buffer to always fill viewport */}
            <DirectorySequence directories={column.directories} />

            <DirectorySequence directories={column.directories} hidden />

            <DirectorySequence directories={column.directories} hidden />

            <DirectorySequence directories={column.directories} hidden />
          </div>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-background via-background/75 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background via-background/75 to-transparent" />

      <style jsx>{`
        .directory-marquee-track {
          animation-duration: var(--marquee-speed);
          animation-delay: var(--marquee-delay);
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          animation-fill-mode: both;
          will-change: transform;
        }

        .directory-marquee-up {
          animation-name: directory-marquee-up;
        }

        .directory-marquee-down {
          animation-name: directory-marquee-down;
        }

        .directory-marquee:hover .directory-marquee-track {
          animation-play-state: paused;
        }

        /*
         * Track contains four identical sequences.
         *
         * 25% of the complete track = exactly one sequence.
         * When the animation loops, the next identical sequence
         * occupies exactly the same position.
         */
        @keyframes directory-marquee-up {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(0, -25%, 0);
          }
        }

        @keyframes directory-marquee-down {
          from {
            transform: translate3d(0, -25%, 0);
          }

          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .directory-marquee-track {
            animation: none;
            transform: none;
            will-change: auto;
          }

          .directory-marquee-track > :global(ul:not(:first-child)) {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}