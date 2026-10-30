import type { ReactElement } from "react"
import {
  agentPose,
  type AgentShape,
  type AgentCompanionState,
} from "@/lib/agent-companion-motion"

type ArtProps = { shape: AgentShape; state: AgentCompanionState; id: string }

/** Original Figma paths, split into named layers so motion never alters the source geometry. */
export function AgentCharacterArt({
  shape,
  state,
  id,
}: ArtProps): ReactElement {
  const pose = agentPose(shape, state)
  switch (shape) {
    case "lavender-bot":
      return (
        <>
          <defs>
            <clipPath id={`${id}-scan`}>
              <rect x="33" y="28" width="48" height="20" rx="10" />
            </clipPath>
          </defs>
          <g data-agent-part="body" {...pose["body"]}>
            <path
              d="M22 70.4066C22 60.7932 29.7932 53 39.4066 53H74.5934C84.2068 53 92 60.7932 92 70.4066C92 85.0937 80.0937 97 65.4066 97H48.5934C33.9063 97 22 85.0937 22 70.4066Z"
              fill="#B3B8D4"
            />
            <g data-agent-part="bar-top" {...pose["bar-top"]}>
              <rect
                x="31"
                y="66"
                width="52"
                height="9"
                rx="4.5"
                fill="#979CBB"
              />
            </g>
            <g data-agent-part="bar-bottom" {...pose["bar-bottom"]}>
              <rect
                x="37"
                y="82"
                width="39"
                height="9"
                rx="4.5"
                fill="#979CBB"
              />
            </g>
          </g>
          <g data-agent-part="head" {...pose["head"]}>
            <rect
              x="21"
              y="15"
              width="71"
              height="45"
              rx="22.5"
              fill="#D9D9D9"
            />
            <g data-agent-part="screen" {...pose["screen"]}>
              <rect
                x="30"
                y="19"
                width="54"
                height="36"
                rx="18"
                fill="#262334"
              />
            </g>
            <g data-agent-part="visor" {...pose["visor"]}>
              <rect
                x="28"
                y="20"
                width="58"
                height="36"
                rx="18"
                fill="#262334"
              />
              <rect
                x="32.5"
                y="27.5"
                width="49"
                height="21"
                rx="10.5"
                fill="#2C674F"
                stroke="black"
              />
            </g>
            <g clipPath={`url(#${id}-scan)`}>
              <g data-agent-part="work-scan" {...pose["work-scan"]}>
                <rect
                  x="33"
                  y="28"
                  width="5"
                  height="20"
                  fill="#73FFAF"
                  fillOpacity="0.22"
                />
                <path d="M37 28V48" stroke="#A7FFCD" strokeWidth="1.2" />
              </g>
            </g>
            <g data-agent-part="gaze" {...pose["gaze"]}>
              <g data-agent-part="normal-eyes" {...pose["normal-eyes"]}>
                <g data-agent-part="eye-left" {...pose["eye-left"]}>
                  <rect
                    x="43"
                    y="30"
                    width="6"
                    height="16"
                    rx="3"
                    fill="#39FF8A"
                  />
                </g>
                <g data-agent-part="eye-right" {...pose["eye-right"]}>
                  <rect
                    x="64"
                    y="30"
                    width="6"
                    height="16"
                    rx="3"
                    fill="#39FF8A"
                  />
                </g>
              </g>
              <g data-agent-part="alternate-eyes" {...pose["alternate-eyes"]}>
                <rect
                  x="40"
                  y="36"
                  width="13"
                  height="5"
                  rx="2.5"
                  fill="#39FF8A"
                />
                <rect
                  x="61"
                  y="36"
                  width="13"
                  height="5"
                  rx="2.5"
                  fill="#39FF8A"
                />
              </g>
            </g>
          </g>
        </>
      )
    case "orange-bot":
      return (
        <>
          <g data-agent-part="work-idea-a" {...pose["work-idea-a"]}>
            <path
              d="M96 24Q97 29 102 30Q97 31 96 36Q95 31 90 30Q95 29 96 24Z"
              fill="#FFC1A0"
            />
          </g>
          <g data-agent-part="work-idea-b" {...pose["work-idea-b"]}>
            <path
              d="M17 53Q18 56 21 57Q18 58 17 61Q16 58 13 57Q16 56 17 53Z"
              fill="#FD8752"
            />
          </g>
          <g data-agent-part="body" {...pose["body"]}>
            <path
              d="M42 87C42 78.7157 48.7157 72 57 72C65.2843 72 72 78.7157 72 87V89.6C72 92.0301 70.0301 94 67.6 94H46.4C43.9699 94 42 92.0301 42 89.6V87Z"
              fill="#FD6222"
            />
          </g>
          <g data-agent-part="head" {...pose["head"]}>
            <path
              d="M28 39C28 29.0589 36.0589 21 46 21H68C77.9411 21 86 29.0589 86 39V53C86 61.8366 78.8366 69 70 69H44C35.1634 69 28 61.8366 28 53V39Z"
              fill="#FD6222"
            />
            <path
              d="M32 43C32 33.0589 40.0589 25 50 25H64C73.9411 25 82 33.0589 82 43V49C82 57.8366 74.8366 65 66 65H48C39.1634 65 32 57.8366 32 49V43Z"
              fill="#241D2F"
            />
            <path
              d="M27.2727 51C25.4653 51 24 49.5347 24 47.7273L24 44.2727C24 42.4653 25.4652 41 27.2727 41C27.6744 41 28 41.3256 28 41.7273L28 50.2727C28 50.6744 27.6744 51 27.2727 51Z"
              fill="#241D2F"
            />
            <path
              d="M86.7273 40C88.5347 40 90 41.4653 90 43.2727L90 46.7273C90 48.5347 88.5347 50 86.7273 50C86.3256 50 86 49.6744 86 49.2727L86 40.7273C86 40.3256 86.3256 40 86.7273 40Z"
              fill="#241D2F"
            />
            <path
              d="M59.5 53C59.7761 53 60.0042 53.2254 59.9584 53.4977C59.921 53.7203 59.8584 53.9385 59.7716 54.1481C59.6209 54.512 59.3999 54.8427 59.1213 55.1213C58.8427 55.3999 58.512 55.6209 58.1481 55.7716C57.7841 55.9224 57.394 56 57 56C56.606 56 56.2159 55.9224 55.8519 55.7716C55.488 55.6209 55.1573 55.3999 54.8787 55.1213C54.6001 54.8427 54.3791 54.512 54.2284 54.1481C54.1416 53.9385 54.079 53.7203 54.0416 53.4977C53.9958 53.2254 54.2239 53 54.5 53L57 53H59.5Z"
              fill="white"
            />
            <g data-agent-part="antenna" {...pose["antenna"]}>
              <path
                d="M72.344 14.7042C72.8634 14.5462 73.3768 15.3634 73.1052 15.8335C71.4817 18.6441 72.7268 21.5913 73 22C73.3342 22.5 39.6395 21.5 46.9026 21C53.798 20.5253 58.3482 18.9603 72.344 14.7042Z"
                fill="#FD6222"
              />
            </g>
            <g data-agent-part="gaze" {...pose["gaze"]}>
              <g data-agent-part="sleeping-eyes" {...pose["sleeping-eyes"]}>
                <path
                  d="M41 45Q46 49 51 45M63 45Q68 49 73 45"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
              <g data-agent-part="normal-eyes" {...pose["normal-eyes"]}>
                <g data-agent-part="eye-left" {...pose["eye-left"]}>
                  <circle cx="46" cy="45" r="5" fill="white" />
                </g>
                <g data-agent-part="eye-right" {...pose["eye-right"]}>
                  <circle cx="68" cy="45" r="5" fill="white" />
                </g>
              </g>
              <g data-agent-part="alternate-eyes" {...pose["alternate-eyes"]}>
                <path
                  d="M40 47.5C39.4477 47.5 38.9921 47.0497 39.0768 46.5039C39.156 45.9931 39.296 45.4923 39.4948 45.0126C39.8214 44.2239 40.3002 43.5074 40.9038 42.9038C41.5074 42.3002 42.2239 41.8214 43.0126 41.4948C43.8012 41.1681 44.6464 41 45.5 41C46.3536 41 47.1988 41.1681 47.9874 41.4948C48.7761 41.8214 49.4926 42.3002 50.0962 42.9038C50.6998 43.5074 51.1786 44.2239 51.5052 45.0126C51.704 45.4923 51.844 45.9931 51.9232 46.5039C52.0079 47.0497 51.5523 47.5 51 47.5L45.5 47.5L40 47.5Z"
                  fill="white"
                />
                <path
                  d="M63 47.5C62.4477 47.5 61.9921 47.0497 62.0768 46.5039C62.156 45.9931 62.296 45.4923 62.4948 45.0126C62.8214 44.2239 63.3002 43.5074 63.9038 42.9038C64.5074 42.3002 65.2239 41.8214 66.0126 41.4948C66.8012 41.1681 67.6464 41 68.5 41C69.3536 41 70.1988 41.1681 70.9874 41.4948C71.7761 41.8214 72.4926 42.3002 73.0962 42.9038C73.6998 43.5074 74.1786 44.2239 74.5052 45.0126C74.704 45.4923 74.844 45.9931 74.9232 46.5039C75.0079 47.0497 74.5523 47.5 74 47.5L68.5 47.5L63 47.5Z"
                  fill="white"
                />
              </g>
              <g data-agent-part="star-eyes" {...pose["star-eyes"]}>
                <path
                  d="M45.1221 40.6098C45.5011 39.9148 46.4989 39.9148 46.8779 40.6098L47.6419 42.0106C47.7857 42.2743 48.0405 42.4594 48.3357 42.5147L49.904 42.8084C50.6821 42.9541 50.9904 43.9031 50.4466 44.4783L49.3505 45.6377C49.1441 45.856 49.0468 46.1555 49.0854 46.4534L49.2908 48.0357C49.3926 48.8207 48.5853 49.4072 47.8702 49.0678L46.4288 48.3836C46.1575 48.2547 45.8425 48.2547 45.5712 48.3836L44.1298 49.0678C43.4147 49.4072 42.6074 48.8207 42.7092 48.0357L42.9146 46.4534C42.9532 46.1555 42.8559 45.856 42.6495 45.6377L41.5534 44.4783C41.0096 43.9031 41.3179 42.9541 42.096 42.8084L43.6643 42.5147C43.9595 42.4594 44.2143 42.2743 44.3581 42.0106L45.1221 40.6098Z"
                  fill="white"
                />
                <path
                  d="M66.1221 40.6098C66.5011 39.9148 67.4989 39.9148 67.8779 40.6098L68.6419 42.0106C68.7857 42.2743 69.0405 42.4594 69.3357 42.5147L70.904 42.8084C71.6821 42.9541 71.9904 43.9031 71.4466 44.4783L70.3505 45.6377C70.1441 45.856 70.0468 46.1555 70.0854 46.4534L70.2908 48.0357C70.3926 48.8207 69.5853 49.4072 68.8702 49.0678L67.4288 48.3836C67.1575 48.2547 66.8425 48.2547 66.5712 48.3836L65.1298 49.0678C64.4147 49.4072 63.6074 48.8207 63.7092 48.0357L63.9146 46.4534C63.9532 46.1555 63.8559 45.856 63.6495 45.6377L62.5534 44.4783C62.0096 43.9031 62.3179 42.9541 63.096 42.8084L64.6643 42.5147C64.9595 42.4594 65.2143 42.2743 65.3581 42.0106L66.1221 40.6098Z"
                  fill="white"
                />
              </g>
            </g>
          </g>
        </>
      )
    case "pink-cat":
      return (
        <>
          <defs>
            <linearGradient
              id={`${id}-cat-0`}
              x1="56.5"
              y1="28"
              x2="56.5"
              y2="89"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F72A48" />
              <stop offset="1" stopColor="#FF6E84" />
            </linearGradient>
            <linearGradient
              id={`${id}-cat-1`}
              x1="34.8481"
              y1="43.0568"
              x2="39.5494"
              y2="74.7096"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F72A48" />
              <stop offset="1" stopColor="#FF4C66" />
            </linearGradient>
            <linearGradient
              id={`${id}-cat-2`}
              x1="79.9468"
              y1="43.0568"
              x2="75.2456"
              y2="74.7096"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F72A48" />
              <stop offset="1" stopColor="#FF4C66" />
            </linearGradient>
          </defs>
          <g data-agent-part="body" {...pose["body"]}>
            <rect
              x="16"
              y="28"
              width="81"
              height="61"
              rx="30.5"
              fill={`url(#${id}-cat-0)`}
            />
            <g data-agent-part="gaze" {...pose["gaze"]}>
              <g data-agent-part="sleeping-eyes" {...pose["sleeping-eyes"]}>
                <path
                  d="M33 60Q41 66 49 60M65 60Q73 66 81 60"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>
              <g data-agent-part="normal-eyes" {...pose["normal-eyes"]}>
                <g data-agent-part="eye-left" {...pose["eye-left"]}>
                  <g>
                    <path
                      d="M50.9655 59.5122C50.2777 68.4235 43.5565 75.366 35.9533 75.0186C28.3501 74.6712 22.7441 67.1655 23.4319 58.2542C24.1198 49.3428 30.841 42.4004 38.4441 42.7478C46.0473 43.0952 51.6533 50.6009 50.9655 59.5122Z"
                      fill="white"
                    />
                    <path
                      d="M48.386 58.3386C48.5739 63.9312 45.5771 68.6219 41.6924 68.8156C37.8077 69.0093 34.5062 64.6326 34.3183 59.0401C34.1303 53.4475 37.1272 48.7568 41.0119 48.5631C44.8966 48.3694 48.1981 52.746 48.386 58.3386Z"
                      fill={`url(#${id}-cat-1)`}
                    />
                  </g>
                </g>
                <g data-agent-part="eye-right" {...pose["eye-right"]}>
                  <g>
                    <path
                      d="M63.8294 59.5122C64.5172 68.4235 71.2384 75.366 78.8416 75.0186C86.4448 74.6712 92.0508 67.1655 91.363 58.2542C90.6752 49.3428 83.954 42.4004 76.3508 42.7478C68.7476 43.0952 63.1416 50.6009 63.8294 59.5122Z"
                      fill="white"
                    />
                    <path
                      d="M66.4089 58.3386C66.221 63.9312 69.2178 68.6219 73.1025 68.8156C76.9872 69.0093 80.2888 64.6326 80.4767 59.0401C80.6646 53.4475 77.6677 48.7568 73.783 48.5631C69.8983 48.3694 66.5968 52.746 66.4089 58.3386Z"
                      fill={`url(#${id}-cat-2)`}
                    />
                  </g>
                </g>
              </g>
              <g data-agent-part="alternate-eyes" {...pose["alternate-eyes"]}>
                <path
                  d="M34 59.5C39.7738 56.8656 43.0574 56.8012 49 59.5"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M65 59.5C70.7738 56.8656 74.0574 56.8012 80 59.5"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <g data-agent-part="whiskers-left" {...pose["whiskers-left"]}>
              <rect
                x="21.4303"
                y="83.0484"
                width="5"
                height="16"
                rx="2.5"
                transform="rotate(49.1676 21.4303 83.0484)"
                fill="#F72A48"
              />
              <rect
                x="15.7934"
                y="77"
                width="5"
                height="10.7602"
                rx="2.5"
                transform="rotate(65.5254 15.7934 77)"
                fill="#F72A48"
              />
            </g>
            <g data-agent-part="whiskers-right" {...pose["whiskers-right"]}>
              <rect
                width="5"
                height="16"
                rx="2.5"
                transform="matrix(-0.653848 0.756626 0.756626 0.653848 92.9231 82.0484)"
                fill="#F72A48"
              />
              <rect
                width="5"
                height="10.7602"
                rx="2.5"
                transform="matrix(-0.41429 0.910145 0.910145 0.41429 98.56 76)"
                fill="#F72A48"
              />
            </g>
            <g data-agent-part="ear-left" {...pose["ear-left"]}>
              <g>
                <path
                  d="M48 28.5C31.5 11 17.5 4.99999 24 39.5L48 28.5Z"
                  fill="#F72A48"
                />
                <path
                  d="M25.6577 35.0789C22.7278 14.6289 30.0214 17.7102 38.9342 28.2477C39.4217 28.8241 39.1037 29.7096 38.368 29.8793C33.5379 30.9937 30.7523 32.5425 27.3539 35.6621C26.7556 36.2113 25.7728 35.8827 25.6577 35.0789Z"
                  fill="#FE8688"
                />
              </g>
            </g>
            <g data-agent-part="ear-right" {...pose["ear-right"]}>
              <g>
                <path
                  d="M68 28.7768C82.1652 14.1035 94.1841 9.07264 88.6039 38L68 28.7768Z"
                  fill="#F72A48"
                />
                <path
                  d="M87.1808 34.293C89.6961 17.1463 83.4346 19.7298 75.783 28.5653C75.3645 29.0486 75.6375 29.791 76.269 29.9333C80.4157 30.8677 82.8071 32.1663 85.7246 34.7821C86.2382 35.2425 87.082 34.967 87.1808 34.293Z"
                  fill="#FE8688"
                />
              </g>
            </g>
          </g>
          <g data-agent-part="work-key-left" {...pose["work-key-left"]}>
            <path
              d="M34 104H48"
              stroke="#FFB2BF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          <g data-agent-part="work-key-right" {...pose["work-key-right"]}>
            <path
              d="M66 104H80"
              stroke="#FFB2BF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          <g data-agent-part="work-paw-left" {...pose["work-paw-left"]}>
            <ellipse cx="41" cy="96" rx="7.5" ry="4" fill="#FF6E84" />
            <path
              d="M39 96V98M43 96V98"
              stroke="#FFC4CD"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
          <g data-agent-part="work-paw-right" {...pose["work-paw-right"]}>
            <ellipse cx="73" cy="96" rx="7.5" ry="4" fill="#FF6E84" />
            <path
              d="M71 96V98M75 96V98"
              stroke="#FFC4CD"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        </>
      )
    case "lime-bloom":
      return (
        <>
          <g data-agent-part="work-seed-a" {...pose["work-seed-a"]}>
            <ellipse rx="2.2" ry="4" fill="#C1FF8E" />
          </g>
          <g data-agent-part="work-seed-b" {...pose["work-seed-b"]}>
            <ellipse rx="1.7" ry="3.2" fill="#91FF37" />
          </g>
          <g data-agent-part="body" {...pose["body"]}>
            <g data-agent-part="lobe-0" {...pose["lobe-0"]}>
              <path
                d="M53.7365 58.8865C45.3498 65.4978 34.5056 67.9368 26.04 57.1978C17.5744 46.4588 14.6931 26.6084 23.0798 19.9972C31.4665 13.3859 49.741 16.9882 58.2066 27.7272C66.6722 38.4662 62.1232 52.2752 53.7365 58.8865Z"
                fill="#91FF37"
              />
            </g>
            <g data-agent-part="lobe-1" {...pose["lobe-1"]}>
              <path
                d="M20.133 87.5532C13.4015 80.178 15.6486 61.254 26.1663 51.6542C36.684 42.0544 51.8107 41.7949 58.5421 49.1701C65.2736 56.5452 70.5165 70.7544 59.9988 80.3542C49.4811 89.954 26.8645 94.9283 20.133 87.5532Z"
                fill="#91FF37"
              />
            </g>
            <g data-agent-part="lobe-2" {...pose["lobe-2"]}>
              <path
                d="M54.5426 58.9876C62.3844 65.1693 79.0705 62.8243 87.6813 51.901C96.2921 40.9778 93.727 24.333 85.8852 18.1514C78.0435 11.9697 58.744 15.6575 50.1331 26.5807C41.5223 37.504 46.7009 52.8059 54.5426 58.9876Z"
                fill="#91FF37"
              />
            </g>
            <g data-agent-part="lobe-3" {...pose["lobe-3"]}>
              <path
                d="M90.902 85.4024C97.6335 78.0273 96.9139 57.7354 86.8399 48.5406C76.7658 39.3457 61.152 44.7297 54.4205 52.1049C47.689 59.48 47.0855 71.6999 57.1596 80.8948C67.2337 90.0896 84.1705 92.7776 90.902 85.4024Z"
                fill="#91FF37"
              />
            </g>
          </g>
          <g data-agent-part="gaze" {...pose["gaze"]}>
            <g data-agent-part="normal-eyes" {...pose["normal-eyes"]}>
              <g data-agent-part="eye-left" {...pose["eye-left"]}>
                <rect
                  x="40"
                  y="41"
                  width="9.375"
                  height="24"
                  rx="4.6875"
                  fill="white"
                />
              </g>
              <g data-agent-part="eye-right" {...pose["eye-right"]}>
                <rect
                  x="64.1071"
                  y="41"
                  width="9.375"
                  height="24"
                  rx="4.6875"
                  fill="white"
                />
              </g>
            </g>
            <g data-agent-part="alternate-eyes" {...pose["alternate-eyes"]}>
              <rect
                x="36"
                y="46"
                width="16.8"
                height="7"
                rx="3.5"
                fill="white"
              />
              <rect
                x="62"
                y="46"
                width="16.8"
                height="7"
                rx="3.5"
                fill="white"
              />
            </g>
          </g>
        </>
      )
  }
}
