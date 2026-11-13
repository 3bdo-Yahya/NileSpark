import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'
type Appearance = {
  variant?: ButtonVariant
  size?: ButtonSize
  startIcon?: ReactNode
  endIcon?: ReactNode
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Appearance & { loading?: boolean }

const base =
  'inline-flex items-center justify-center gap-3 rounded-full border text-label font-semibold leading-tight whitespace-nowrap no-underline transition-[background,border-color,color,transform] duration-150 ease-gentle active:translate-y-0 disabled:cursor-not-allowed disabled:border-stroke disabled:bg-control disabled:text-muted disabled:hover:translate-y-0 disabled:hover:border-stroke disabled:hover:bg-control motion-reduce:transition-none'
const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-brand text-on-brand hover:-translate-y-0.5 hover:bg-brand-hover',
  secondary: 'border-stroke-strong bg-raised text-paper hover:border-muted hover:bg-control',
  ghost: 'border-transparent bg-transparent text-secondary hover:bg-white/5 hover:text-paper',
}
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 py-2.5 text-caption',
  md: 'min-h-12 px-6 py-3',
  lg: 'min-h-13 px-6.5 py-3',
}
const iconClass = 'inline-flex [&>svg]:size-4'

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  startIcon,
  endIcon,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        startIcon && (
          <span className={iconClass} aria-hidden="true">
            {startIcon}
          </span>
        )
      )}
      {children}
      {endIcon && (
        <span className={iconClass} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  )
}
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  className = '',
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Appearance) {
  return (
    <a {...props} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {startIcon && (
        <span className={iconClass} aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon && (
        <span className={iconClass} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </a>
  )
}
