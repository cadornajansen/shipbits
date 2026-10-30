// Original folder paths: Glass Folder Cards by Kedhareswer Naidu (21st.dev, MIT).
export const FOLDER_WIDTH = 340
export const FOLDER_HEIGHT = 272
export const FOLDER_HEADROOM = 118
export const FOLDER_GUTTER = 38
export const FOLDER_FRAME_WIDTH = FOLDER_WIDTH + FOLDER_GUTTER * 2
export const FOLDER_FRAME_HEIGHT = FOLDER_HEIGHT + FOLDER_HEADROOM + 18
export const MAX_VISIBLE_FILES = 4

export const FOLDER_BACK_PATH =
  "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z"
export const FOLDER_FRONT_PATH =
  "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z"

export function fanSlot(index: number, count: number): number {
  return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1
}

export function folderScale(
  availableWidth: number,
  preferredWidth: number
): number {
  const preferred = Number.isFinite(preferredWidth)
    ? Math.max(160, preferredWidth)
    : FOLDER_WIDTH
  const available = Number.isFinite(availableWidth)
    ? Math.max(0, availableWidth)
    : 0
  return Math.min(preferred / FOLDER_WIDTH, available / FOLDER_FRAME_WIDTH)
}
