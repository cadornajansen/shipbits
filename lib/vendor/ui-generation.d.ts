export type GenerateRun = { cancel(): void; finished: Promise<HTMLElement> }
export function generate(element: HTMLElement, options: {
  mode: "skeleton"
  duration: number
  reveal: "fade"
  fadeDuration: number
  revealAt: number
  delay: number
}): GenerateRun
