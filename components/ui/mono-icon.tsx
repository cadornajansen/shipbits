"use client"

import { useId, type ReactElement, type SVGProps } from "react"
import type { MonoIconName } from "@/lib/mono-icons"

export type MonoIconProps = Omit<
  SVGProps<SVGSVGElement>,
  "children" | "dangerouslySetInnerHTML"
> & {
  name: MonoIconName
}

export function MonoIcon({
  name,
  width = 24,
  height = 24,
  ...props
}: MonoIconProps): ReactElement {
  const instanceId = useId().replace(/:/g, "")
  const labelled = Boolean(props["aria-label"] || props["aria-labelledby"])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      data-mono-icon={name}
      {...props}
    >
      {renderIcon(name, instanceId)}
    </svg>
  )
}

// Original Figma geometry stays intact inside individually addressable layers.
function renderIcon(name: MonoIconName, instanceId: string): ReactElement {
  switch (name) {
    case "clock":
      return (
        <g data-part="clock">
          <circle cx="12" cy="13.9153" r="8.0847" fill="#505050" />
          <g data-part="clock-minute">
            <rect
              x="11.3892"
              y="9.32711"
              width="1.22165"
              height="5.3698"
              rx="0.610823"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="clock-hour">
            <rect
              x="15.8517"
              y="17.0907"
              width="1.22165"
              height="5.3973"
              rx="0.610823"
              transform="rotate(134.469 15.8517 17.0907)"
              fill="#A6A6A6"
            />
            <rect
              x="15.8517"
              y="17.0907"
              width="1.22165"
              height="5.3973"
              rx="0.610823"
              transform="rotate(134.469 15.8517 17.0907)"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="clock-crown">
            <path
              d="M9.18408 3.79374C9.02349 3.09451 9.45299 2.40099 10.0466 2.40099H13.9534C14.547 2.40099 14.9765 3.09451 14.8159 3.79374L14.6226 4.6355C14.5391 4.99887 14.3117 5.27596 14.0287 5.38482C13.8585 5.45029 13.6711 5.4091 13.4945 5.36368C12.3672 5.07375 11.6339 5.0721 10.5069 5.36298C10.3293 5.4088 10.1409 5.45043 9.96992 5.38429C9.68755 5.27506 9.46072 4.99828 9.3774 4.6355L9.18408 3.79374Z"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="clock-button">
            <path
              d="M17.4147 6.29624C17.9969 5.7141 18.9407 5.7141 19.5229 6.29624C20.105 6.87838 20.105 7.82222 19.5229 8.40436L19.4007 8.5265C19.2346 8.69259 18.9543 8.6381 18.8448 8.43028C18.5071 7.78898 18.1129 7.39195 17.3669 6.9807C17.1643 6.86906 17.1172 6.59377 17.2807 6.43026L17.4147 6.29624Z"
              fill="#A6A6A6"
            />
          </g>
        </g>
      )
    case "light":
      return (
        <g data-part="light">
          <g data-part="light-bulb">
            <path
              d="M17.4391 10.671C17.4391 13.0692 15.0039 15.0132 12 15.0132C8.99609 15.0132 6.56095 13.0692 6.56095 10.671C6.56095 8.2729 8.99609 5.42232 12 5.42232C15.0039 5.42232 17.4391 8.2729 17.4391 10.671Z"
              fill="#505050"
            />
            <path
              d="M6.77539 11.8448C6.60696 11.3772 7.05017 10.9146 7.65956 10.9146H16.3576C16.9617 10.9146 17.4042 11.3696 17.2436 11.8346C16.5629 13.8055 15.9201 15.1682 14.9148 17.2683C14.8256 17.4548 14.6454 17.6063 14.4132 17.6803C12.6111 18.2542 11.4448 18.2611 9.59504 17.6812C9.35792 17.6068 9.1745 17.452 9.08576 17.2613C8.09781 15.139 7.46551 13.7605 6.77539 11.8448Z"
              fill="#505050"
            />
          </g>
          <g data-part="light-base">
            <path
              d="M9.57279 18.9516C9.43778 18.5861 9.76657 18.2243 10.1497 18.295C11.5089 18.5457 12.5217 18.5493 13.8603 18.2978C14.2412 18.2262 14.572 18.5818 14.4411 18.9466C14.1564 19.7397 13.8668 20.3718 13.4487 21.27C13.392 21.3919 13.2884 21.487 13.1605 21.5285C12.2972 21.8081 11.73 21.8114 10.8441 21.529C10.7134 21.4873 10.608 21.3899 10.5515 21.265C10.1423 20.3613 9.85813 19.724 9.57279 18.9516Z"
              fill="#505050"
            />
          </g>
          <g data-part="light-highlight">
            <path
              d="M13.813 7.23534C14.4174 7.38642 15.7167 8.05119 16.0793 9.50161"
              stroke="#A6A6A6"
              strokeLinecap="round"
            />
          </g>
          <g data-part="light-ray-1">
            <rect
              x="6.56095"
              y="7.68172"
              width="1.22165"
              height="1.71892"
              rx="0.610823"
              transform="rotate(123.141 6.56095 7.68172)"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="light-ray-2">
            <rect
              x="8.3875"
              y="6.02407"
              width="1.22165"
              height="2.64004"
              rx="0.610823"
              transform="rotate(144.008 8.3875 6.02407)"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="light-ray-3">
            <rect
              x="10.4019"
              y="4.90609"
              width="1.22165"
              height="3.06374"
              rx="0.610823"
              transform="rotate(160.444 10.4019 4.90609)"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="light-ray-4">
            <rect
              x="12.6108"
              y="4.60593"
              width="1.22165"
              height="3.51028"
              rx="0.610823"
              transform="rotate(-180 12.6108 4.60593)"
              fill="#A6A6A6"
            />
          </g>
        </g>
      )
    case "touch":
      return (
        <g data-part="touch">
          <g data-part="touch-palm">
            <path
              d="M11.1063 12.3016C11.1063 10.6445 12.6892 9.44591 14.2842 9.89523L18.2842 11.0221C19.3619 11.3257 20.1063 12.3088 20.1063 13.4284V18.5C20.1063 19.8807 18.9871 21 17.6063 21H13.6063C12.2256 21 11.1063 19.8807 11.1063 18.5V12.3016Z"
              fill="#505050"
            />
          </g>
          <g data-part="touch-finger">
            <path
              d="M10.1063 5C10.1063 3.89543 11.0018 3 12.1063 3C13.2109 3 14.1063 3.89543 14.1063 5V21H12.1063C11.0018 21 10.1063 20.1046 10.1063 19V5Z"
              fill="#505050"
            />
          </g>
          <g data-part="touch-thumb">
            <path
              d="M4.97953 13.2372C4.5216 12.2571 4.93438 11.0908 5.90691 10.6169C6.91459 10.1259 8.12857 10.5678 8.58492 11.5916L12.7785 21L9.87945 21C9.10272 21 8.39623 20.5503 8.06746 19.8466L4.97953 13.2372Z"
              fill="#505050"
            />
          </g>
          <g data-part="touch-wave">
            <path
              d="M13.1063 2C13.7107 2.15108 15.01 2.81586 15.3726 4.26627"
              stroke="#A6A6A6"
              strokeLinecap="round"
            />
          </g>
          <g data-part="touch-echo" opacity="0">
            <path
              d="M13.1063 2C13.7107 2.15108 15.01 2.81586 15.3726 4.26627"
              stroke="#A6A6A6"
              strokeLinecap="round"
            />
          </g>
        </g>
      )
    case "layers":
      return (
        <g data-part="layers">
          <rect
            x="13"
            y="20"
            width="2"
            height="17"
            rx="1"
            transform="rotate(-180 13 20)"
            fill="#A6A6A6"
          />
          <g data-part="layer-left-middle">
            <path
              d="M10 11L10 14L8.5 14C7.67157 14 7 13.3284 7 12.5C7 11.6716 7.67157 11 8.5 11L10 11Z"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="layer-left-bottom">
            <path
              d="M10 15L10 18L4.5 18C3.67157 18 3 17.3284 3 16.5C3 15.6716 3.67157 15 4.5 15L10 15Z"
              fill="#A6A6A6"
            />
          </g>
          <g data-part="layer-right-top">
            <path
              d="M14 7L14 10L16.5 10C17.3284 10 18 9.32843 18 8.5C18 7.67157 17.3284 7 16.5 7L14 7Z"
              fill="#505050"
            />
          </g>
          <g data-part="layer-right-middle">
            <path
              d="M14 11L14 14L20.5 14C21.3284 14 22 13.3284 22 12.5C22 11.6716 21.3284 11 20.5 11L14 11Z"
              fill="#505050"
            />
          </g>
          <g data-part="layer-right-bottom">
            <path
              d="M14 15L14 18L16.5 18C17.3284 18 18 17.3284 18 16.5C18 15.6716 17.3284 15 16.5 15L14 15Z"
              fill="#505050"
            />
          </g>
          <g data-part="layer-left-top">
            <path
              d="M10 7L10 10L5.5 10C4.67157 10 4 9.32843 4 8.5C4 7.67157 4.67157 7 5.5 7L10 7Z"
              fill="#A6A6A6"
            />
          </g>
        </g>
      )
    case "motion-path":
      return (
        <g data-part="motion-path">
          <g data-part="motion-track">
            <path
              d="M5 8C5 8 8.63636 11.9714 8.63636 17C8.20886 11.1103 12.8732 3.15311 15.9091 17C16.8182 11 19.0909 11 20 14"
              stroke="#505050"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path
            data-part="motion-trace"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            opacity="0"
            d="M5 8C5 8 8.63636 11.9714 8.63636 17C8.20886 11.1103 12.8732 3.15311 15.9091 17C16.8182 11 19.0909 11 20 14"
            stroke="#A6A6A6"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g data-part="motion-dot">
            <circle cx="3.5" cy="5.5" r="1.5" fill="#A6A6A6" />
          </g>
          <g data-part="motion-end">
            <circle
              cx="20.5"
              cy="16.5"
              r="1.1"
              stroke="#505050"
              strokeWidth="0.8"
            />
          </g>
        </g>
      )
    case "agents":
      return (
        <g data-part="agents">
          <circle
            data-part="agent-body"
            cx="12.0847"
            cy="12.0847"
            r="8.0847"
            fill="#505050"
          />
          <g data-part="agent-eyes">
            <g data-part="agent-eye-left">
              <ellipse
                data-part="eye-left"
                cx="14.2406"
                cy="11.522"
                rx="1.33246"
                ry="2.47424"
                transform="rotate(-11.328 14.2406 11.522)"
                fill="#A6A6A6"
              />
            </g>
            <g data-part="agent-eye-right">
              <ellipse
                data-part="eye-right"
                cx="17.961"
                cy="10.6071"
                rx="1"
                ry="2"
                transform="rotate(-11.328 17.961 10.6071)"
                fill="#A6A6A6"
              />
            </g>
          </g>
        </g>
      )
    case "home":
      return (
        <>
          <g data-part="home">
            <g data-part="home-depth" opacity="0">
              <path data-part="side-wall" fill="#686868" />
              <path data-part="roof-depth" fill="#858585" />
            </g>
            <g data-part="home-front">
              <path
                data-part="body"
                d="M4 10.1495C4 9.43777 4.37827 8.77964 4.99328 8.42137L10.915 4.97175C11.5312 4.61278 12.292 4.60909 12.9116 4.96209L18.9899 8.42462C19.6144 8.78035 20 9.44376 20 10.1624V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V10.1495Z"
                fill="#505050"
              />
              <path
                data-part="door"
                d="M9.25 12.9662C9.25 11.4474 10.4812 10.2162 12 10.2162V10.2162C13.5188 10.2162 14.75 11.4474 14.75 12.9662V19H9.25V12.9662Z"
                fill="#A6A6A6"
              />
              <rect
                data-part="roof-right"
                width="12"
                height="1.5"
                rx="0.75"
                transform="matrix(-0.838671 -0.544639 -0.544639 0.838671 21.8411 9.50193)"
                fill="#A6A6A6"
              />
              <rect
                data-part="chimney"
                width="4.5"
                height="1.5"
                rx="0.75"
                transform="matrix(0 -1 -1 0 18.6119 8.5)"
                fill="#A6A6A6"
              />
              <rect
                data-part="roof-left"
                x="2.14663"
                y="9.50193"
                width="12"
                height="1.5"
                rx="0.75"
                transform="rotate(-33 2.14663 9.50193)"
                fill="#A6A6A6"
              />
            </g>
          </g>
        </>
      )
    case "pen":
      return (
        <>
          <g data-part="pen">
            <defs>
              <clipPath
                id={`${instanceId}-pen-ink`}
                clipPathUnits="userSpaceOnUse"
              >
                <rect
                  data-part="ink-clip"
                  x="4.5"
                  y="18"
                  width="4.2"
                  height="2"
                />
              </clipPath>
            </defs>
            <g data-part="pen-head">
              <path
                data-part="nib"
                d="M9.01591 8.15963C9.07477 7.75982 9.36848 7.43473 9.7603 7.33574L17.3179 5.42634C17.9501 5.26662 18.5636 5.74492 18.5629 6.39697L18.5546 14.0058C18.5541 14.4282 18.2883 14.8047 17.8905 14.9466L9.03727 18.1045C8.32672 18.3579 7.60211 17.7633 7.71198 17.0169L9.01591 8.15963Z"
                fill="#505050"
              />
              <circle
                data-part="breather"
                cx="13.8902"
                cy="10.9055"
                r="1.59056"
                fill="#A6A6A6"
              />
              <rect
                data-part="cap"
                x="15.0755"
                y="2.84352"
                width="8.74351"
                height="4.00811"
                rx="1"
                transform="rotate(40.1361 15.0755 2.84352)"
                fill="#A6A6A6"
              />
              <rect
                data-part="slit"
                x="13.3499"
                y="10.5817"
                width="1.30582"
                height="9.03132"
                rx="0.652912"
                transform="rotate(40.1361 13.3499 10.5817)"
                fill="#A6A6A6"
              />
            </g>
            <g data-part="ink-reveal" clipPath={`url(#${instanceId}-pen-ink)`}>
              <rect
                data-part="ink"
                x="8.4987"
                y="18.328"
                width="1.30582"
                height="3.88849"
                rx="0.652912"
                transform="rotate(90 8.4987 18.328)"
                fill="#A6A6A6"
              />
            </g>
          </g>
        </>
      )
    case "folder":
      return (
        <>
          <g data-part="folder">
            <g data-part="paper-sheet">
              <rect
                data-part="paper"
                x="4"
                y="3"
                width="16"
                height="15"
                rx="2"
                fill="#A6A6A6"
              />
              <rect
                data-part="line-long"
                x="6"
                y="4.5"
                width="12"
                height="1.5"
                rx="0.75"
                fill="#505050"
              />
              <rect
                data-part="line-short"
                x="6"
                y="7"
                width="6"
                height="1.5"
                rx="0.75"
                fill="#505050"
              />
            </g>
            <g data-part="folder-front">
              <rect
                data-part="body"
                x="2"
                y="11"
                width="20"
                height="10"
                rx="2"
                fill="#505050"
              />
              <path
                data-part="tab"
                d="M12.4242 9.00772C12.7802 8.38457 13.4429 8 14.1606 8H20C21.1046 8 22 8.89543 22 10V13C22 14.1046 21.1046 15 20 15H12.4464C10.9107 15 9.94798 13.341 10.7099 12.0077L12.4242 9.00772Z"
                fill="#505050"
              />
            </g>
          </g>
        </>
      )
    case "work":
      return (
        <>
          <g data-part="work">
            <g data-part="work-handle">
              <path
                data-part="handle-top"
                d="M8.00057 4C7.44829 4 7 3.55228 7 3C7 2.44772 7.44829 2 8.00057 2C10.9853 2 13.0147 2 15.9994 2C16.5517 2 17 2.44772 17 3C17 3.55228 16.5517 4 15.9994 4C13.0147 4 10.9853 4 8.00057 4Z"
                fill="#A6A6A6"
              />
              <path
                data-part="handle-left"
                d="M7 3.00017C7 2.44789 7.44772 2 8 2C8.55229 2 9 2.44789 9 3.00017C9 4.07241 9 4.92759 9 5.99983C9 6.55211 8.55229 7 8 7C7.44772 7 7 6.55211 7 5.99983C7 4.92759 7 4.07241 7 3.00017Z"
                fill="#A6A6A6"
              />
              <path
                data-part="handle-right"
                d="M15 3.00017C15 2.44789 15.4477 2 16 2C16.5523 2 17 2.44789 17 3.00017C17 4.07241 17 4.92759 17 5.99983C17 6.55211 16.5523 7 16 7C15.4477 7 15 6.55211 15 5.99983C15 4.92759 15 4.07241 15 3.00017Z"
                fill="#A6A6A6"
              />
            </g>
            <rect
              data-part="body"
              x="2"
              y="6"
              width="20"
              height="15"
              rx="2"
              fill="#505050"
            />
            <g data-part="work-front">
              <path
                data-part="front"
                d="M2 12H22V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V12Z"
                fill="#A6A6A6"
              />
              <path
                data-part="strap-left"
                d="M8 12H10V20C10 20.5523 9.55228 21 9 21V21C8.44772 21 8 20.5523 8 20V12Z"
                fill="#505050"
              />
              <path
                data-part="strap-right"
                d="M14 12H16V20C16 20.5523 15.5523 21 15 21V21C14.4477 21 14 20.5523 14 20V12Z"
                fill="#505050"
              />
            </g>
          </g>
        </>
      )
    case "user":
      return (
        <>
          <g data-part="user">
            <circle
              data-part="background"
              cx="12"
              cy="12"
              r="10"
              fill="#505050"
            />
            <g data-part="shoulders-group">
              <mask
                id={`${instanceId}-user-mask-0`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="2"
                y="2"
                width="20"
                height="20"
              >
                <circle
                  data-part="unused-mask-outline"
                  cx="12"
                  cy="12"
                  r="10"
                  fill="#505050"
                />
              </mask>
              <g mask={`url(#${instanceId}-user-mask-0)`}></g>
              <mask
                id={`${instanceId}-user-mask-1`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="2"
                y="2"
                width="20"
                height="20"
              >
                <circle
                  data-part="shoulders-mask-outline"
                  cx="12"
                  cy="12"
                  r="10"
                  fill="#505050"
                />
              </mask>
              <g mask={`url(#${instanceId}-user-mask-1)`}>
                <circle
                  data-part="shoulders"
                  cx="12"
                  cy="24"
                  r="9"
                  fill="#A6A6A6"
                />
              </g>
            </g>
            <circle data-part="head" cx="12" cy="10" r="4" fill="#A6A6A6" />
          </g>
        </>
      )
    case "mic":
      return (
        <>
          <g data-part="mic">
            <path
              data-part="sound-wave-left"
              d="M5.25 6.5C3.25 8.25 3.25 11.75 5.25 13.5"
              stroke="#A6A6A6"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0"
            />
            <path
              data-part="sound-wave-right"
              d="M18.75 6.5C20.75 8.25 20.75 11.75 18.75 13.5"
              stroke="#A6A6A6"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0"
            />
            <rect
              data-part="body"
              x="7"
              y="2"
              width="10"
              height="16"
              rx="5"
              fill="#505050"
            />
            <rect
              data-part="base"
              x="7"
              y="20"
              width="10"
              height="2"
              rx="1"
              fill="#505050"
            />
            <rect
              data-part="base-overlay"
              x="7"
              y="20"
              width="10"
              height="2"
              rx="1"
              fill="#505050"
            />
            <rect
              data-part="stem"
              x="11"
              y="17"
              width="2"
              height="5"
              rx="1"
              fill="#505050"
            />
            <g data-part="grille-left">
              <mask
                id={`${instanceId}-mic-mask-0`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="7"
                y="2"
                width="10"
                height="16"
              >
                <rect
                  data-part="grille-left-mask"
                  x="7"
                  y="2"
                  width="10"
                  height="16"
                  rx="5"
                  fill="#A6A6A6"
                />
              </mask>
              <g mask={`url(#${instanceId}-mic-mask-0)`}>
                <path
                  data-part="grille-left-bottom"
                  d="M7 12H9C9.55228 12 10 12.4477 10 13C10 13.5523 9.55228 14 9 14H7V12Z"
                  fill="#A6A6A6"
                />
                <path
                  data-part="grille-left-top"
                  d="M7 6H9C9.55228 6 10 6.44772 10 7C10 7.55228 9.55228 8 9 8H7V6Z"
                  fill="#A6A6A6"
                />
                <path
                  data-part="grille-left-middle"
                  d="M7 9H9C9.55228 9 10 9.44772 10 10C10 10.5523 9.55228 11 9 11H7V9Z"
                  fill="#A6A6A6"
                />
              </g>
            </g>
            <g data-part="grille-right">
              <mask
                id={`${instanceId}-mic-mask-1`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="7"
                y="2"
                width="10"
                height="16"
              >
                <rect
                  data-part="grille-right-mask"
                  width="10"
                  height="16"
                  rx="5"
                  transform="matrix(-1 0 0 1 17 2)"
                  fill="#A6A6A6"
                />
              </mask>
              <g mask={`url(#${instanceId}-mic-mask-1)`}>
                <path
                  data-part="grille-right-bottom"
                  d="M17 12H15C14.4477 12 14 12.4477 14 13C14 13.5523 14.4477 14 15 14H17V12Z"
                  fill="#A6A6A6"
                />
                <path
                  data-part="grille-right-top"
                  d="M17 6H15C14.4477 6 14 6.44772 14 7C14 7.55228 14.4477 8 15 8H17V6Z"
                  fill="#A6A6A6"
                />
                <path
                  data-part="grille-right-middle"
                  d="M17 9H15C14.4477 9 14 9.44772 14 10C14 10.5523 14.4477 11 15 11H17V9Z"
                  fill="#A6A6A6"
                />
              </g>
            </g>
          </g>
        </>
      )
    case "search":
      return (
        <>
          <g data-part="search">
            <g data-part="search-handle">
              <rect
                data-part="handle"
                x="13.7678"
                y="12"
                width="10.0545"
                height="2.5"
                rx="1.25"
                transform="rotate(45 13.7678 12)"
                fill="#505050"
              />
            </g>
            <circle data-part="rim" cx="9.5" cy="9.5" r="6.5" fill="#505050" />
            <circle data-part="lens" cx="9.5" cy="9.5" r="4.5" fill="#A6A6A6" />
            <defs>
              <clipPath
                id={`${instanceId}-search-lens`}
                clipPathUnits="userSpaceOnUse"
              >
                <circle cx="9.5" cy="9.5" r="4.5" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${instanceId}-search-lens)`}>
              <path
                data-part="lens-reflection"
                d="M6 14L11 5H13L8 14Z"
                fill="#EDEDED"
                opacity="0"
              />
            </g>
          </g>
        </>
      )
    case "settings":
      return (
        <>
          <g
            data-part="settings"
            clipPath={`url(#${instanceId}-settings-clip-0)`}
          >
            <path
              data-part="gear"
              d="M9.41696 4.52619C10.5583 2.52624 13.4417 2.52624 14.583 4.52619V4.52619C15.115 5.45828 16.1078 6.03149 17.181 6.02611V6.02611C19.4837 6.01458 20.9254 8.51166 19.764 10.5001V10.5001C19.2228 11.4268 19.2228 12.5732 19.764 13.4999V13.4999C20.9254 15.4883 19.4837 17.9854 17.181 17.9739V17.9739C16.1078 17.9685 15.115 18.5417 14.583 19.4738V19.4738C13.4417 21.4738 10.5583 21.4738 9.41696 19.4738V19.4738C8.88503 18.5417 7.89219 17.9685 6.81901 17.9739V17.9739C4.51633 17.9854 3.07463 15.4883 4.23597 13.4999V13.4999C4.77721 12.5732 4.77721 11.4268 4.23597 10.5001V10.5001C3.07464 8.51166 4.51633 6.01458 6.81901 6.02611V6.02611C7.89219 6.03149 8.88503 5.45828 9.41696 4.52619V4.52619Z"
              fill="#505050"
            />
            <circle data-part="ring" cx="12" cy="12" r="5" fill="#A6A6A6" />
            <circle data-part="center" cx="12" cy="12" r="2" fill="#505050" />
          </g>
          <defs>
            <clipPath id={`${instanceId}-settings-clip-0`}>
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </>
      )
    case "bell":
      return (
        <>
          <g data-part="bell">
            <path
              data-part="hanger"
              d="M10 4C10 2.89543 10.8954 2 12 2C13.1046 2 14 2.89543 14 4V4.4C14 4.73137 13.7314 5 13.4 5H10.6C10.2686 5 10 4.73137 10 4.4V4Z"
              fill="#A6A6A6"
            />
            <g data-part="bell-shell">
              <path
                data-part="body"
                d="M6 10C6 6.68629 8.68629 4 12 4C15.3137 4 18 6.68629 18 10V16.4444C18 17.3036 17.3036 18 16.4444 18H7.55556C6.69645 18 6 17.3036 6 16.4444V10Z"
                fill="#505050"
              />
              <path
                data-part="rim"
                d="M5 17C5 16.4477 5.44772 16 6 16H18C18.5523 16 19 16.4477 19 17C19 17.5523 18.5523 18 18 18H6C5.44772 18 5 17.5523 5 17Z"
                fill="#959595"
              />
            </g>
            <path
              data-part="clapper"
              d="M9 19.3333C9 20.2538 9.74619 21 10.6667 21H13.3333C14.2538 21 15 20.2538 15 19.3333C15 19.1492 14.8508 19 14.6667 19H9.33333C9.14924 19 9 19.1492 9 19.3333Z"
              fill="#505050"
            />
          </g>
        </>
      )
    case "mail":
      return (
        <>
          <g data-part="mail">
            <rect
              data-part="letter"
              x="6"
              y="6"
              width="12"
              height="10"
              rx="1"
              fill="#D0D0D0"
              opacity="0"
            />
            <rect
              data-part="body"
              x="2"
              y="5"
              width="20"
              height="15"
              rx="2"
              fill="#505050"
            />
            <g data-part="mail-flaps">
              <g data-part="flap-group">
                <mask
                  id={`${instanceId}-mail-mask-0`}
                  mask-type="alpha"
                  maskUnits="userSpaceOnUse"
                  x="2"
                  y="5"
                  width="20"
                  height="15"
                >
                  <rect
                    data-part="flap-mask"
                    x="2"
                    y="5"
                    width="20"
                    height="15"
                    rx="2"
                    fill="#D9D9D9"
                  />
                </mask>
                <g mask={`url(#${instanceId}-mail-mask-0)`}>
                  <path
                    data-part="flap"
                    d="M13.2606 13.9765C12.526 14.5729 11.474 14.5729 10.7394 13.9765L2.51936 7.30269C1.05725 6.1156 1.89665 3.75 3.77999 3.75L20.22 3.75C22.1034 3.75 22.9427 6.1156 21.4806 7.30269L13.2606 13.9765Z"
                    fill="#A6A6A6"
                  />
                  <rect
                    data-part="edge-top"
                    x="2"
                    y="5"
                    width="20"
                    height="1"
                    rx="0.5"
                    fill="#505050"
                  />
                  <path
                    data-part="edge-left"
                    d="M2 5.5C2 5.22386 2.22386 5 2.5 5C2.77614 5 3 5.22386 3 5.5V7.5C3 7.77614 2.77614 8 2.5 8C2.22386 8 2 7.77614 2 7.5V5.5Z"
                    fill="#505050"
                  />
                  <rect
                    data-part="edge-right"
                    x="21"
                    y="5"
                    width="1"
                    height="3"
                    rx="0.5"
                    fill="#505050"
                  />
                </g>
              </g>
              <g data-part="flap-overlay-group">
                <mask
                  id={`${instanceId}-mail-mask-1`}
                  mask-type="alpha"
                  maskUnits="userSpaceOnUse"
                  x="2"
                  y="5"
                  width="20"
                  height="15"
                >
                  <rect
                    data-part="flap-overlay-mask"
                    x="2"
                    y="5"
                    width="20"
                    height="15"
                    rx="2"
                    fill="#D9D9D9"
                  />
                </mask>
                <g mask={`url(#${instanceId}-mail-mask-1)`}>
                  <path
                    data-part="flap-overlay"
                    d="M13.2606 13.9765C12.526 14.5729 11.474 14.5729 10.7394 13.9765L2.51936 7.30269C1.05725 6.1156 1.89665 3.75 3.77999 3.75L20.22 3.75C22.1034 3.75 22.9427 6.1156 21.4806 7.30269L13.2606 13.9765Z"
                    fill="#A6A6A6"
                  />
                  <rect
                    data-part="edge-top-overlay"
                    x="2"
                    y="5"
                    width="20"
                    height="1"
                    rx="0.5"
                    fill="#505050"
                  />
                  <path
                    data-part="edge-left-overlay"
                    d="M2 5.5C2 5.22386 2.22386 5 2.5 5C2.77614 5 3 5.22386 3 5.5V7.5C3 7.77614 2.77614 8 2.5 8C2.22386 8 2 7.77614 2 7.5V5.5Z"
                    fill="#505050"
                  />
                  <rect
                    data-part="edge-right-overlay"
                    x="21"
                    y="5"
                    width="1"
                    height="3"
                    rx="0.5"
                    fill="#505050"
                  />
                </g>
              </g>
            </g>
          </g>
        </>
      )
    case "calendar":
      return (
        <>
          <g data-part="calendar">
            <rect
              data-part="binding-left"
              x="4"
              y="3"
              width="2"
              height="3"
              rx="1"
              fill="#505050"
            />
            <rect
              data-part="binding-right"
              x="18"
              y="3"
              width="2"
              height="3"
              rx="1"
              fill="#505050"
            />
            <rect
              data-part="body"
              x="3"
              y="5"
              width="18"
              height="15"
              rx="2"
              fill="#505050"
            />
            <path
              data-part="header"
              d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V8H3V7Z"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-5"
              x="6"
              y="13"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-6"
              x="9"
              y="13"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-7"
              x="13"
              y="13"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-8"
              x="16"
              y="13"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-1"
              x="6"
              y="10"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-2"
              x="9"
              y="10"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-3"
              x="13"
              y="10"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-4"
              x="16"
              y="10"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-9"
              x="6"
              y="16"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-10"
              x="9"
              y="16"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-11"
              x="13"
              y="16"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
            <rect
              data-part="day-12"
              x="16"
              y="16"
              width="2"
              height="2"
              rx="0.5"
              fill="#A6A6A6"
            />
          </g>
        </>
      )
    case "coffee":
      return (
        <>
          <g data-part="coffee">
            <path
              data-part="steam-left"
              d="M4.5 7C2.5 5.5 5.5 4.5 4 3"
              stroke="#A6A6A6"
              strokeWidth="0.65"
              strokeLinecap="round"
              opacity="0"
            />
            <path
              data-part="steam-right"
              d="M19.5 7C21.5 5.5 18.5 4.5 20 3"
              stroke="#A6A6A6"
              strokeWidth="0.65"
              strokeLinecap="round"
              opacity="0"
            />
            <path
              data-part="cup"
              d="M5.19968 7.18224C5.09247 6.01061 6.01483 5 7.19136 5H16.8086C17.9852 5 18.9075 6.01061 18.8003 7.18225L17.6108 20.1822C17.5166 21.2119 16.6531 22 15.6191 22H8.3809C7.34695 22 6.48344 21.2119 6.38923 20.1822L5.19968 7.18224Z"
              fill="#505050"
            />
            <g data-part="coffee-lid">
              <path
                data-part="lid-top"
                d="M6 4.66667C6 3.19391 7.19391 2 8.66667 2H15.3333C16.8061 2 18 3.19391 18 4.66667V4.66667C18 5.40305 17.403 6 16.6667 6H7.33333C6.59695 6 6 5.40305 6 4.66667V4.66667Z"
                fill="#A6A6A6"
              />
              <path
                data-part="lid-rim"
                d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V7Z"
                fill="#A6A6A6"
              />
            </g>
            <g data-part="sleeve-group">
              <mask
                id={`${instanceId}-coffee-mask-0`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="5"
                y="5"
                width="14"
                height="17"
              >
                <path
                  data-part="sleeve-mask"
                  d="M5.09407 7.34473C4.98399 6.17151 5.90696 5.15789 7.08532 5.15789H16.9147C18.093 5.15789 19.016 6.17151 18.9059 7.34473L17.701 20.1868C17.6046 21.2145 16.7419 22 15.7097 22H8.29026C7.25807 22 6.39543 21.2145 6.29901 20.1868L5.09407 7.34473Z"
                  fill="#505050"
                />
              </mask>
              <g mask={`url(#${instanceId}-coffee-mask-0)`}>
                <rect
                  data-part="sleeve"
                  x="2.22222"
                  y="12.5263"
                  width="19.5556"
                  height="4.21053"
                  fill="#A6A6A6"
                />
              </g>
            </g>
          </g>
        </>
      )
    case "location":
      return (
        <>
          <g data-part="location">
            <ellipse
              data-part="shadow"
              cx="12"
              cy="19"
              rx="7"
              ry="3"
              fill="#505050"
            />
            <g data-part="location-pin">
              <path
                data-part="pin"
                d="M18 8C18 10.7424 15 15.6552 12 20C9 15.6552 6 10.7424 6 8C6 5.25762 8.68629 2 12 2C15.3137 2 18 5.25762 18 8Z"
                fill="#A6A6A6"
              />
              <circle data-part="center" cx="12" cy="8" r="3" fill="#505050" />
            </g>
          </g>
        </>
      )
    case "image":
      return (
        <>
          <g data-part="image">
            <path
              data-part="mountain-left"
              d="M7.14852 9.38264C7.53906 8.74848 8.46094 8.74848 8.85149 9.38264L13.9894 17.7256C14.3997 18.3919 13.9204 19.25 13.1379 19.25H2.86206C2.07959 19.25 1.60026 18.3919 2.01057 17.7256L7.14852 9.38264Z"
              fill="#505050"
            />
            <path
              data-part="mountain-right"
              d="M14.1227 6.60402C14.502 5.91051 15.498 5.91051 15.8773 6.60402L21.9848 17.7701C22.3493 18.4365 21.867 19.25 21.1075 19.25H8.89254C8.13297 19.25 7.65071 18.4365 8.01521 17.7701L14.1227 6.60402Z"
              fill="#505050"
            />
            <g data-part="snow-left-group">
              <mask
                id={`${instanceId}-image-mask-0`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="1"
                y="8"
                width="14"
                height="12"
              >
                <g data-part="snow-left-mask-group">
                  <path
                    data-part="snow-left-mask"
                    d="M7.14852 9.38264C7.53906 8.74848 8.46094 8.74848 8.85149 9.38264L13.9894 17.7256C14.3997 18.3919 13.9204 19.25 13.1379 19.25H2.86206C2.07959 19.25 1.60026 18.3919 2.01057 17.7256L7.14852 9.38264Z"
                    fill="#A6A6A6"
                  />
                </g>
              </mask>
              <g mask={`url(#${instanceId}-image-mask-0)`}>
                <path
                  data-part="snow-left"
                  d="M7.31025 16.3429C7.69648 16.7109 8.30352 16.7109 8.68975 16.3429L14.8505 10.474C15.504 9.85145 15.0634 8.75 14.1607 8.75H1.83928C0.93663 8.75 0.495967 9.85145 1.14953 10.474L7.31025 16.3429Z"
                  fill="#A6A6A6"
                />
              </g>
            </g>
            <g data-part="snow-right-group">
              <mask
                id={`${instanceId}-image-mask-1`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="7"
                y="6"
                width="16"
                height="14"
              >
                <path
                  data-part="snow-right-mask"
                  d="M14.1227 6.60402C14.502 5.91051 15.498 5.91051 15.8773 6.60402L21.9848 17.7701C22.3493 18.4365 21.867 19.25 21.1075 19.25H8.89254C8.13297 19.25 7.65071 18.4365 8.01521 17.7701L14.1227 6.60402Z"
                  fill="#A6A6A6"
                />
              </mask>
              <g mask={`url(#${instanceId}-image-mask-1)`}>
                <path
                  data-part="snow-right"
                  d="M14.2995 17.3125C14.6885 17.6942 15.3115 17.6943 15.7005 17.3125L26.2444 6.96368C26.8834 6.33647 26.4393 5.25 25.5439 5.25H4.45608C3.56066 5.25 3.11657 6.33647 3.75561 6.96368L14.2995 17.3125Z"
                  fill="#A6A6A6"
                />
              </g>
            </g>
            <circle data-part="sun" cx="9.5" cy="6.5" r="1.5" fill="#505050" />
          </g>
        </>
      )
    case "book":
      return (
        <>
          <g data-part="book">
            <path
              data-part="cover"
              d="M4 6C4 4.34315 5.34315 3 7 3H18C19.1046 3 20 3.89543 20 5V20C20 21.1046 19.1046 22 18 22H7C5.34315 22 4 20.6569 4 19V6Z"
              fill="#505050"
            />
            <g data-part="pages-group">
              <mask
                id={`${instanceId}-book-mask-0`}
                mask-type="alpha"
                maskUnits="userSpaceOnUse"
                x="4"
                y="3"
                width="16"
                height="19"
              >
                <path
                  data-part="pages-mask"
                  d="M4 6C4 4.34315 5.34315 3 7 3H18C19.1046 3 20 3.89543 20 5V20C20 21.1046 19.1046 22 18 22H7C5.34315 22 4 20.6569 4 19V6Z"
                  fill="#A6A6A6"
                />
              </mask>
              <g mask={`url(#${instanceId}-book-mask-0)`}>
                <path
                  data-part="pages"
                  d="M6 19.625C6 18.838 6.63799 18.2 7.425 18.2H20V21.05H7.425C6.63799 21.05 6 20.412 6 19.625Z"
                  fill="#A6A6A6"
                />
                <path
                  data-part="page-line"
                  d="M7 19.625C7 19.3627 7.21266 19.15 7.475 19.15H21V20.1H7.475C7.21266 20.1 7 19.8873 7 19.625Z"
                  fill="#505050"
                />
              </g>
            </g>
            <g data-part="bookmark-ribbon">
              <path data-part="bookmark" d="M7 3H11V8H7V3Z" fill="#A6A6A6" />
              <path
                data-part="bookmark-left"
                d="M7 10L7 8L9 8L7 10Z"
                fill="#A6A6A6"
              />
              <path
                data-part="bookmark-right"
                d="M11 10L11 8L9 8L11 10Z"
                fill="#A6A6A6"
              />
            </g>
          </g>
        </>
      )
  }
}
