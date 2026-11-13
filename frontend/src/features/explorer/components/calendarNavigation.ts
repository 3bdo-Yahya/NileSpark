export function adjacentPeriod(periods: string[], current: string, key: string): string | null {
  const index = periods.indexOf(current)
  if (index < 0) return null
  const offset =
    key === 'ArrowRight'
      ? 1
      : key === 'ArrowLeft'
        ? -1
        : key === 'ArrowDown'
          ? 12
          : key === 'ArrowUp'
            ? -12
            : null
  return offset === null ? null : (periods[index + offset] ?? null)
}

type HorizontalViewport = {
  clientWidth: number
  scrollWidth: number
  scrollLeft: number
  getBoundingClientRect: () => { left: number }
  scrollTo: (options: ScrollToOptions) => void
}

/** Reveal a cell only inside its horizontal scroller; never move the document. */
export function revealCalendarMonth(
  viewport: HorizontalViewport,
  cell: { getBoundingClientRect: () => { left: number; right: number } },
  reducedMotion: boolean,
): void {
  const maxScroll = viewport.scrollWidth - viewport.clientWidth
  if (maxScroll <= 0) return
  const left = viewport.getBoundingClientRect().left
  const right = left + viewport.clientWidth
  const rect = cell.getBoundingClientRect()
  const delta = rect.left < left ? rect.left - left : rect.right > right ? rect.right - right : 0
  const next = Math.max(0, Math.min(maxScroll, viewport.scrollLeft + delta))
  if (next !== viewport.scrollLeft)
    viewport.scrollTo({ left: next, behavior: reducedMotion ? 'instant' : 'smooth' })
}
