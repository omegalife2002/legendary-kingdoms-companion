import { useState } from 'react'
import StepBar from './StepBar'
import styles from './MassCombat.module.css'

const POSITIONS = [
  { id: 'lf-front',   label: 'Left Flank Front',   row: 'front',   col: 'left'   },
  { id: 'c-front',    label: 'Centre Front',        row: 'front',   col: 'centre' },
  { id: 'rf-front',   label: 'Right Flank Front',   row: 'front',   col: 'right'  },
  { id: 'lf-support', label: 'Left Flank Support',  row: 'support', col: 'left'   },
  { id: 'c-support',  label: 'Centre Support',      row: 'support', col: 'centre' },
  { id: 'rf-support', label: 'Right Flank Support', row: 'support', col: 'right'  },
]

function makeEnemyUnit() {
  return { name: '', strength: 3, morale: 3, routed: false }
}
function emptyYourBf() {
  const bf = {}
  POSITIONS.forEach(p => { bf[p.id] = null })
  return bf
}
function freshEnemyBf() {
  const bf = {}
  POSITIONS.forEach(p => { bf[p.id] = makeEnemyUnit() })
  return bf
}

// ── Your-side slot ────────────────────────────────────────────────────────────
function YourSlot({ label, unit, allUnits, usedIndices, onAssign, onClear, onToggleRouted, onStrength, onMorale }) {
  const [open, setOpen] = useState(false)
  const isRouted = unit?.routed

  return (
    <div className={`${styles.slot} ${unit ? styles.slotFilled : ''} ${isRouted ? styles.slotRouted : ''}`}>
      <div className={styles.slotLabel}>{label}</div>

      {unit ? (
        <div className={styles.slotUnit}>
          <input className={styles.enemyName} value={unit.name || ''} readOnly
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'normal', fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', borderBottom: 'none', cursor: 'default' }} />

          <div className={styles.enemyStats}>
            <div className={styles.enemyStatRow}>
              <span className={styles.enemyStatLabel}>Strength</span>
              <div className={styles.enemyStatBar}>
                <StepBar value={unit.strength ?? 1} min={0} max={20}
                  onChange={v => onStrength(v)} />
              </div>
            </div>
            <div className={styles.enemyStatRow}>
              <span className={styles.enemyStatLabel}>Morale</span>
              <div className={styles.enemyStatBar}>
                <StepBar value={unit.morale ?? 3} min={0} max={10}
                  onChange={v => onMorale(v)} />
              </div>
            </div>

            <div className={styles.slotActions}>
              <button
                className={`${styles.routeBtn} ${isRouted ? styles.routeBtnActive : ''}`}
                onClick={onToggleRouted}>
                {isRouted ? '⚑ Routed — Unrout' : '⚑ Mark Routed'}
              </button>
              <button className={styles.slotClear} onClick={onClear}>✕</button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.slotEmpty}>
          {open ? (
            <div className={styles.assignList}>
              {allUnits.length === 0
                ? <span className={styles.noUnits}>No army units — add them in the Armies tab.</span>
                : allUnits.map((u, i) => {
                  const taken = usedIndices.has(i)
                  return (
                    <button key={i}
                      className={`${styles.assignBtn} ${taken ? styles.assignBtnTaken : ''}`}
                      disabled={taken}
                      onClick={() => { if (!taken) { onAssign(i); setOpen(false) } }}>
                      {u.name || 'Unnamed Unit'}
                      <span className={styles.assignMeta}>
                        {taken ? 'Deployed' : `Str ${u.strength} · Mor ${u.morale}`}
                      </span>
                    </button>
                  )
                })
              }
              <button className={styles.assignCancel} onClick={() => setOpen(false)}>Cancel</button>
            </div>
          ) : (
            <button className={styles.assignTrigger} onClick={() => setOpen(true)}>+ Assign Unit</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Enemy-side slot ───────────────────────────────────────────────────────────
function EnemySlot({ label, unit, onUpdate }) {
  const isRouted = unit?.routed
  const hasName  = !!(unit?.name?.trim())

  return (
    <div className={`${styles.slot} ${hasName ? styles.slotFilledEnemy : ''} ${isRouted ? styles.slotRouted : ''}`}>
      <div className={styles.slotLabel}>{label}</div>

      <input className={styles.enemyName} value={unit?.name || ''}
        placeholder="No enemy unit..."
        onChange={e => onUpdate({ ...unit, name: e.target.value })} />

      {/* Always show Strength + Morale once name exists */}
      {hasName && (
        <div className={styles.enemyStats}>
          <div className={styles.enemyStatRow}>
            <span className={styles.enemyStatLabel}>Strength</span>
            <div className={styles.enemyStatBar}>
              <StepBar value={unit.strength ?? 3} min={0} max={20}
                onChange={v => onUpdate({ ...unit, strength: v })} />
            </div>
          </div>
          <div className={styles.enemyStatRow}>
            <span className={styles.enemyStatLabel}>Morale</span>
            <div className={styles.enemyStatBar}>
              <StepBar value={unit.morale ?? 3} min={0} max={10}
                onChange={v => onUpdate({ ...unit, morale: v })} />
            </div>
          </div>

          <div className={styles.slotActions}>
            <button
              className={`${styles.routeBtn} ${isRouted ? styles.routeBtnActive : ''}`}
              onClick={() => onUpdate({ ...unit, routed: !isRouted })}>
              {isRouted ? '⚑ Routed — Unrout' : '⚑ Mark Routed'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MassCombat({ armies }) {
  const [yourBf,  setYourBf]  = useState(emptyYourBf)
  const [enemyBf, setEnemyBf] = useState(freshEnemyBf)

  function assignYour(posId, unitIdx) {
    setYourBf(prev => ({ ...prev, [posId]: { ...armies[unitIdx], _armyIdx: unitIdx, routed: false } }))
  }
  function clearYour(posId) {
    setYourBf(prev => ({ ...prev, [posId]: null }))
  }
  function updateYour(posId, field, value) {
    setYourBf(prev => ({ ...prev, [posId]: { ...prev[posId], [field]: value } }))
  }
  function updateEnemy(posId, updated) {
    setEnemyBf(prev => ({ ...prev, [posId]: updated }))
  }

  // Morale controls for all your units at once
  function adjustAllMorale(delta) {
    setYourBf(prev => {
      const next = { ...prev }
      POSITIONS.forEach(p => {
        if (next[p.id]) next[p.id] = { ...next[p.id], morale: Math.max(0, Math.min(10, (next[p.id].morale || 0) + delta)) }
      })
      return next
    })
  }
  function adjustAllEnemyMorale(delta) {
    setEnemyBf(prev => {
      const next = { ...prev }
      POSITIONS.forEach(p => {
        if (next[p.id]?.name) next[p.id] = { ...next[p.id], morale: Math.max(0, Math.min(10, (next[p.id].morale || 0) + delta)) }
      })
      return next
    })
  }

  function resetBattlefield() {
    if (!window.confirm('Reset the battlefield? All assignments will be cleared.')) return
    setYourBf(emptyYourBf())
    setEnemyBf(freshEnemyBf())
  }

  const front   = POSITIONS.filter(p => p.row === 'front')
  const support = POSITIONS.filter(p => p.row === 'support')

  // Which army indices are already deployed somewhere on the battlefield
  const usedIndices = new Set(
    POSITIONS.map(p => yourBf[p.id]?._armyIdx).filter(i => i !== undefined && i !== null)
  )

  return (
    <div className={styles.wrapper}>

      <div className={styles.battlefieldCol}>

        {/* ── Enemy Forces ── */}
        <div className={styles.forceSection}>
          <div className={styles.forceHeader}>
            <div className={styles.forceTitle} style={{ color: 'var(--crimson)' }}>Enemy Forces</div>
            <div className={styles.moraleControls}>
              <span className={styles.moraleControlsLabel}>All Morale</span>
              <button className={`${styles.moraleBtn} ${styles.moraleBtnEnemy}`} onClick={() => adjustAllEnemyMorale(-1)}>−1</button>
              <button className={`${styles.moraleBtn} ${styles.moraleBtnEnemy}`} onClick={() => adjustAllEnemyMorale(1)}>+1</button>
            </div>
          </div>
          <div className={styles.battleGrid}>
            {support.map(p => (
              <EnemySlot key={p.id} label={p.label} unit={enemyBf[p.id]}
                onUpdate={u => updateEnemy(p.id, u)} />
            ))}
          </div>
          <div className={styles.battleGrid}>
            {front.map(p => (
              <EnemySlot key={p.id} label={p.label} unit={enemyBf[p.id]}
                onUpdate={u => updateEnemy(p.id, u)} />
            ))}
          </div>
        </div>

        <div className={styles.battleDivider}>⚔ &nbsp; Battlefront &nbsp; ⚔</div>

        {/* ── Your Forces ── */}
        <div className={styles.forceSection}>
          <div className={styles.forceHeader}>
            <div className={styles.forceTitle}>Your Forces</div>
            <div className={styles.moraleControls}>
              <span className={styles.moraleControlsLabel}>All Morale</span>
              <button className={styles.moraleBtn} onClick={() => adjustAllMorale(-1)}>−1</button>
              <button className={styles.moraleBtn} onClick={() => adjustAllMorale(1)}>+1</button>
            </div>
          </div>
          <div className={styles.battleGrid}>
            {front.map(p => (
              <YourSlot key={p.id} label={p.label}
                unit={yourBf[p.id]} allUnits={armies} usedIndices={usedIndices}
                onAssign={idx => assignYour(p.id, idx)}
                onClear={() => clearYour(p.id)}
                onToggleRouted={() => updateYour(p.id, 'routed', !yourBf[p.id]?.routed)}
                onStrength={v => updateYour(p.id, 'strength', v)}
                onMorale={v => updateYour(p.id, 'morale', v)} />
            ))}
          </div>
          <div className={styles.battleGrid}>
            {support.map(p => (
              <YourSlot key={p.id} label={p.label}
                unit={yourBf[p.id]} allUnits={armies} usedIndices={usedIndices}
                onAssign={idx => assignYour(p.id, idx)}
                onClear={() => clearYour(p.id)}
                onToggleRouted={() => updateYour(p.id, 'routed', !yourBf[p.id]?.routed)}
                onStrength={v => updateYour(p.id, 'strength', v)}
                onMorale={v => updateYour(p.id, 'morale', v)} />
            ))}
          </div>
        </div>

      </div>

      {/* ── Side panel ── */}
      <div className={styles.sidePanel}>
        <button className={styles.resetBtn} onClick={resetBattlefield}>Reset Battlefield</button>
        {armies.length === 0 && (
          <p className={styles.hint}>Add army units in the Armies tab to deploy them here.</p>
        )}
      </div>

    </div>
  )
}
