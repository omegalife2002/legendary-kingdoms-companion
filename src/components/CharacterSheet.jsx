import { useState } from 'react'
import { SKILLS, EQ_SLOTS, SPELL_SLOTS, getModified, getItemBonus } from '../data/defaults'
import { parseEquipmentDetails } from '../data/dbParser'
import StepBar from './StepBar'
import DatabaseModal from './DatabaseModal'
import styles from './CharacterSheet.module.css'

const EQ_COLUMNS = [
  { key: 'name', label: 'Item' },
  { key: 'type', label: 'Type' },
  { key: 'details', label: 'Bonuses' },
]
const EQ_FIELDS = [
  { key: 'name', label: 'Item Name' },
  { key: 'type', label: 'Type (Weapon / Armour / Other / Shield)' },
  { key: 'details', label: 'Bonuses (e.g. +2 Fighting; +1 Armour)' },
]
const SPELL_COLUMNS = [
  { key: 'name', label: 'Spell' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'recharge', label: 'Recharge' },
]
const SPELL_FIELDS = [
  { key: 'name', label: 'Spell Name' },
  { key: 'type', label: 'Type (Combat / Adventure / etc.)' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'recharge', label: 'Recharge Cost' },
]

export default function CharacterSheet({ char, onChange, equipmentDB, spellDB, onAddEquipment, onAddSpell }) {
  const [eqModal, setEqModal] = useState(null)
  const [spellModal, setSpellModal] = useState(null)
  const [expandedSpell, setExpandedSpell] = useState(null)

  function update(field, value) { onChange({ ...char, [field]: value }) }
  function updateSkillBase(skill, value) { onChange({ ...char, skills: { ...char.skills, [skill]: parseInt(value) || 0 } }) }
  function updateSkillMod(skill, value) { onChange({ ...char, mods: { ...char.mods, [skill]: value } }) }
  function updateEq(index, field, value) {
    const eq = char.eq.map((e, i) => i === index ? { ...e, [field]: value } : e)
    onChange({ ...char, eq })
  }
  function clearEq(index) {
    const slot = char.eq[index]
    const eq = char.eq.map((e, i) => i === index ? { item: '', bonus: '' } : e)
    // Never modify char.skills — skill bonuses are computed live from eq slots.
    // Only reverse armour and maxHealth since those aren't auto-derived.
    if (slot?.bonus) {
      const parsed = parseEquipmentDetails(slot.bonus)
      onChange({
        ...char, eq,
        armour: parsed.armour ? Math.max(0, (parseInt(char.armour) || 0) - parsed.armour) : char.armour,
        maxHealth: parsed.maxHealth ? Math.max(1, (char.maxHealth || 8) - parsed.maxHealth) : char.maxHealth,
      })
    } else {
      onChange({ ...char, eq })
    }
  }
  function updateSpell(index, field, value) {
    const spells = char.spells.map((s, i) => i === index ? { ...s, [field]: value } : s)
    onChange({ ...char, spells })
  }
  function toggleSpell(index) {
    const spells = char.spells.map((s, i) => i === index ? { ...s, charged: !s.charged } : s)
    onChange({ ...char, spells })
  }

  function equipItem(slotIdx, item) {
    // Only write to the eq slot — NEVER touch char.skills.
    // Skill bonuses are computed live from eq by getItemBonus() in defaults.js.
    const eq = char.eq.map((e, i) => i === slotIdx ? { item: item.name, bonus: item.details || '' } : e)
    const parsed = parseEquipmentDetails(item.details)
    const wasEmpty = !char.eq[slotIdx]?.item
    onChange({
      ...char, eq,
      armour: wasEmpty && parsed.armour ? (parseInt(char.armour) || 0) + parsed.armour : char.armour,
      maxHealth: wasEmpty && parsed.maxHealth ? (char.maxHealth || 8) + parsed.maxHealth : char.maxHealth,
    })
  }

  function learnSpell(slotIdx, item) {
    const spells = char.spells.map((s, i) => i === slotIdx
      ? { name: item.name, cost: item.recharge || '', charged: true, description: item.description || '' }
      : s)
    onChange({ ...char, spells })
  }



  return (
    <div className={styles.sheet}>
      {eqModal !== null && (
        <DatabaseModal title="Select Equipment" items={equipmentDB || []} columns={EQ_COLUMNS}
          onSelect={item => equipItem(eqModal, item)} onClose={() => setEqModal(null)}
          onAddNew={item => { onAddEquipment(item); equipItem(eqModal, item) }}
          newItemTemplate={{ name: '', type: 'Other', details: '' }} newItemFields={EQ_FIELDS} />
      )}
      {spellModal !== null && (
        <DatabaseModal title="Select Spell" items={spellDB || []} columns={SPELL_COLUMNS}
          onSelect={item => learnSpell(spellModal, item)} onClose={() => setSpellModal(null)}
          onAddNew={item => { onAddSpell(item); learnSpell(spellModal, item) }}
          newItemTemplate={{ name: '', type: 'Combat', description: '', recharge: '' }} newItemFields={SPELL_FIELDS} />
      )}

      {/* Row 1: Identity */}
      <div className={styles.identityRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Name</label>
          <input className={styles.textInput} value={char.name} placeholder="Character name..."
            onChange={e => update('name', e.target.value)} />
        </div>
        <div className={styles.fieldGroup} style={{ flexBasis: '140px', flexGrow: 0 }}>
          <label className={styles.fieldLabel}>Status</label>
          <select className={styles.statusSelect} value={char.status} onChange={e => update('status', e.target.value)}>
            <option>alive</option><option>injured</option><option>dead</option>
          </select>
        </div>
      </div>

      {/* Row 2: Health bar + Armour */}
      <div className={styles.hpRow}>
        <div className={styles.hpSection}>
          <div className={styles.hpMeta}>
            <span className={styles.fieldLabel}>Health</span>
            <span className={styles.hpFraction}>
              {char.health}&nbsp;/&nbsp;
              <input className={styles.maxInput} type="number" min="1" value={char.maxHealth}
                onChange={e => update('maxHealth', parseInt(e.target.value) || 1)} title="Max HP" />
            </span>
          </div>
          <StepBar value={char.health} onChange={v => update('health', Math.min(v, char.maxHealth))}
            min={0} max={char.maxHealth} colorBar />
        </div>
        <div className={styles.armourSection}>
          <label className={styles.fieldLabel}>Armour</label>
          <input className={styles.armourInput} type="text" value={char.armour} placeholder="0"
            onChange={e => update('armour', e.target.value)} />
        </div>
      </div>

      {/* Row 3: Skills | Equipment | Spells */}
      <div className={styles.threeCol}>

        {/* Skills — now with Item bonus column */}
        <div className={styles.col}>
          <div className={styles.colTitle}>Skills</div>
          <table className={styles.skillTable}>
            <thead>
              <tr><th></th><th>Base</th><th>Mod</th><th>Item</th><th>Total</th></tr>
            </thead>
            <tbody>
              {SKILLS.map(sk => (
                <tr key={sk}>
                  <td><span className={styles.skillName}>{sk}</span></td>
                  <td><input className={styles.skillNum} type="number" min="0"
                    value={char.skills[sk]} onChange={e => updateSkillBase(sk, e.target.value)} /></td>
                  <td><input className={styles.skillMod} type="text" value={char.mods[sk]} placeholder="±"
                    onChange={e => updateSkillMod(sk, e.target.value)} /></td>
                  <td>
                    <span className={styles.skillItem} title="Bonus from equipped items">
                      {(() => { const v = getItemBonus(char, sk); return v > 0 ? `+${v}` : v < 0 ? `${v}` : '—' })()}
                    </span>
                  </td>
                  <td><span className={styles.skillFinal}>{getModified(char, sk)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.notesLabel}>Notes</div>
          <textarea className={styles.notes} value={char.notes} rows={3}
            placeholder="Conditions, quests..." onChange={e => update('notes', e.target.value)} />
        </div>

        {/* Equipment — item name full width, bonus below, remove button */}
        <div className={styles.col}>
          <div className={styles.colTitle}>Equipment (max 10)</div>
          <div className={styles.eqList}>
            {Array.from({ length: EQ_SLOTS }, (_, i) => {
              const slot = char.eq[i] || { item: '', bonus: '' }
              const hasItem = slot.item.trim() !== ''
              return (
                <div key={i} className={`${styles.eqSlot} ${hasItem ? styles.eqSlotFilled : ''}`}>
                  <div className={styles.eqSlotTop}>
                    <span className={styles.eqNum}>{i + 1}</span>
                    <input className={styles.eqItem} value={slot.item} placeholder="— empty —"
                      onChange={e => updateEq(i, 'item', e.target.value)} />
                    <button className={styles.dbBtn} onClick={() => setEqModal(i)} title="Pick from database">⊕</button>
                    {hasItem && (
                      <button className={styles.removeEqBtn} onClick={() => clearEq(i)} title="Remove item">✕</button>
                    )}
                  </div>
                  {hasItem && slot.bonus && (
                    <div className={styles.eqBonusRow}>
                      <input className={styles.eqBonus} value={slot.bonus} placeholder="bonuses..."
                        onChange={e => updateEq(i, 'bonus', e.target.value)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Spells — with description expand */}
        <div className={styles.col}>
          <div className={styles.colTitle} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Spellbook</span>
            <label className={styles.casterToggle}>
              <input type="checkbox" checked={char.isSpellcaster}
                onChange={e => update('isSpellcaster', e.target.checked)} />
              Spellcaster
            </label>
          </div>
          {char.isSpellcaster ? (
            <div className={styles.spellList}>
              {Array.from({ length: SPELL_SLOTS }, (_, i) => {
                const sp = char.spells[i] || { name: '', cost: '', charged: true, description: '' }
                const isExpanded = expandedSpell === i
                return (
                  <div key={i} className={styles.spellBlock}>
                    <div className={styles.spellRow}>
                      <span className={styles.spellNum}>{i + 1}</span>
                      <input className={styles.spellName} value={sp.name} placeholder="Spell..."
                        onChange={e => updateSpell(i, 'name', e.target.value)} />
                      <input className={styles.spellCost} type="text" value={sp.cost} placeholder="Cost"
                        onChange={e => updateSpell(i, 'cost', e.target.value)} />
                      <button
                        className={`${styles.chargeBtn} ${sp.charged ? styles.charged : styles.drained}`}
                        onClick={() => toggleSpell(i)}>
                        {sp.charged ? 'Charged' : 'Drained'}
                      </button>
                      <button className={styles.dbBtn} onClick={() => setSpellModal(i)} title="Pick from database">⊕</button>
                      {sp.description && (
                        <button className={styles.expandBtn} onClick={() => setExpandedSpell(isExpanded ? null : i)}
                          title="Show description">{isExpanded ? '▲' : '▼'}</button>
                      )}
                    </div>
                    {isExpanded && sp.description && (
                      <div className={styles.spellDesc}>{sp.description}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className={styles.noSpells}>Enable the spellcaster toggle to record spells.</p>
          )}
        </div>

      </div>
    </div>
  )
}
