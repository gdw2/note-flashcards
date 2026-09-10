interface TimeBarProps {
  fraction: number
}

export function TimeBar({ fraction }: TimeBarProps) {
  const clamped = Math.max(0, Math.min(1, fraction))
  const percent = clamped * 100

  return (
    <div
      className="timebar"
      role="progressbar"
      aria-label="Time remaining"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <div
        className={`timebar-fill${clamped <= 0.2 ? ' is-low' : ''}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
