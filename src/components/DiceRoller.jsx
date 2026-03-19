import { useState } from 'react'
import styles from './DiceRoller.module.css'

const PRESETS = [
  { label: '1d6', count: 1, sides: 6 },
  { label: '2d6', count: 2, sides: 6 },
  { label: '3d6', count: 3, sides: 6 },
]

function rollDice(count, sides) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
}

export default function DiceRoller() {
  const [count, setCount]   = useState(1)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  function roll(c = count) {
    const dice = rollDice(c, 6)
    const total = dice.reduce((a, b) => a + b, 0)
    const entry = { dice, total, count: c, id: Date.now() }
    setResult(entry)
    setHistory(prev => [entry, ...prev].slice(0, 8))
  }

  function quickRoll(c) {
    setCount(c)
    roll(c)
  }

  return (
    <div className={styles.wrapper}>

      {/* Quick presets */}
      <div className={styles.presets}>
        {PRESETS.map(p => (
          <button key={p.label} className={styles.presetBtn} onClick={() => quickRoll(p.count)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom count */}
      <div className={styles.custom}>
        <div className={styles.customControls}>
          <button className={styles.stepBtn} onClick={() => setCount(v => Math.max(1, v - 1))}>−</button>
          <span className={styles.countVal}>{count}d6</span>
          <button className={styles.stepBtn} onClick={() => setCount(v => Math.min(20, v + 1))}>+</button>
        </div>
        <button className={styles.rollBtn} onClick={() => roll(count)}>
          Roll
        </button>
      </div>

      {/* Latest result */}
      {result && (
        <div className={styles.result}>
          <div className={styles.resultTotal}>{result.total}</div>
          <div className={styles.resultDice}>
            {result.dice.map((d, i) => (
              <span key={i} className={styles.die}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className={styles.history}>
          {history.slice(1).map(h => (
            <div key={h.id} className={styles.historyRow}>
              <span className={styles.historyLabel}>{h.count}d6</span>
              <span className={styles.historyDice}>[{h.dice.join(', ')}]</span>
              <span className={styles.historyTotal}>= {h.total}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
