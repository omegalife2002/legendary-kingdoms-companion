import { useState } from 'react'
import styles from './RefLog.module.css'

function makeEntry() {
  return { id: Date.now() + Math.random(), ref: '', note: '', done: false }
}

export default function RefLog({ entries, onChange }) {
  function add() {
    onChange(prev => [...prev, makeEntry()])
  }
  function update(id, field, val) {
    onChange(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e))
  }
  function toggle(id) {
    onChange(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e))
  }
  function remove(id) {
    onChange(prev => prev.filter(e => e.id !== id))
  }
  function clearDone() {
    onChange(prev => prev.filter(e => !e.done))
  }

  const active = entries.filter(e => !e.done)
  const done   = entries.filter(e => e.done)

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.count}>{active.length} open · {done.length} visited</span>
        <div className={styles.headerBtns}>
          {done.length > 0 && (
            <button className={styles.clearBtn} onClick={clearDone}>Clear Visited</button>
          )}
          <button className={styles.addBtn} onClick={add}>+ Add Ref</button>
        </div>
      </div>

      {entries.length === 0 && (
        <p className={styles.empty}>No references logged yet. Add a ref number to revisit later.</p>
      )}

      <div className={styles.list}>
        {/* Active entries first */}
        {active.map(e => (
          <div key={e.id} className={styles.entry}>
            <button className={styles.checkBtn} onClick={() => toggle(e.id)} title="Mark as visited">
              <span className={styles.checkCircle} />
            </button>
            <input
              className={styles.refNum}
              value={e.ref}
              placeholder="§"
              onChange={ev => update(e.id, 'ref', ev.target.value)}
              title="Reference number"
            />
            <input
              className={styles.refNote}
              value={e.note}
              placeholder="Note — what's here, why return..."
              onChange={ev => update(e.id, 'note', ev.target.value)}
            />
            <button className={styles.removeBtn} onClick={() => remove(e.id)}>✕</button>
          </div>
        ))}

        {/* Visited entries */}
        {done.length > 0 && (
          <>
            <div className={styles.divider}>Visited</div>
            {done.map(e => (
              <div key={e.id} className={`${styles.entry} ${styles.entryDone}`}>
                <button className={styles.checkBtn} onClick={() => toggle(e.id)} title="Unmark">
                  <span className={`${styles.checkCircle} ${styles.checkDone}`}>✓</span>
                </button>
                <span className={styles.refNumDone}>{e.ref || '—'}</span>
                <span className={styles.refNoteDone}>{e.note}</span>
                <button className={styles.removeBtn} onClick={() => remove(e.id)}>✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
