import { useState } from 'react'
import { SKILLS, getModified } from '../data/defaults'
import Panel from './Panel'
import StepBar from './StepBar'
import styles from './SkillCheck.module.css'

export default function SkillCheck({ chars }) {
  const [checkType, setCheckType] = useState('individual')
  const [dc, setDc] = useState(4)
  const [needed, setNeeded] = useState(3)
  // For team checks, both characters always share the same skill
  const [teamSkill, setTeamSkill] = useState('Fighting')
  const [selections, setSelections] = useState([
    { charIdx: 0, skill: 'Fighting' },
    { charIdx: 1, skill: 'Stealth' },
  ])
  const [result, setResult] = useState(null)

  const count = checkType === 'team' ? 2 : 1

  function setSelChar(ci, charIdx) {
    setSelections(prev => prev.map((s, i) => i === ci ? { ...s, charIdx } : s))
  }
  // Individual: set skill for that specific selector
  function setSelSkill(ci, skill) {
    setSelections(prev => prev.map((s, i) => i === ci ? { ...s, skill } : s))
  }
  // Team: set the shared skill for both selectors at once
  function setSharedSkill(skill) {
    setTeamSkill(skill)
    setSelections(prev => prev.map(s => ({ ...s, skill })))
  }

  function rollCheck() {
    const allDice = []
    const names = []
    for (let ci = 0; ci < count; ci++) {
      const sel = selections[ci]
      const c = chars[sel.charIdx]
      const sk = checkType === 'team' ? teamSkill : sel.skill
      const num = getModified(c, sk)
      names.push(`${c.name || 'Adventurer ' + (sel.charIdx + 1)} (${sk} ${num})`)
      for (let d = 0; d < num; d++) allDice.push(Math.floor(Math.random() * 6) + 1)
    }
    const successes = allDice.filter(d => d >= dc).length
    setResult({ allDice, successes, needed, dc, names, passed: successes >= needed })
  }

  return (
    <Panel title="Skill Check" ornament="⚅">

      {/* Type toggle */}
      <div className={styles.row}>
        <span className={styles.label}>Check Type</span>
        <button className={`${styles.typeBtn} ${checkType === 'individual' ? styles.on : ''}`}
          onClick={() => setCheckType('individual')}>Individual</button>
        <button className={`${styles.typeBtn} ${checkType === 'team' ? styles.on : ''}`}
          onClick={() => setCheckType('team')}>Team (2 chars)</button>
      </div>

      {/* DC + Successes side by side */}
      <div className={styles.stepPair}>
        <StepBar label="DC" value={dc} onChange={setDc} min={1} max={6} />
        <StepBar label="Successes" value={needed} onChange={setNeeded} min={1} max={30} />
      </div>

      {/* For team checks: shared skill picker above the character boxes */}
      {checkType === 'team' && (
        <div className={styles.sharedSkillSection}>
          <span className={styles.selectorLabel}>Shared Skill (both characters must use the same)</span>
          <div className={styles.skillBtns}>
            {SKILLS.map(sk => {
              // show combined total of both selected chars for this skill
              const total = [selections[0], selections[1]].reduce((sum, sel) => sum + getModified(chars[sel.charIdx], sk), 0)
              return (
                <button key={sk}
                  className={`${styles.skillBtn} ${teamSkill === sk ? styles.skillOn : ''}`}
                  onClick={() => setSharedSkill(sk)}>
                  {sk} ({total} dice)
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Character selector(s) */}
      <div className={styles.charGrid} style={{ gridTemplateColumns: count === 2 ? '1fr 1fr' : '1fr' }}>
        {Array.from({ length: count }, (_, ci) => {
          const sel = selections[ci]
          const c = chars[sel.charIdx]
          const activeSkill = checkType === 'team' ? teamSkill : sel.skill
          return (
            <div key={ci} className={styles.charBox}>
              <div className={styles.charBoxLabel}>{count === 1 ? 'Character' : `Character ${ci + 1}`}</div>

              {/* Character name buttons */}
              <div className={styles.charSection}>
                <span className={styles.selectorLabel}>Who</span>
                <div className={styles.charBtns}>
                  {chars.map((ch, idx) => {
                    const skillVal = getModified(ch, activeSkill)
                    const otherSel = selections[ci === 0 ? 1 : 0]
                    const takenByOther = checkType === 'team' && otherSel.charIdx === idx && idx !== sel.charIdx
                    return (
                      <button key={idx}
                        className={`${styles.charBtn} ${sel.charIdx === idx ? styles.charBtnOn : ''} ${takenByOther ? styles.charBtnTaken : ''}`}
                        onClick={() => !takenByOther && setSelChar(ci, idx)}
                        disabled={takenByOther}>
                        {ch.name || `Adventurer ${idx + 1}`}
                        <span className={styles.charSkillBadge}>{skillVal}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Individual skill picker (only shown for individual checks) */}
              {checkType === 'individual' && (
                <div className={styles.skillSection}>
                  <span className={styles.selectorLabel}>Skill</span>
                  <div className={styles.skillBtns}>
                    {SKILLS.map(sk => (
                      <button key={sk}
                        className={`${styles.skillBtn} ${sel.skill === sk ? styles.skillOn : ''}`}
                        onClick={() => setSelSkill(ci, sk)}>
                        {sk} ({getModified(c, sk)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.diceCount}>
                Rolling <strong>{getModified(c, activeSkill)}</strong> dice
                {checkType === 'team' && <span className={styles.skillTag}> · {activeSkill}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <button className={styles.rollBtn} onClick={rollCheck}>Cast the Dice</button>

      {result && (
        <div className={styles.resultBox}>
          <div className={styles.resultTop}>
            <span className={styles.resultNum}>{result.successes} / {result.needed}</span>
            <span className={styles.resultVerdict} style={{ color: result.passed ? '#4a9a50' : '#8b1a1a' }}>
              {result.passed ? '✦ PASSED' : '✗ FAILED'}
            </span>
          </div>
          <div className={styles.resultDetail}>{result.names.join(' + ')} · DC {result.dc}+ · {result.allDice.length} dice</div>
          <div className={styles.diceRow}>
            {result.allDice.map((d, i) => (
              <span key={i} className={`${styles.die} ${d >= result.dc ? styles.hit : styles.miss}`}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
