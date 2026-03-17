import { useState } from 'react'
import StepBar from './StepBar'
import styles from './MassCombat.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────
const ZONES = ['Left Flank', 'Centre', 'Right Flank']
const ZONE_IDS = ['left', 'centre', 'right']

// Phase: 'setup' | 'pre-battle' | 'fighting' | 'done'

function makeEnemyUnit(name = '') {
  return { name, strength: 3, morale: 3, routed: false }
}

function emptyArrangement() {
  // Each zone has front/support for each side
  return {
    left:   { yours: { front: null, support: null }, enemy: { front: makeEnemyUnit(), support: makeEnemyUnit() } },
    centre: { yours: { front: null, support: null }, enemy: { front: makeEnemyUnit(), support: makeEnemyUnit() } },
    right:  { yours: { front: null, support: null }, enemy: { front: makeEnemyUnit(), support: makeEnemyUnit() } },
  }
}

// ── Check zone control ─────────────────────────────────────────────────────────
function getZoneControl(zone) {
  const yourFront = zone.yours.front
  const yourSupport = zone.yours.support
  const enemyFront = zone.enemy.front
  const enemySupport = zone.enemy.support

  const youHaveUnits = (yourFront && !yourFront.routed) || (yourSupport && !yourSupport.routed)
  const enemyHasUnits = (enemyFront && enemyFront.name && !enemyFront.routed) ||
                        (enemySupport && enemySupport.name && !enemySupport.routed)

  if (youHaveUnits && !enemyHasUnits) return 'yours'
  if (!youHaveUnits && enemyHasUnits) return 'enemy'
  return 'contested'
}

