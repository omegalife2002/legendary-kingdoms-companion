import styles from './StepBar.module.css'

/**
 * StepBar — a horizontal control bar:
 *   [ − ] [ −big ] [ label / editable number ] [ +big ] [ + ]
 *
 * Props:
 *   value        number
 *   onChange     (newValue) => void
 *   min          number (default 0)
 *   max          number (optional)
 *   label        string shown above the bar (optional)
 *   bigStep      number for the inner ±big buttons (default 0 = hide them)
 *   colorBar     bool — if true, fills bar green→red based on value/max
 *   max          required when colorBar=true
 */
export default function StepBar({ value, onChange, min = 0, max, label, bigStep = 0, colorBar = false }) {
  const pct = (colorBar && max) ? Math.max(0, Math.min(1, value / max)) : null

  // Interpolate green (#4a9a50) → red (#8b1a1a) based on pct
  function barColor(p) {
    const r = Math.round(0x4a + (0x8b - 0x4a) * (1 - p))
    const g = Math.round(0x9a + (0x1a - 0x9a) * (1 - p))
    const b = Math.round(0x50 + (0x1a - 0x50) * (1 - p))
    return `rgb(${r},${g},${b})`
  }

  function clamp(v) {
    let n = typeof v === 'string' ? parseInt(v) : v
    if (isNaN(n)) n = min
    if (n < min) n = min
    if (max !== undefined && n > max) n = max
    return n
  }

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.bar}>
        {bigStep > 0 && (
          <button className={styles.stepBtn} onClick={() => onChange(clamp(value - bigStep))}>−{bigStep}</button>
        )}
        <button className={styles.stepBtn} onClick={() => onChange(clamp(value - 1))}>−</button>

        <div className={styles.track} style={colorBar ? { background: '#d4c49a' } : {}}>
          {colorBar && pct !== null && (
            <div
              className={styles.fill}
              style={{ width: `${pct * 100}%`, background: barColor(pct) }}
            />
          )}
          <input
            className={styles.numInput}
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={e => onChange(clamp(e.target.value))}
          />
        </div>

        <button className={styles.stepBtn} onClick={() => onChange(clamp(value + 1))}>+</button>
        {bigStep > 0 && (
          <button className={styles.stepBtn} onClick={() => onChange(clamp(value + bigStep))}>+{bigStep}</button>
        )}
      </div>
    </div>
  )
}
