import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}
export function TextField({ label, hint, error, id, className = '', ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const description =
    [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`grid content-start gap-2 ${className}`}>
      <label htmlFor={inputId} className="eyebrow">
        {label}
      </label>
      <input
        className="min-h-12 w-full min-w-0 rounded-lg border border-stroke-strong bg-raised px-4 py-3 text-label text-paper placeholder:text-muted disabled:cursor-not-allowed disabled:text-muted aria-invalid:border-danger"
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={description}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-label leading-normal text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-label leading-normal text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
