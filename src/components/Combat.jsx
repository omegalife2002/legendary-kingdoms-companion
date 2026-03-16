import { useState } from 'react'
import { getModified } from '../data/defaults'
import Panel from './Panel'
import DatabaseModal from './DatabaseModal'
import MassCombat from './MassCombat'
import styles from './Combat.module.css'

function makeEnemy(name = 'Enemy') {
  return { name, attack: 4, atkDC: 5, def: 4, health: 6, maxHealth: 6 }
}

function DiceRow({ dice, dc }) {
  return (
    <div className={styles.diceRow}>
      {dice.map((d, i) => (
        <span key={i} className={`${styles.die} ${d >= dc ? styles.hit : styles.miss}`}>{d}</span>
      ))}
    </div>
  )
}


const ENEMY_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "attack", label: "Atk", render: e => `${e.attack} (${e.atkDC}+)` },
  { key: "def", label: "Def", render: e => `${e.def}+` },
  { key: "health", label: "HP" },
]
const ENEMY_FIELDS = [
  { key: "name", label: "Enemy Name" },
  { key: "attack", label: "Attack Dice", type: "number" },
  { key: "atkDC", label: "Attack DC", type: "number" },
  { key: "def", label: "Defence", type: "number" },
  { key: "health", label: "Health", type: "number" },
]
export default function Combat({ chars, onUpdateChars, enemyDB, onAddEnemy, armies }) {
  const [combatTab, setCombatTab] = useState('personal')
  const [enemies, setEnemies] = useState(() => [makeEnemy()])

  // Party turn: track which chars have acted this round
  const [actedChars, setActedChars] = useState(new Set())
  const [selectedAttacker, setSelectedAttacker] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)

  // Enemy turn: step through one at a time
  const [enemyTurnActive, setEnemyTurnActive] = useState(false)
  const [enemyQueue, setEnemyQueue] = useState([]) // indices of alive enemies remaining to attack
  const [currentEnemyIdx, setCurrentEnemyIdx] = useState(null)
  const [pendingHit, setPendingHit] = useState(null) // { enemyName, hits, dice, dc }
  const [selectedDefender, setSelectedDefender] = useState(null)

  const [log, setLog] = useState([])
  const [dbModal, setDbModal] = useState(false)

  const partyAlive = chars.filter(c => c.status !== 'dead')
  const enemiesAlive = enemies.filter(e => e.health > 0)
  const charsWhoCanAct = partyAlive.filter((c, i) => {
    const realIdx = chars.indexOf(c)
    return !actedChars.has(realIdx) && getModified(c, 'Fighting') > 0
  })

  function addLogEntry(entry) {
    setLog(prev => [entry, ...prev].slice(0, 20))
  }

  function updateEnemy(idx, field, value) {
    setEnemies(prev => prev.map((e, i) => i === idx ? { ...e, [field]: Math.max(0, parseInt(value) || 0) } : e))
  }
  function changeEHP(idx, delta) {
    setEnemies(prev => prev.map((e, i) => i === idx ? { ...e, health: Math.max(0, e.health + delta) } : e))
  }
  function removeEnemy(idx) {
    setEnemies(prev => prev.filter((_, i) => i !== idx))
  }

  function resetCombat() {
    setEnemies([makeEnemy()])
    setActedChars(new Set())
    setSelectedAttacker(null)
    setSelectedTarget(null)
    setEnemyTurnActive(false)
    setEnemyQueue([])
    setCurrentEnemyIdx(null)
    setPendingHit(null)
    setSelectedDefender(null)
    setLog([])
  }

  function newRound() {
    setActedChars(new Set())
    setSelectedAttacker(null)
    setSelectedTarget(null)
    setEnemyTurnActive(false)
    setEnemyQueue([])
    setCurrentEnemyIdx(null)
    setPendingHit(null)
    setSelectedDefender(null)
  }

  // ── Party attack ──────────────────────────────────────────────
  function rollPartyAttack() {
    if (selectedAttacker === null || selectedTarget === null) return
    const attacker = chars[selectedAttacker]
    const enemy = enemies[selectedTarget]
    const fighting = getModified(attacker, 'Fighting')
    const dice = Array.from({ length: fighting }, () => Math.floor(Math.random() * 6) + 1)
    const hits = dice.filter(d => d >= enemy.def).length

    const updatedEnemies = enemies.map((e, i) =>
      i === selectedTarget ? { ...e, health: Math.max(0, e.health - hits) } : e
    )
    setEnemies(updatedEnemies)
    setActedChars(prev => new Set([...prev, selectedAttacker]))
    setSelectedAttacker(null)
    setSelectedTarget(null)

    addLogEntry({
      type: 'party',
      label: `${attacker.name || 'Adventurer'} → ${enemy.name}`,
      detail: `${fighting} dice vs Def ${enemy.def}+ · ${hits} hit${hits !== 1 ? 's' : ''} · ${enemy.name} HP: ${Math.max(0, enemy.health - hits)}${Math.max(0, enemy.health - hits) <= 0 ? ' — DEFEATED' : ''}`,
      dice, dc: enemy.def,
    })
  }

  // ── Enemy turn ────────────────────────────────────────────────
  function startEnemyTurn() {
    const aliveIdxs = enemies.map((e, i) => i).filter(i => enemies[i].health > 0)
    if (!aliveIdxs.length) return
    setEnemyTurnActive(true)
    setEnemyQueue(aliveIdxs.slice(1))
    setCurrentEnemyIdx(aliveIdxs[0])
    setPendingHit(null)
    setSelectedDefender(null)
  }

  function advanceEnemyQueue() {
    if (enemyQueue.length > 0) {
      setCurrentEnemyIdx(enemyQueue[0])
      setEnemyQueue(prev => prev.slice(1))
      setPendingHit(null)
      setSelectedDefender(null)
    } else {
      setEnemyTurnActive(false)
      setCurrentEnemyIdx(null)
      setPendingHit(null)
      setSelectedDefender(null)
    }
  }

  function rollEnemyAttack() {
    if (currentEnemyIdx === null) return
    const enemy = enemies[currentEnemyIdx]
    const dice = Array.from({ length: enemy.attack }, () => Math.floor(Math.random() * 6) + 1)
    const hits = dice.filter(d => d >= enemy.atkDC).length

    // Zero hits — log it and skip straight to next enemy
    if (hits === 0) {
      addLogEntry({
        type: 'enemy',
        label: `${enemy.name} — no hits`,
        detail: `Rolled ${enemy.attack} dice (${enemy.atkDC}+) · 0 hits · no damage`,
        attackDice: dice, attackDC: enemy.atkDC, armourDice: [], hasSave: false,
      })
      advanceEnemyQueue()
      return
    }

    setPendingHit({ enemyName: enemy.name, hits, dice, dc: enemy.atkDC })
    setSelectedDefender(null)
  }

  function applyHitToDefender() {
    if (selectedDefender === null || !pendingHit) return
    const target = chars[selectedDefender]
    const armour = parseInt(target.armour) || 0
    const { hits, enemyName } = pendingHit

    // Armour save
    let saves = 0, armDice = []
    if (armour > 0 && hits > 0) {
      armDice = Array.from({ length: Math.min(armour, hits) }, () => Math.floor(Math.random() * 6) + 1)
      saves = armDice.filter(r => r >= 4).length
    }
    const dmg = Math.max(0, hits - saves)
    const newHP = Math.max(0, target.health - dmg)

    onUpdateChars(prev => prev.map((c, i) => i === selectedDefender ? { ...c, health: newHP } : c))

    addLogEntry({
      type: 'enemy',
      label: `${enemyName} → ${target.name || 'Adventurer'}`,
      detail: `${hits} hit${hits !== 1 ? 's' : ''}${saves ? ` · Armour blocked ${saves}` : ''} · ${dmg} damage · HP now ${newHP}`,
      attackDice: pendingHit.dice, attackDC: pendingHit.dc,
      armourDice: armDice, hasSave: armDice.length > 0,
    })

    // Advance to next enemy
    advanceEnemyQueue()
  }

  const currentEnemy = currentEnemyIdx !== null ? enemies[currentEnemyIdx] : null

  return (
    <Panel title="Combat" ornament="⚔"
      action={combatTab === 'personal'
        ? <button className={styles.resetCombatBtn} onClick={resetCombat}>Reset Combat</button>
        : null}>

      {/* Tab bar */}
      <div className={styles.combatTabBar}>
        <button className={`${styles.combatTab} ${combatTab === 'personal' ? styles.combatTabOn : ''}`}
          onClick={() => setCombatTab('personal')}>Personal Combat</button>
        <button className={`${styles.combatTab} ${combatTab === 'mass' ? styles.combatTabOn : ''}`}
          onClick={() => setCombatTab('mass')}>Mass Combat</button>
      </div>

      {/* Personal Combat */}
      {combatTab === 'personal' && (<>

      {dbModal && (
        <DatabaseModal
          title="Add Enemy from Database"
          items={enemyDB || []}
          columns={ENEMY_COLUMNS}
          onSelect={item => {
            const hp = parseInt(item.health) || 6
            setEnemies(prev => [...prev, { name: item.name, attack: parseInt(item.attack)||4, atkDC: parseInt(item.atkDC)||4, def: parseInt(item.def)||4, health: hp, maxHealth: hp }])
          }}
          onClose={() => setDbModal(false)}
          onAddNew={item => {
            onAddEnemy && onAddEnemy(item)
            const hp = parseInt(item.health) || 6
            setEnemies(prev => [...prev, { name: item.name, attack: parseInt(item.attack)||4, atkDC: parseInt(item.atkDC)||4, def: parseInt(item.def)||4, health: hp, maxHealth: hp }])
          }}
          newItemTemplate={{ name: '', attack: 4, atkDC: 4, def: 4, health: 6 }}
          newItemFields={ENEMY_FIELDS}
        />
      )}

      <div className={styles.layout}>

        {/* Left: Enemy roster */}
        <div className={styles.leftCol}>
          <div className={styles.sectionTitle}>Enemies</div>
          {enemies.map((e, idx) => (
            <div key={idx} className={`${styles.enemyRow} ${e.health <= 0 ? styles.defeated : ''}`}>
              <input className={styles.enemyName} value={e.name} placeholder="Enemy..."
                onChange={ev => setEnemies(prev => prev.map((en, i) => i === idx ? { ...en, name: ev.target.value } : en))} />
              <div className={styles.enemyStats}>
                {[['Atk', 'attack'], ['DC', 'atkDC'], ['Def', 'def']].map(([lbl, field]) => (
                  <div key={field} className={styles.statCell}>
                    <span className={styles.statLbl}>{lbl}</span>
                    <input className={styles.statInp} type="number" min="1" max="20" value={e[field]}
                      onChange={ev => updateEnemy(idx, field, ev.target.value)} />
                  </div>
                ))}
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>{e.health <= 0 ? '☠ HP' : 'HP'}</span>
                  <div className={styles.hpCtrls}>
                    <button className={styles.hpBtn} onClick={() => changeEHP(idx, -1)}>−</button>
                    <input className={styles.statInp} type="number" min="0" value={e.health}
                      style={{ color: e.health <= 0 ? 'var(--crimson)' : undefined, width: '40px' }}
                      onChange={ev => updateEnemy(idx, 'health', ev.target.value)} />
                    <button className={styles.hpBtn} onClick={() => changeEHP(idx, 1)}>+</button>
                  </div>
                </div>
                <button className={styles.delBtn} onClick={() => removeEnemy(idx)}>✕</button>
              </div>
            </div>
          ))}
          <div className={styles.addEnemyRow}>
            <button className={styles.addBtn} onClick={() => setEnemies(prev => [...prev, makeEnemy()])}>+ Blank Enemy</button>
            <button className={styles.addDbBtn} onClick={() => setDbModal(true)}>⊕ From Database</button>
          </div>
        </div>

        {/* Right: Turn controls */}
        <div className={styles.rightCol}>

          {/* Party turn */}
          {!enemyTurnActive && (
            <div className={styles.turnBlock}>
              <div className={styles.sectionTitle}>
                Party Turn
                <span className={styles.roundStatus}>
                  {charsWhoCanAct.length > 0 ? `${charsWhoCanAct.length} yet to act` : 'All acted'}
                </span>
              </div>

              <div className={styles.pickerLabel}>Select Attacker</div>
              <div className={styles.charBtns}>
                {partyAlive.map(c => {
                  const realIdx = chars.indexOf(c)
                  const hasActed = actedChars.has(realIdx)
                  return (
                    <button
                      key={realIdx}
                      className={`${styles.charBtn} ${selectedAttacker === realIdx ? styles.charBtnOn : ''} ${hasActed ? styles.charBtnActed : ''}`}
                      onClick={() => !hasActed && setSelectedAttacker(realIdx)}
                      disabled={hasActed}
                    >
                      {c.name || `Adventurer ${realIdx + 1}`}
                      {hasActed && <span className={styles.actedTag}> ✓</span>}
                    </button>
                  )
                })}
              </div>

              {selectedAttacker !== null && (
                <>
                  <div className={styles.pickerLabel}>Select Target</div>
                  <div className={styles.charBtns}>
                    {enemiesAlive.map(e => {
                      const eIdx = enemies.indexOf(e)
                      return (
                        <button key={eIdx}
                          className={`${styles.charBtn} ${styles.enemyBtn} ${selectedTarget === eIdx ? styles.charBtnOn : ''}`}
                          onClick={() => setSelectedTarget(eIdx)}>
                          {e.name} (HP {e.health})
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {selectedAttacker !== null && selectedTarget !== null && (
                <button className={styles.rollBtn} onClick={rollPartyAttack}>
                  Roll Attack — {chars[selectedAttacker]?.name} vs {enemies[selectedTarget]?.name}
                </button>
              )}

              <div className={styles.turnFooter}>
                <button className={styles.enemyTurnBtn} onClick={startEnemyTurn}>
                  → Start Enemy Turn
                </button>
                <button className={styles.newRoundBtn} onClick={newRound}>New Round</button>
              </div>
            </div>
          )}

          {/* Enemy turn */}
          {enemyTurnActive && currentEnemy && (
            <div className={styles.turnBlock}>
              <div className={styles.sectionTitle} style={{ color: 'var(--crimson)' }}>
                Enemy Turn — {currentEnemy.name}
                <span className={styles.roundStatus}>{enemyQueue.length} enemy{enemyQueue.length !== 1 ? 'ies' : ''} after this</span>
              </div>

              {!pendingHit ? (
                <button className={styles.rollBtn} style={{ background: 'var(--crimson)', borderColor: '#6b1212' }}
                  onClick={rollEnemyAttack}>
                  Roll {currentEnemy.name}'s Attack ({currentEnemy.attack} dice, {currentEnemy.atkDC}+)
                </button>
              ) : (
                <>
                  <div className={styles.hitResult}>
                    <div className={styles.hitLabel}>{currentEnemy.name} rolled {pendingHit.hits} hit{pendingHit.hits !== 1 ? 's' : ''}</div>
                    <DiceRow dice={pendingHit.dice} dc={pendingHit.dc} />
                  </div>
                  <div className={styles.pickerLabel}>Choose who gets hit</div>
                  <div className={styles.charBtns}>
                    {partyAlive.map(c => {
                      const realIdx = chars.indexOf(c)
                      return (
                        <button key={realIdx}
                          className={`${styles.charBtn} ${selectedDefender === realIdx ? styles.charBtnOn : ''}`}
                          onClick={() => setSelectedDefender(realIdx)}>
                          {c.name || `Adventurer ${realIdx + 1}`} (HP {c.health}, Armour {c.armour || 0})
                        </button>
                      )
                    })}
                  </div>
                  {selectedDefender !== null && (
                    <button className={styles.rollBtn} style={{ background: 'var(--crimson)', borderColor: '#6b1212' }}
                      onClick={applyHitToDefender}>
                      Roll Armour Save &amp; Apply Damage to {chars[selectedDefender]?.name}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {enemyTurnActive && !currentEnemy && (
            <div className={styles.turnBlock}>
              <div className={styles.sectionTitle}>Enemy Turn Complete</div>
              <button className={styles.newRoundBtn} onClick={newRound}>Start New Round</button>
            </div>
          )}

        </div>
      </div>

      {/* Combat log */}
      {log.length > 0 && (
        <div className={styles.log}>
          <div className={styles.logTitle}>Combat Log</div>
          {log.map((entry, i) => (
            <div key={i} className={`${styles.logEntry} ${entry.type === 'enemy' ? styles.logEnemy : styles.logParty}`}>
              <div className={styles.logLabel}>{entry.label}</div>
              <div className={styles.logDetail}>{entry.detail}</div>
              {entry.dice && <DiceRow dice={entry.dice} dc={entry.dc} />}
              {entry.attackDice && (
                <>
                  <div className={styles.subLabel}>Attack dice ({entry.attackDC}+ to hit)</div>
                  <DiceRow dice={entry.attackDice} dc={entry.attackDC} />
                  {entry.hasSave && (
                    <>
                      <div className={styles.subLabel}>Armour save dice (4+ blocks)</div>
                      <DiceRow dice={entry.armourDice} dc={4} />
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </>)}

      {/* Mass Combat */}
      {combatTab === 'mass' && (
        <MassCombat armies={armies || []} />
      )}

    </Panel>
  )
}
