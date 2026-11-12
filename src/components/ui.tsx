import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Check as CheckIcon, ChevronDown, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useUI } from '../ui-store'

/* ------------------------------------------------------------------ buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type ButtonSize = 'sm' | 'md'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-accent text-[#0b0e08] hover:bg-[#d5ff85] active:bg-[#bde95f] font-semibold',
  secondary:
    'border-line bg-surface2 text-ink hover:border-line-strong hover:bg-surface3',
  ghost:
    'border-transparent bg-transparent text-muted hover:bg-white/5 hover:text-ink',
  danger:
    'border-rose/25 bg-rose/10 text-rose hover:border-rose/40 hover:bg-rose/15',
  soft: 'border-accent/20 bg-accent/10 text-accent hover:border-accent/35 hover:bg-accent/15',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-[12px]',
  md: 'h-10 gap-2 rounded-[10px] px-3.5 text-[13px]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn('icon-button', className)}
      {...rest}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- badge */

type BadgeTone = 'default' | 'accent' | 'warn' | 'danger' | 'info' | 'muted'

const BADGE_TONES: Record<BadgeTone, string> = {
  default: '',
  accent: 'chip-accent',
  warn: 'chip-warn',
  danger: 'chip-danger',
  info: 'chip-online',
  muted: 'opacity-70',
}

export function Badge({
  tone = 'default',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return <span className={cn('chip', BADGE_TONES[tone], className)}>{children}</span>
}

export function AccentDot({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color }}
    />
  )
}

/* ------------------------------------------------------------------ progress */

export function ProgressBar({
  value,
  color = 'var(--color-accent)',
  className,
  height = 5,
}: {
  value: number
  color?: string
  className?: string
  height?: number
}) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  return (
    <div className={cn('progress-track', className)} style={{ height }}>
      <div className="progress-fill" style={{ width: `${safe * 100}%`, background: color }} />
    </div>
  )
}

export function Ring({
  value,
  size = 92,
  stroke = 6,
  color = 'var(--color-accent)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safe)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- forms */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] text-rose">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field', className)} {...rest} />
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field min-h-[84px] resize-y leading-relaxed', className)} {...rest} />
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn('field appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        aria-hidden
      />
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: ReactNode
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[13px] font-medium text-ink">
          {label}
        </label>
        {hint ? <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{hint}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent/40 bg-accent/90' : 'border-line-strong bg-surface3',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white transition-transform',
            checked ? 'translate-x-[19px] bg-[#0b0e08]' : 'translate-x-[3px] bg-muted',
          )}
        />
      </button>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      data-done={checked}
      className={cn('check-button', className)}
    >
      <CheckIcon size={12} strokeWidth={3.4} />
    </button>
  )
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: ReactNode; title?: string }>
  ariaLabel?: string
  className?: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('segmented', className)}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          title={option.title}
          data-active={option.value === value}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------- layout */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
        <h1 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[620px] text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function SectionHeading({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-[11.5px] leading-relaxed text-faint">{hint}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('empty-state', className)}>
      {icon ? <div className="text-faint/70">{icon}</div> : null}
      <p className="text-[13px] font-medium text-muted">{title}</p>
      {hint ? <p className="max-w-[300px] text-[11.5px] leading-relaxed text-faint">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function StatTile({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  color?: string
  icon?: ReactNode
}) {
  return (
    <div className="panel-flat relative overflow-hidden p-4">
      {color ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[2px]"
          style={{ background: color, opacity: 0.7 }}
        />
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{label}</span>
        {icon ? <span className="text-faint">{icon}</span> : null}
      </div>
      <div className="mono mt-2 text-[24px] font-semibold leading-none tracking-[-0.04em] text-ink">
        {value}
      </div>
      {sub ? <div className="mt-1.5 text-[11px] leading-snug text-faint">{sub}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  children,
  wide,
  label,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  wide?: boolean
  label: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open ? (
        <div
          className={cn('modal-panel', wide && 'modal-panel-wide')}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </dialog>
  )
}

export function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  onClose: () => void
}) {
  return (
    <div className="modal-header">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-1.5">{eyebrow}</div> : null}
        <h2 className="text-[18px] font-semibold leading-tight tracking-[-0.025em] text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      <IconButton label="Close" onClick={onClose} className="-mr-1 -mt-1 border-transparent bg-transparent">
        <X size={16} />
      </IconButton>
    </div>
  )
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="modal-footer">{children}</div>
}

/* ------------------------------------------------------------------- toasts */

export function Toasts() {
  const toasts = useUI((state) => state.toasts)
  const dismiss = useUI((state) => state.dismissToast)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(74px+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:items-end md:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full max-w-[360px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12px] shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-md',
            toast.tone === 'error'
              ? 'border-rose/30 bg-[#241312]/95 text-rose'
              : toast.tone === 'success'
                ? 'border-accent/25 bg-[#131a10]/95 text-accent'
                : 'border-line-strong bg-[#111613]/95 text-ink',
          )}
          style={{ animation: 'toast-in 0.22s cubic-bezier(0.22,0.75,0.25,1) both' }}
        >
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-faint transition-colors hover:text-ink"
            onClick={() => dismiss(toast.id)}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ github */

export function GithubMark({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>
}