function countZonesControlled(bf) {
  let yours = 0, enemy = 0
  ZONE_IDS.forEach(z => {
    const ctrl = getZoneControl(bf[z])
    if (ctrl === 'yours') yours++
    if (ctrl === 'enemy') enemy++
  })
  return { yours, enemy }
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function UnitSlot({ label, unit, isEnemy, isEmpty, onUpdate, onClear, onAssign, allUnits, usedIndices, dim }) {
  const [open, setOpen] = useState(false)
  const isRouted = unit?.routed

  return (
    <div className={`${styles.unitSlot} ${isRouted ? styles.unitRouted : ''} ${dim ? styles.unitDim : ''} ${isEmpty ? styles.unitEmpty : ''}`}>
      <div className={styles.unitSlotLabel}>{label}</div>

      {isEnemy ? (
        // Enemy slot — editable
        <div className={styles.unitBody}>
          <input className={styles.unitName} value={unit?.name || ''} placeholder="No unit..."
            onChange={e => onUpdate({ ...unit, name: e.target.value })} />
          {unit?.name && !isRouted && (
            <>
              <div className={styles.unitStatRow}>
                <span className={styles.unitStatLabel}>Str</span>
                <StepBar value={unit.strength ?? 3} min={0} max={20} onChange={v => onUpdate({ ...unit, strength: v })} />
              </div>
              <div className={styles.unitStatRow}>
                <span className={styles.unitStatLabel}>Mor</span>
                <StepBar value={unit.morale ?? 3} min={0} max={10} onChange={v => onUpdate({ ...unit, morale: v })} />
              </div>
            </>
          )}
          {isRouted && <div className={styles.routedBadge}>⚑ ROUTED</div>}
        </div>
      ) : (
        // Your slot — assign from army list
        <div className={styles.unitBody}>
          {unit ? (
            <>
              <div className={styles.unitNameDisplay}>{unit.name || 'Unnamed'}</div>
              {!isRouted ? (
                <>
                  <div className={styles.unitStatRow}>
                    <span className={styles.unitStatLabel}>Str</span>
                    <StepBar value={unit.strength ?? 1} min={0} max={20} onChange={v => onUpdate({ ...unit, strength: v })} />
                  </div>
                  <div className={styles.unitStatRow}>
                    <span className={styles.unitStatLabel}>Mor</span>
                    <StepBar value={unit.morale ?? 3} min={0} max={10} onChange={v => onUpdate({ ...unit, morale: v })} />
                  </div>
                  <button className={styles.unitClearBtn} onClick={onClear}>✕ Remove</button>
                </>
              ) : (
                <div className={styles.routedBadge}>⚑ ROUTED</div>
              )}
            </>
          ) : (
            open ? (
              <div className={styles.assignList}>
                {allUnits.length === 0
                  ? <span className={styles.noUnits}>Add units in the Armies tab first.</span>
                  : allUnits.map((u, i) => {
                    const taken = usedIndices.has(i)
                    return (
                      <button key={i} className={`${styles.assignBtn} ${taken ? styles.assignTaken : ''}`}
                        disabled={taken}
                        onClick={() => { if (!taken) { onAssign(i); setOpen(false) } }}>
                        {u.name || 'Unnamed'} <span className={styles.assignMeta}>{taken ? 'Deployed' : `Str ${u.strength} · Mor ${u.morale}`}</span>
                      </button>
                    )
                  })
                }
                <button className={styles.assignCancel} onClick={() => setOpen(false)}>Cancel</button>
              </div>
            ) : (
              <button className={styles.assignTrigger} onClick={() => setOpen(true)}>+ Assign Unit</button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MassCombat({ armies, chars }) {
  const [bf, setBf] = useState(emptyArrangement)
  const [phase, setPhase] = useState('setup') // setup | fighting | done
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0) // which zone we're fighting
  const [log, setLog] = useState([])
  const [winner, setWinner] = useState(null) // 'yours' | 'enemy'

  // Which army indices are already deployed
  const usedIndices = new Set()
  ZONE_IDS.forEach(z => {
    const yf = bf[z].yours.front
    const ys = bf[z].yours.support
    if (yf?._armyIdx !== undefined) usedIndices.add(yf._armyIdx)
    if (ys?._armyIdx !== undefined) usedIndices.add(ys._armyIdx)
  })

  function updateZone(zoneId, updater) {
    setBf(prev => ({ ...prev, [zoneId]: updater(prev[zoneId]) }))
  }
  function updateYourUnit(zoneId, pos, updated) {
    updateZone(zoneId, z => ({ ...z, yours: { ...z.yours, [pos]: updated } }))
  }
  function updateEnemyUnit(zoneId, pos, updated) {
    updateZone(zoneId, z => ({ ...z, enemy: { ...z.enemy, [pos]: updated } }))
  }
  function assignYour(zoneId, pos, armyIdx) {
    updateZone(zoneId, z => ({
      ...z, yours: { ...z.yours, [pos]: { ...armies[armyIdx], _armyIdx: armyIdx, routed: false } }
    }))
  }
  function clearYour(zoneId, pos) {
    updateZone(zoneId, z => ({ ...z, yours: { ...z.yours, [pos]: null } }))
  }

  function addLog(entry) {
    setLog(prev => [...prev, entry])
  }

  function startBattle() {
    setPhase('fighting')
    setCurrentZoneIdx(0)
    setLog([{ type: 'info', text: '⚔ Battle begins — fighting from Left Flank to Right Flank.' }])
  }

  function resetBattle() {
    if (!window.confirm('Reset the battlefield?')) return
    setBf(emptyArrangement())
    setPhase('setup')
    setCurrentZoneIdx(0)
    setLog([])
    setWinner(null)
  }

  // ── Resolve one zone combat ────────────────────────────────────────────────
  function fightZone() {
    const zoneId = ZONE_IDS[currentZoneIdx]
    const zoneName = ZONES[currentZoneIdx]
    const zone = bf[zoneId]

    // Get active front units (non-routed)
    const yourFront = zone.yours.front && !zone.yours.front.routed ? zone.yours.front : null
    const enemyFront = zone.enemy.front && zone.enemy.front.name && !zone.enemy.front.routed ? zone.enemy.front : null

    if (!yourFront || !enemyFront) {
      // One side has no unit — zone goes to whoever has one
      addLog({ type: 'info', text: `${zoneName}: no contest — ${yourFront ? 'your forces hold the zone' : enemyFront ? 'enemy holds the zone unchallenged' : 'neither side has units here'}.` })
      advanceAfterZone()
      return
    }

    // Roll battle scores
    const yourRoll = Math.floor(Math.random() * 6) + 1
    const enemyRoll = Math.floor(Math.random() * 6) + 1
    const yourScore = yourRoll + yourFront.strength
    const enemyScore = enemyRoll + enemyFront.strength

    addLog({
      type: 'roll',
      text: `${zoneName} — ${yourFront.name} (Str ${yourFront.strength}) rolls ${yourRoll} = ${yourScore} vs ${enemyFront.name} (Str ${enemyFront.strength}) rolls ${enemyRoll} = ${enemyScore}`
    })

    if (yourScore === enemyScore) {
      addLog({ type: 'info', text: `${zoneName}: Inconclusive — scores tied at ${yourScore}. No morale check.` })
      advanceAfterZone()
      return
    }

    const loserIsYours = yourScore < enemyScore
    const loserUnit = loserIsYours ? yourFront : enemyFront
    const loserName = loserUnit.name
    const moraleRoll = Math.floor(Math.random() * 6) + 1

    if (moraleRoll > loserUnit.morale) {
      // Unit routs
      addLog({
        type: loserIsYours ? 'bad' : 'good',
        text: `${zoneName}: ${loserName} loses the fight! Morale check: rolled ${moraleRoll} vs Morale ${loserUnit.morale} — ROUTS!`
      })
      routUnit(zoneId, loserIsYours ? 'yours' : 'enemy', 'front')
    } else {
      // Unit holds but loses 1 morale
      addLog({
        type: 'info',
        text: `${zoneName}: ${loserName} loses the fight. Morale check: rolled ${moraleRoll} vs Morale ${loserUnit.morale} — holds! Loses 1 Morale (now ${Math.max(0, loserUnit.morale - 1)}).`
      })
      // Reduce morale by 1
      if (loserIsYours) {
        updateYourUnit(zoneId, 'front', { ...loserUnit, morale: Math.max(0, loserUnit.morale - 1) })
      } else {
        updateEnemyUnit(zoneId, 'front', { ...loserUnit, morale: Math.max(0, loserUnit.morale - 1) })
      }
      advanceAfterZone()
      return
    }
  }

  function routUnit(zoneId, side, pos) {
    setBf(prev => {
      const zone = prev[zoneId]
      const unit = zone[side][pos]
      const support = zone[side].support

      let newZone
      if (support && (side === 'enemy' ? support.name : true) && !support.routed) {
        // Support moves to front
        newZone = {
          ...zone,
          [side]: {
            front: { ...support, routed: false },
            support: { ...unit, routed: true },
          }
        }
        addLog({ type: 'info', text: `${unit.name} routs! ${support.name} advances from support to front.` })
      } else {
        // No support — zone lost
        newZone = {
          ...zone,
          [side]: {
            front: { ...unit, routed: true },
            support: zone[side].support,
          }
        }
        addLog({ type: side === 'yours' ? 'bad' : 'good', text: `${unit.name} routs with no support — ${ZONES[ZONE_IDS.indexOf(zoneId)]} zone lost!` })
      }

      const newBf = { ...prev, [zoneId]: newZone }

      // Check win condition after rout
      const ctrl = countZonesControlled(newBf)
      if (ctrl.yours >= 2 || ctrl.enemy >= 2) {
        const w = ctrl.yours >= 2 ? 'yours' : 'enemy'
        setWinner(w)
        setPhase('done')
        addLog({
          type: w === 'yours' ? 'good' : 'bad',
          text: w === 'yours'
            ? `⚑ VICTORY! Your forces control ${ctrl.yours} zones — the battle is won!`
            : `⚑ DEFEAT! The enemy controls ${ctrl.enemy} zones — the battle is lost.`
        })
      } else {
        advanceAfterZone()
      }

      return newBf
    })
  }

  function advanceAfterZone() {
    setCurrentZoneIdx(prev => {
      const next = prev + 1
      if (next >= ZONE_IDS.length) {
        // All zones fought — check control
        const ctrl = countZonesControlled(bf)
        if (ctrl.yours >= 2) {
          setWinner('yours'); setPhase('done')
          addLog({ type: 'good', text: `⚑ VICTORY! Your forces control ${ctrl.yours} zones!` })
        } else if (ctrl.enemy >= 2) {
          setWinner('enemy'); setPhase('done')
          addLog({ type: 'bad', text: `⚑ DEFEAT! The enemy controls ${ctrl.enemy} zones.` })
        } else {
          // Go back to Left Flank for another round
          addLog({ type: 'info', text: '— End of round — returning to Left Flank for another round of fighting.' })
          return 0
        }
      }
      return next < ZONE_IDS.length ? next : 0
    })
  }

  // Mass combat spellcasters
  const massCasters = (chars || []).filter(c =>
    c.isSpellcaster && c.spells.some(s => s.name && s.type?.toLowerCase().includes('mass'))
  )

  const zoneControls = ZONE_IDS.map(z => getZoneControl(bf[z]))
  const { yours: yourCtrl, enemy: enemyCtrl } = countZonesControlled(bf)

  return (
    <div className={styles.wrapper}>

      {/* ── Zone control banner ── */}
      <div className={styles.controlBanner}>
        {ZONE_IDS.map((z, i) => {
          const ctrl = zoneControls[i]
          return (
            <div key={z} className={`${styles.zoneBadge} ${ctrl === 'yours' ? styles.zoneBadgeYours : ctrl === 'enemy' ? styles.zoneBadgeEnemy : styles.zoneBadgeContested}`}>
              <span className={styles.zoneBadgeName}>{ZONES[i]}</span>
              <span className={styles.zoneBadgeCtrl}>{ctrl === 'yours' ? '✦ Yours' : ctrl === 'enemy' ? '✦ Enemy' : '— Contested'}</span>
            </div>
          )
        })}
        <div className={styles.controlScore}>
          <span className={styles.controlNum}>{yourCtrl}</span>
          <span className={styles.controlLabel}>/ 2 zones to win</span>
          <span className={styles.controlNum} style={{ color: 'var(--crimson)' }}>{enemyCtrl}</span>
          <span className={styles.controlLabel}>enemy</span>
        </div>
      </div>

      <div className={styles.mainLayout}>

        {/* ── Battlefield grid ── */}
        <div className={styles.battlefield}>

          {/* Enemy */}
          <div className={styles.forceSide}>
            <div className={styles.forceLabel} style={{ color: 'var(--crimson)' }}>Enemy Forces</div>
            <div className={styles.zoneGrid}>
              {ZONE_IDS.map((z, i) => (
                <div key={z} className={`${styles.zone} ${phase === 'fighting' && currentZoneIdx === i ? styles.zoneActive : ''}`}>
                  <div className={styles.zoneTitle}>{ZONES[i]}</div>
                  <UnitSlot label="Support" unit={bf[z].enemy.support} isEnemy
                    onUpdate={u => updateEnemyUnit(z, 'support', u)} dim={bf[z].enemy.front?.name && !bf[z].enemy.front.routed} />
                  <UnitSlot label="Front" unit={bf[z].enemy.front} isEnemy
                    onUpdate={u => updateEnemyUnit(z, 'front', u)} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.frontline}>⚔ Battlefront ⚔</div>

          {/* Yours */}
          <div className={styles.forceSide}>
            <div className={styles.forceLabel}>Your Forces</div>
            <div className={styles.zoneGrid}>
              {ZONE_IDS.map((z, i) => (
                <div key={z} className={`${styles.zone} ${phase === 'fighting' && currentZoneIdx === i ? styles.zoneActive : ''}`}>
                  <div className={styles.zoneTitle}>{ZONES[i]}</div>
                  <UnitSlot label="Front" unit={bf[z].yours.front} isEnemy={false}
                    allUnits={armies} usedIndices={usedIndices}
                    onAssign={idx => assignYour(z, 'front', idx)}
                    onClear={() => clearYour(z, 'front')}
                    onUpdate={u => updateYourUnit(z, 'front', u)} />
                  <UnitSlot label="Support" unit={bf[z].yours.support} isEnemy={false}
                    allUnits={armies} usedIndices={usedIndices}
                    onAssign={idx => assignYour(z, 'support', idx)}
                    onClear={() => clearYour(z, 'support')}
                    onUpdate={u => updateYourUnit(z, 'support', u)}
                    dim={!!bf[z].yours.front && !bf[z].yours.front.routed} />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Side panel ── */}
        <div className={styles.sidePanel}>

          {phase === 'setup' && (
            <>
              <div className={styles.panelTitle}>Setup</div>
              <p className={styles.panelNote}>Arrange your units and the enemy forces. Max 2 units per zone (1 Front + 1 Support).</p>
              {massCasters.length > 0 && (
                <div className={styles.spellNote}>
                  <div className={styles.spellNoteTitle}>Mass Combat Spells</div>
                  {massCasters.map((c, i) => (
                    <div key={i} className={styles.spellCaster}>
                      <span className={styles.spellCasterName}>{c.name}</span>
                      {c.spells.filter(s => s.name && s.type?.toLowerCase().includes('mass')).map((sp, si) => (
                        <span key={si} className={`${styles.spellTag} ${sp.charged ? styles.spellCharged : styles.spellDrained}`}>
                          {sp.name}
                        </span>
                      ))}
                    </div>
                  ))}
                  <p className={styles.panelNote} style={{ marginTop: 4 }}>Cast these before the battle starts.</p>
                </div>
              )}
              <button className={styles.startBtn} onClick={startBattle}>⚔ Start Battle</button>
              <button className={styles.resetBtn} onClick={resetBattle}>Reset</button>
            </>
          )}

          {phase === 'fighting' && (
            <>
              <div className={styles.panelTitle}>Fighting</div>
              <div className={styles.currentZone}>
                <div className={styles.currentZoneLabel}>Current Zone</div>
                <div className={styles.currentZoneName}>{ZONES[currentZoneIdx]}</div>
              </div>
              <button className={styles.fightBtn} onClick={fightZone}>
                ⚔ Fight {ZONES[currentZoneIdx]}
              </button>
              <button className={styles.resetBtn} onClick={resetBattle}>Reset</button>
            </>
          )}

          {phase === 'done' && (
            <>
              <div className={styles.panelTitle} style={{ color: winner === 'yours' ? '#2a6630' : 'var(--crimson)' }}>
                {winner === 'yours' ? '⚑ Victory!' : '⚑ Defeat'}
              </div>
              <p className={styles.panelNote}>
                {winner === 'yours' ? 'Your forces control the field.' : 'The enemy has won the battle.'}
              </p>
              <button className={styles.startBtn} onClick={resetBattle}>New Battle</button>
            </>
          )}

        </div>
      </div>

      {/* ── Combat log ── */}
      {log.length > 0 && (
        <div className={styles.logSection}>
          <div className={styles.logTitle}>Battle Log</div>
          <div className={styles.logList}>
            {[...log].reverse().map((entry, i) => (
              <div key={i} className={`${styles.logEntry} ${styles['log_' + (entry.type || 'info')]}`}>
                {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
