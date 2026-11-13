import type { HTMLAttributes } from 'react'
export function Surface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-panel border border-stroke bg-panel p-[clamp(1.25rem,2.5vw,2rem)] ${className}`}
    />
  )
}
