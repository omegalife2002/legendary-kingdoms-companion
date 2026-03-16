import { useState } from 'react'
import Panel from './Panel'
import DatabaseModal from './DatabaseModal'
import styles from './VaultAndCodes.module.css'

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

function makeSpell() {
  return { name: '', description: '', charged: true, recharge: '' }
}

export default function VaultAndCodes({
  items, onItemsChange,
  codes, onCodesChange,
  grimoire, onGrimoireChange,
  equipmentDB, spellDB,
  onAddEquipment, onAddSpell,
}) {
  const [eqModal, setEqModal] = useState(false)
  const [spellModal, setSpellModal] = useState(false)
  const [expandedSpell, setExpandedSpell] = useState(null)

  function toggleCode(i) {
    onCodesChange(prev => prev.map((c, idx) => idx === i ? !c : c))
  }
  function updateItem(i, val) {
    onItemsChange(prev => prev.map((it, idx) => idx === i ? val : it))
  }
  function addVaultSlot() { onItemsChange(prev => [...prev, '']) }
  function removeVaultSlot(i) { onItemsChange(prev => prev.filter((_, idx) => idx !== i)) }

  function updateSpell(i, field, val) {
    onGrimoireChange(prev => prev.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp))
  }
  function toggleSpell(i) {
    onGrimoireChange(prev => prev.map((sp, idx) => idx === i ? { ...sp, charged: !sp.charged } : sp))
  }
  function removeSpell(i) {
    onGrimoireChange(prev => prev.filter((_, idx) => idx !== i))
    if (expandedSpell === i) setExpandedSpell(null)
  }
  function addSpellFromDB(item) {
    onGrimoireChange(prev => [...prev, {
      name: item.name, description: item.description || '', charged: true, recharge: item.recharge || ''
    }])
  }
  function addEquipmentToVault(item) {
    onItemsChange(prev => [...prev, `${item.name}${item.details ? ' (' + item.details + ')' : ''}`])
  }

  return (
    <div className={styles.wrapper}>
      {eqModal && (
        <DatabaseModal title="Add Item to Vault" items={equipmentDB || []} columns={EQ_COLUMNS}
          onSelect={item => { addEquipmentToVault(item); setEqModal(false) }}
          onClose={() => setEqModal(false)}
          onAddNew={item => { onAddEquipment && onAddEquipment(item); addEquipmentToVault(item); setEqModal(false) }}
          newItemTemplate={{ name: '', type: 'Other', details: '' }} newItemFields={EQ_FIELDS} />
      )}
      {spellModal && (
        <DatabaseModal title="Add Spell to Grimoire" items={spellDB || []} columns={SPELL_COLUMNS}
          onSelect={item => { addSpellFromDB(item); setSpellModal(false) }}
          onClose={() => setSpellModal(false)}
          onAddNew={item => { onAddSpell && onAddSpell(item); addSpellFromDB(item); setSpellModal(false) }}
          newItemTemplate={{ name: '', type: 'Combat', description: '', recharge: '' }} newItemFields={SPELL_FIELDS} />
      )}

      <div className={styles.topRow}>

        {/* Vault */}
        <Panel title="The Vault — Shared Storage" ornament="◈"
          action={<button className={styles.dbPanelBtn} onClick={() => setEqModal(true)}>⊕ From Database</button>}>
          <div className={styles.itemList}>
            {items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <span className={styles.itemNum}>{i + 1}</span>
                <input className={styles.itemInput} value={item} placeholder="Stored item..."
                  onChange={e => updateItem(i, e.target.value)} />
                <button className={styles.removeBtn} onClick={() => removeVaultSlot(i)}>✕</button>
              </div>
            ))}
          </div>
          <button className={styles.addBtn} onClick={addVaultSlot}>+ Add Blank Slot</button>
        </Panel>

        {/* Grimoire */}
        <Panel title="The Grimoire — Stored Spells" ornament="✦"
          action={<button className={styles.dbPanelBtn} onClick={() => setSpellModal(true)}>⊕ From Database</button>}>
          <div className={styles.spellList}>
            {grimoire.length === 0 && (
              <p className={styles.emptyNote}>No spells stored. Add spells to keep them available for later use.</p>
            )}
            {grimoire.map((sp, i) => {
              const isExpanded = expandedSpell === i
              return (
                <div key={i} className={styles.spellBlock}>
                  <div className={styles.spellTop}>
                    <input className={styles.spellName} value={sp.name} placeholder="Spell name..."
                      onChange={e => updateSpell(i, 'name', e.target.value)} />
                    {sp.recharge && <span className={styles.spellRecharge}>{sp.recharge}</span>}
                    <button className={`${styles.chargeBtn} ${sp.charged ? styles.charged : styles.drained}`}
                      onClick={() => toggleSpell(i)}>
                      {sp.charged ? 'Charged' : 'Drained'}
                    </button>
                    {sp.description && (
                      <button className={styles.expandBtn} onClick={() => setExpandedSpell(isExpanded ? null : i)}
                        title="Show description">{isExpanded ? '▲' : '▼'}</button>
                    )}
                    <button className={styles.removeBtn} onClick={() => removeSpell(i)}>✕</button>
                  </div>
                  {isExpanded && sp.description && (
                    <div className={styles.spellDescExpanded}>{sp.description}</div>
                  )}
                </div>
              )
            })}
          </div>
          <button className={styles.addBtn} onClick={() => onGrimoireChange(prev => [...prev, makeSpell()])}>+ Add Blank Spell</button>
        </Panel>

      </div>

      <Panel title="Adventure Codes" ornament="A">
        <div className={styles.codesGrid}>
          {codes.map((on, i) => (
            <button key={i} className={`${styles.codePip} ${on ? styles.circled : ''}`}
              onClick={() => toggleCode(i)}>
              A{i + 1}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
