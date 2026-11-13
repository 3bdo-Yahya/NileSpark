import type { ReactNode } from 'react'
type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'
const tones: Record<BadgeTone, string> = {
  neutral: 'text-secondary',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border border-stroke bg-panel/65 px-3 py-2 font-mono text-[10px] leading-normal tracking-wider uppercase ${tones[tone]}`}
    >
      <span className="size-[5px] shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}
