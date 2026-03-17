import { useState, useRef } from 'react'
import { makeChar } from './data/defaults'
import { usePersist } from './hooks/usePersist'
import CharacterSheet from './components/CharacterSheet'
import SkillCheck from './components/SkillCheck'
import Combat from './components/Combat'
import VaultAndCodes from './components/VaultAndCodes'
import Panel from './components/Panel'
import CampaignPanel from './components/CampaignPanel'
import styles from './App.module.css'

// Static base databases — imported from JSON files
import BASE_EQUIPMENT from './data/db_equipment.json'
import BASE_ENEMIES   from './data/db_enemies.json'
import BASE_SPELLS    from './data/db_spells.json'

const PAGES = ['party', 'checks', 'combat', 'vault']
const PAGE_LABELS = { party: 'Party', checks: 'Skill Checks', combat: 'Combat', vault: 'Vault & Codes' }

function blankParty() {
  return Array.from({ length: 4 }, () => makeChar())
}

export default function App() {
  const [page, setPage] = useState('party')
  const [activeChar, setActiveChar] = useState(0)

  // Campaign state — persisted
  const [chars, setChars]             = usePersist('lkc-chars', blankParty())
  const [silver, setSilver]           = usePersist('lkc-silver', 0)
  const [location, setLocation]       = usePersist('lkc-location', '')
  const [vaultItems, setVaultItems]   = usePersist('lkc-vault-items', ['', '', '', ''])
  const [grimoire, setGrimoire]       = usePersist('lkc-grimoire', [])
  const [codes, setCodes]             = usePersist('lkc-codes', Array(100).fill(false))
  const [armies, setArmies]           = usePersist('lkc-armies', [])
  const [fleet, setFleet]             = usePersist('lkc-fleet', [])
  const [campNotes, setCampNotes]     = usePersist('lkc-notes', '')

  // Custom database additions — persisted so new entries survive refresh
  const [customEquipment, setCustomEquipment] = usePersist('lkc-db-equipment', [])
  const [customEnemies,   setCustomEnemies]   = usePersist('lkc-db-enemies', [])
  const [customSpells,    setCustomSpells]    = usePersist('lkc-db-spells', [])

  // Merged databases: base + any user additions
  const equipmentDB = [...BASE_EQUIPMENT, ...customEquipment]
  const enemyDB     = [...BASE_ENEMIES,   ...customEnemies]
  const spellDB     = [...BASE_SPELLS,    ...customSpells]

  function updateChar(idx, updated) {
    setChars(prev => prev.map((c, i) => i === idx ? updated : c))
  }

  const fileInputRef = useRef(null)

  function saveCampaign() {
    const campaignName = chars[0]?.name
      ? chars.filter(c => c.name).map(c => c.name).join(', ')
      : 'Campaign'
    const data = {
      version: 1,
      savedAt: new Date().toISOString(),
      campaignName,
      chars,
      silver,
      location,
      vaultItems,
      grimoire,
      codes,
      armies,
      fleet,
      campNotes,
      customEquipment,
      customEnemies,
      customSpells,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `LKC Game Save ${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadCampaign(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result)
        if (!data.version || !data.chars) {
          alert('This file doesn\'t look like a valid LKC campaign save.')
          return
        }
        if (!window.confirm(`Load campaign "${data.campaignName}"? This will replace your current campaign data.`)) return
        setChars(data.chars)
        setSilver(data.silver ?? 0)
        setLocation(data.location ?? '')
        setVaultItems(data.vaultItems ?? ['', '', '', ''])
        setGrimoire(data.grimoire ?? [])
        setCodes(data.codes ?? Array(100).fill(false))
        setArmies(data.armies ?? [])
        setFleet(data.fleet ?? [])
        setCampNotes(data.campNotes ?? '')
        setCustomEquipment(data.customEquipment ?? [])
        setCustomEnemies(data.customEnemies ?? [])
        setCustomSpells(data.customSpells ?? [])
        setActiveChar(0)
        setPage('party')
      } catch {
        alert('Could not read the file. Make sure it\'s a valid LKC save file.')
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-loaded if needed
    e.target.value = ''
  }

  function resetAll() {
    if (!window.confirm('Reset all campaign data and start fresh? This cannot be undone.')) return
    setChars(blankParty())
    setSilver(0)
    setLocation('')
    setVaultItems(['', '', '', ''])
    setGrimoire([])
    setCodes(Array(100).fill(false))
    setArmies([])
    setFleet([])
    setCampNotes('')
    setActiveChar(0)
    setPage('party')
  }

  return (
    <div className={styles.app}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>Legendary Kingdoms</div>
          <div className={styles.subtitle}>Campaign Companion</div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.quickStat}>
            <span className={styles.quickLabel}>Silver</span>
            <div className={styles.quickControls}>
              <button className={styles.quickBtn} onClick={() => setSilver(s => Math.max(0, s - 10))}>−10</button>
              <button className={styles.quickBtn} onClick={() => setSilver(s => Math.max(0, s - 1))}>−1</button>
              <input className={styles.quickNum} type="number" min="0" value={silver}
                onChange={e => setSilver(Math.max(0, parseInt(e.target.value) || 0))} />
              <button className={styles.quickBtn} onClick={() => setSilver(s => s + 1)}>+1</button>
              <button className={styles.quickBtn} onClick={() => setSilver(s => s + 10)}>+10</button>
            </div>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickLabel}>Location</span>
            <input className={styles.locationInput} type="text" value={location} placeholder="Ref #"
              onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <nav className={styles.nav}>
          {PAGES.map(p => (
            <button key={p}
              className={`${styles.navBtn} ${page === p ? styles.navOn : ''}`}
              onClick={() => setPage(p)}>
              {PAGE_LABELS[p]}
            </button>
          ))}
          <div className={styles.navDivider} />
          <button className={styles.saveBtn} onClick={saveCampaign} title="Export campaign to a .json file">
            ↓ Save
          </button>
          <button className={styles.loadBtn} onClick={() => fileInputRef.current.click()} title="Import a saved campaign file">
            ↑ Load
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={loadCampaign} />
          <button className={styles.resetBtn} onClick={resetAll}>New Campaign</button>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* PARTY */}
        <div style={{ display: page === 'party' ? 'block' : 'none' }}>
          <CampaignPanel
            chars={chars} activeChar={activeChar} setActiveChar={setActiveChar}
            updateChar={(idx, updated) => setChars(prev => prev.map((c, i) => i === idx ? updated : c))}
            equipmentDB={equipmentDB} spellDB={spellDB}
            onAddEquipment={item => setCustomEquipment(prev => [...prev, item])}
            onAddSpell={item => setCustomSpells(prev => [...prev, item])}
            armies={armies} onArmiesChange={setArmies}
            fleet={fleet} onFleetChange={setFleet}
            notes={campNotes} onNotesChange={setCampNotes}
          />
        </div>

        {/* SKILL CHECKS */}
        <div style={{ display: page === 'checks' ? 'block' : 'none' }}>
          <SkillCheck chars={chars} />
        </div>

        {/* COMBAT */}
        <div style={{ display: page === 'combat' ? 'block' : 'none' }}>
          <Combat
            chars={chars}
            onUpdateChars={setChars}
            enemyDB={enemyDB}
            onAddEnemy={item => setCustomEnemies(prev => [...prev, item])}
            armies={armies}
          />
        </div>

        {/* VAULT & CODES */}
        <div style={{ display: page === 'vault' ? 'block' : 'none' }}>
          <VaultAndCodes
            items={vaultItems} onItemsChange={setVaultItems}
            grimoire={grimoire} onGrimoireChange={setGrimoire}
            codes={codes} onCodesChange={setCodes}
            equipmentDB={equipmentDB} spellDB={spellDB}
            onAddEquipment={item => setCustomEquipment(prev => [...prev, item])}
            onAddSpell={item => setCustomSpells(prev => [...prev, item])}
          />
        </div>

      </main>
    </div>
  )
}
