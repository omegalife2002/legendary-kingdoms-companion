import { useState } from 'react'
import CharacterSheet from './CharacterSheet'
import Panel from './Panel'
import StepBar from './StepBar'
import styles from './CampaignPanel.module.css'

// ── Known locations ──────────────────────────────────────────────────────────
const LOCATIONS = [
  'Beverstone', 'Brightsands', 'Fosterly Castle', 'Highpoint Castle',
  'Longport City', 'Luutanesh', 'Saltdad', 'Drakehallow', 'Valley of Bones',
  'The Undertunnels', 'Open Field', 'At Sea', 'Other',
]

function makeArmy() {
  return { id: Date.now(), name: '', strength: 1, morale: 3, garrison: '' }
}
function makeShip() {
  return { id: Date.now(), name: '', fighting: 1, health: 6, maxHealth: 6, cargo: '', location: '' }
}

// ── Army card ────────────────────────────────────────────────────────────────
function ArmyCard({ army, onChange, onRemove }) {
  function update(field, val) { onChange({ ...army, [field]: val }) }
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <input className={styles.cardName} value={army.name} placeholder="Unit name..."
          onChange={e => update('name', e.target.value)} />
        <button className={styles.removeBtn} onClick={onRemove} title="Remove unit">✕</button>
      </div>
      <div className={styles.cardStats}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Strength</span>
          <StepBar value={army.strength} onChange={v => update('strength', v)} min={0} max={20} />
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Morale</span>
          <StepBar value={army.morale} onChange={v => update('morale', v)} min={0} max={10} />
        </div>
        <div className={styles.garrisonRow}>
          <span className={styles.statLabel}>Garrison</span>
          <select className={styles.garrisonSelect} value={army.garrison}
            onChange={e => update('garrison', e.target.value)}>
            <option value="">— Ungarrisoned —</option>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {army.garrison === 'Other' && (
            <input className={styles.garrisonCustom} value={army.garrisonCustom || ''}
              placeholder="Location name..."
              onChange={e => update('garrisonCustom', e.target.value)} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ship card ────────────────────────────────────────────────────────────────
function ShipCard({ ship, onChange, onRemove }) {
  function update(field, val) { onChange({ ...ship, [field]: val }) }
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <input className={styles.cardName} value={ship.name} placeholder="Ship name..."
          onChange={e => update('name', e.target.value)} />
        <button className={styles.removeBtn} onClick={onRemove} title="Remove ship">✕</button>
      </div>
      <div className={styles.cardStats}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Fighting</span>
          <StepBar value={ship.fighting} onChange={v => update('fighting', v)} min={0} max={20} />
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Health</span>
          <div className={styles.hpRow}>
            <StepBar value={ship.health} onChange={v => update('health', Math.min(v, ship.maxHealth))}
              min={0} max={ship.maxHealth} colorBar />
            <span className={styles.hpSep}>/</span>
            <input className={styles.hpMax} type="number" value={ship.maxHealth} min="1"
              onChange={e => update('maxHealth', parseInt(e.target.value) || 1)} title="Max health" />
          </div>
        </div>
        <div className={styles.garrisonRow}>
          <span className={styles.statLabel}>Cargo</span>
          <input className={styles.garrisonCustom} value={ship.cargo || ''} placeholder="Cargo notes..."
            onChange={e => update('cargo', e.target.value)} />
        </div>
        <div className={styles.garrisonRow}>
          <span className={styles.statLabel}>Location</span>
          <select className={styles.garrisonSelect} value={ship.location}
            onChange={e => update('location', e.target.value)}>
            <option value="">— At sea —</option>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {ship.location === 'Other' && (
            <input className={styles.garrisonCustom} value={ship.locationCustom || ''}
              placeholder="Location name..."
              onChange={e => update('locationCustom', e.target.value)} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Fleet tab — ships + sea combat ───────────────────────────────────────────
function DiceRow({ dice, dc, styles: s }) {
  return (
    <div className={s.diceRow}>
      {dice.map((d, i) => (
        <span key={i} className={`${s.die} ${d >= dc ? s.hit : s.miss}`}>{d}</span>
      ))}
    </div>
  )
}

function FleetTab({ fleet, onFleetChange, chars }) {
  const [fleetTab, setFleetTab] = useState('ships')

  // Sea combat state
  const [yourShipIdx,   setYourShipIdx]   = useState(null)
  const [enemyShip,     setEnemyShip]     = useState({ name: 'Enemy Ship', health: 10, maxHealth: 10, fighting: 4 })
  const [combatLog,     setCombatLog]     = useState([])
  const [roundNum,      setRoundNum]      = useState(1)

  const SHIP_DEF = 4 // defence is always 4+ in sea combat

  function addShip() { onFleetChange(prev => [...prev, makeShip()]) }
  function updateShip(idx, updated) { onFleetChange(prev => prev.map((s, i) => i === idx ? updated : s)) }
  function removeShip(idx) { onFleetChange(prev => prev.filter((_, i) => i !== idx)) }

  function addLogEntry(entry) {
    setCombatLog(prev => [entry, ...prev].slice(0, 30))
  }

  function yourShipAttacks() {
    if (yourShipIdx === null) return
    const ship = fleet[yourShipIdx]
    if (!ship) return
    const dice = Array.from({ length: ship.fighting }, () => Math.floor(Math.random() * 6) + 1)
    const hits = dice.filter(d => d >= SHIP_DEF).length
    const newHealth = Math.max(0, enemyShip.health - hits)
    setEnemyShip(prev => ({ ...prev, health: newHealth }))
    addLogEntry({
      type: 'yours',
      label: `Round ${roundNum} — ${ship.name || 'Your Ship'} attacks`,
      detail: `${ship.fighting} dice vs Def ${SHIP_DEF}+ · ${hits} hit${hits !== 1 ? 's' : ''} · ${enemyShip.name} HP: ${newHealth}${newHealth <= 0 ? ' — SUNK' : ''}`,
      dice, dc: SHIP_DEF,
    })
  }

  function enemyAttacks() {
    if (yourShipIdx === null) return
    const ship = fleet[yourShipIdx]
    if (!ship) return
    const dice = Array.from({ length: enemyShip.fighting }, () => Math.floor(Math.random() * 6) + 1)
    const hits = dice.filter(d => d >= SHIP_DEF).length
    const newHealth = Math.max(0, ship.health - hits)
    updateShip(yourShipIdx, { ...ship, health: newHealth })
    addLogEntry({
      type: 'enemy',
      label: `Round ${roundNum} — ${enemyShip.name} attacks`,
      detail: `${enemyShip.fighting} dice vs Def ${SHIP_DEF}+ · ${hits} hit${hits !== 1 ? 's' : ''} · ${ship.name || 'Your Ship'} HP: ${newHealth}${newHealth <= 0 ? ' — SUNK' : ''}`,
      dice, dc: SHIP_DEF,
    })
    setRoundNum(prev => prev + 1)
  }

  function resetCombat() {
    setCombatLog([])
    setRoundNum(1)
    setEnemyShip({ name: 'Enemy Ship', health: 10, maxHealth: 10, fighting: 4 })
    setYourShipIdx(null)
  }

  // Sea combat spellcasters — chars with spells marked Sea Combat
  const seaSpellcasters = chars.filter(c =>
    c.isSpellcaster && c.spells.some(s => s.name && s.type && s.type.toLowerCase().includes('sea'))
  )

  const yourShip = yourShipIdx !== null ? fleet[yourShipIdx] : null
  const combatOver = yourShip?.health <= 0 || enemyShip.health <= 0

  return (
    <div className={styles.section}>
      {/* Sub-tabs */}
      <div className={styles.fleetSubTabs}>
        <button className={`${styles.fleetSubTab} ${fleetTab === 'ships' ? styles.fleetSubTabOn : ''}`}
          onClick={() => setFleetTab('ships')}>Your Ships</button>
        <button className={`${styles.fleetSubTab} ${fleetTab === 'combat' ? styles.fleetSubTabOn : ''}`}
          onClick={() => setFleetTab('combat')}>Sea Combat</button>
      </div>

      {/* Ships list */}
      {fleetTab === 'ships' && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCount}>{fleet.length} ship{fleet.length !== 1 ? 's' : ''}</span>
            <button className={styles.addBtn} onClick={addShip}>+ Add Ship</button>
          </div>
          {fleet.length === 0 && (
            <p className={styles.emptyNote}>No ships yet. Add ships to track your fleet.</p>
          )}
          <div className={styles.cardGrid}>
            {fleet.map((ship, i) => (
              <ShipCard key={ship.id || i} ship={ship}
                onChange={updated => updateShip(i, updated)}
                onRemove={() => removeShip(i)} />
            ))}
          </div>
        </>
      )}

      {/* Sea combat */}
      {fleetTab === 'combat' && (
        <div className={styles.seaCombat}>
          <div className={styles.seaLayout}>

            {/* Left col: ship selectors + enemy */}
            <div className={styles.seaLeft}>

              {/* Your ship */}
              <div className={styles.seaBlock}>
                <div className={styles.seaBlockTitle}>Your Ship</div>
                {fleet.length === 0 ? (
                  <p className={styles.emptyNote}>Add ships in the Your Ships tab first.</p>
                ) : (
                  <div className={styles.shipBtns}>
                    {fleet.map((s, i) => (
                      <button key={i}
                        className={`${styles.shipBtn} ${yourShipIdx === i ? styles.shipBtnOn : ''}`}
                        onClick={() => setYourShipIdx(i)}>
                        {s.name || `Ship ${i + 1}`}
                        <span className={styles.shipBtnMeta}>Fighting {s.fighting} · HP {s.health}/{s.maxHealth}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Enemy ship */}
              <div className={styles.seaBlock}>
                <div className={styles.seaBlockTitle}>Enemy Ship</div>
                <div className={styles.enemyShipFields}>
                  <div className={styles.enemyFieldRow}>
                    <label className={styles.enemyFieldLabel}>Name</label>
                    <input className={styles.enemyFieldInput}
                      value={enemyShip.name}
                      onChange={e => setEnemyShip(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className={styles.enemyFieldRow}>
                    <label className={styles.enemyFieldLabel}>Fighting</label>
                    <StepBar value={enemyShip.fighting} min={0} max={20}
                      onChange={v => setEnemyShip(prev => ({ ...prev, fighting: v }))} />
                  </div>
                  <div className={styles.enemyFieldRow}>
                    <label className={styles.enemyFieldLabel}>Health</label>
                    <div className={styles.enemyHpRow}>
                      <StepBar value={enemyShip.health} min={0} max={enemyShip.maxHealth} colorBar
                        onChange={v => setEnemyShip(prev => ({ ...prev, health: v }))} />
                      <span className={styles.hpSep}>/</span>
                      <input className={styles.hpMax} type="number" min="1" value={enemyShip.maxHealth}
                        onChange={e => setEnemyShip(prev => ({ ...prev, maxHealth: parseInt(e.target.value)||1, health: Math.min(prev.health, parseInt(e.target.value)||1) }))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sea combat spells reminder */}
              {seaSpellcasters.length > 0 && (
                <div className={styles.seaSpellNote}>
                  <div className={styles.seaSpellTitle}>Sea Combat Spells</div>
                  {seaSpellcasters.map((c, i) => (
                    <div key={i} className={styles.seaSpellCaster}>
                      <span className={styles.seaSpellCasterName}>{c.name}</span>
                      {c.spells.filter(s => s.name && s.type?.toLowerCase().includes('sea')).map((sp, si) => (
                        <span key={si} className={`${styles.seaSpellTag} ${sp.charged ? styles.seaSpellCharged : styles.seaSpellDrained}`}>
                          {sp.name}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right col: attack buttons + log */}
            <div className={styles.seaRight}>
              <div className={styles.seaRuleNote}>
                Defence is always <strong>4+</strong> in sea combat. Your ship attacks first each round.
              </div>

              {combatOver ? (
                <div className={styles.combatResult}>
                  {yourShip?.health <= 0 ? '☠ Your ship has been sunk!' : '⚓ Enemy ship sunk — victory!'}
                  <button className={styles.resetBtn} onClick={resetCombat}>New Battle</button>
                </div>
              ) : (
                <div className={styles.attackBtns}>
                  <button className={styles.yourAttackBtn}
                    disabled={yourShipIdx === null}
                    onClick={yourShipAttacks}>
                    {yourShip ? `${yourShip.name || 'Your Ship'} Attacks` : 'Select your ship first'}
                  </button>
                  <button className={styles.enemyAttackBtn}
                    disabled={yourShipIdx === null}
                    onClick={enemyAttacks}>
                    {enemyShip.name} Attacks
                  </button>
                  <button className={styles.resetSmallBtn} onClick={resetCombat}>Reset Combat</button>
                </div>
              )}

              {/* Round counter */}
              {combatLog.length > 0 && (
                <div className={styles.roundBadge}>Round {roundNum}</div>
              )}

              {/* Combat log */}
              <div className={styles.combatLog}>
                {combatLog.map((entry, i) => (
                  <div key={i} className={`${styles.logEntry} ${entry.type === 'enemy' ? styles.logEnemy : styles.logYours}`}>
                    <div className={styles.logLabel}>{entry.label}</div>
                    <div className={styles.logDetail}>{entry.detail}</div>
                    <DiceRow dice={entry.dice} dc={entry.dc} styles={styles} />
                  </div>
                ))}
                {combatLog.length === 0 && (
                  <p className={styles.emptyNote}>Select ships and roll attacks to begin.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CampaignPanel({
  chars, activeChar, setActiveChar, updateChar,
  equipmentDB, spellDB, onAddEquipment, onAddSpell,
  armies, onArmiesChange,
  fleet, onFleetChange,
  notes, onNotesChange,
}) {
  const [tab, setTab] = useState('characters')

  const TABS = [
    { id: 'characters', label: 'Characters' },
    { id: 'armies',     label: 'Armies' },
    { id: 'fleet',      label: 'Fleet' },
    { id: 'notes',      label: 'Notes' },
  ]

  function addArmy() { onArmiesChange(prev => [...prev, makeArmy()]) }
  function updateArmy(idx, updated) { onArmiesChange(prev => prev.map((a, i) => i === idx ? updated : a)) }
  function removeArmy(idx) { onArmiesChange(prev => prev.filter((_, i) => i !== idx)) }

  function addShip() { onFleetChange(prev => [...prev, makeShip()]) }
  function updateShip(idx, updated) { onFleetChange(prev => prev.map((s, i) => i === idx ? updated : s)) }
  function removeShip(idx) { onFleetChange(prev => prev.filter((_, i) => i !== idx)) }

  return (
    <Panel title="The Party" ornament="✦">

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Characters */}
      {tab === 'characters' && (
        <div>
          <div className={styles.charTabs}>
            {chars.map((c, i) => (
              <button key={i}
                className={`${styles.charTab} ${activeChar === i ? styles.charTabOn : ''}`}
                onClick={() => setActiveChar(i)}>
                {c.name || `Adventurer ${i + 1}`}
              </button>
            ))}
          </div>
          <CharacterSheet
            char={chars[activeChar]}
            onChange={updated => updateChar(activeChar, updated)}
            equipmentDB={equipmentDB} spellDB={spellDB}
            onAddEquipment={onAddEquipment} onAddSpell={onAddSpell}
          />
        </div>
      )}

      {/* Armies */}
      {tab === 'armies' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCount}>{armies.length} unit{armies.length !== 1 ? 's' : ''}</span>
            <button className={styles.addBtn} onClick={addArmy}>+ Add Unit</button>
          </div>
          {armies.length === 0 && (
            <p className={styles.emptyNote}>No army units yet. Add units to begin tracking your forces.</p>
          )}
          <div className={styles.cardGrid}>
            {armies.map((army, i) => (
              <ArmyCard key={army.id || i} army={army}
                onChange={updated => updateArmy(i, updated)}
                onRemove={() => removeArmy(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Fleet */}
      {tab === 'fleet' && (
        <FleetTab
          fleet={fleet}
          onFleetChange={onFleetChange}
          chars={chars}
        />
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div className={styles.section}>
          <div className={styles.notesLabel}>Campaign Notes</div>
          <textarea
            className={styles.notesArea}
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Record important events, decisions, alliances, rumours, and anything else worth remembering..."
            rows={16}
          />
        </div>
      )}

    </Panel>
  )
}
