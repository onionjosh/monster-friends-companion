import { Icon } from './Icon'

/** Large-tap-target +/- control for at-the-table tracking. */
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
  const atMin = value <= min
  const atMax = max !== undefined && value >= max
  const ic = big ? 24 : 20
  return (
    <div className={`mf-stepper ${big ? 'mf-stepper--big' : 'mf-stepper--md'}`}>
      {label && <span className="mf-stepper__label">{label}</span>}
      <button
        type="button"
        className="mf-stepper__btn"
        aria-label={`decrease ${label ?? 'value'}`}
        disabled={atMin}
        onClick={() => !atMin && onChange(Math.max(min, value - 1))}
      >
        <Icon name="minus" size={ic} />
      </button>
      <span className="mf-stepper__val">{value}</span>
      <button
        type="button"
        className="mf-stepper__btn"
        aria-label={`increase ${label ?? 'value'}`}
        disabled={atMax}
        onClick={() => !atMax && onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
      >
        <Icon name="plus" size={ic} />
      </button>
    </div>
  )
}
