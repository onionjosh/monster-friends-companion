/** Large-tap-target numeric stepper for at-the-table tracking. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max,
  label,
  big = false,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  label?: string
  big?: boolean
}) {
  const btn = `flex items-center justify-center rounded-lg bg-zinc-200 font-bold active:bg-amber-300 dark:bg-zinc-700 dark:active:bg-amber-600 ${
    big ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-lg'
  }`
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="mr-1 text-xs font-semibold tracking-wide uppercase opacity-70">{label}</span>}
      <button type="button" className={btn} aria-label={`decrease ${label ?? 'value'}`} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span className={`min-w-[2ch] text-center font-bold tabular-nums ${big ? 'text-xl' : ''}`}>{value}</span>
      <button
        type="button"
        className={btn}
        aria-label={`increase ${label ?? 'value'}`}
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
      >
        +
      </button>
    </div>
  )
}
