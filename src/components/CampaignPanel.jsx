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
        <div className={styles.section}>
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
        </div>
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
