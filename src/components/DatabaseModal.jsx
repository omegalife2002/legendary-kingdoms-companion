import { useState, useMemo } from 'react'
import styles from './DatabaseModal.module.css'

/**
 * Generic searchable-list modal.
 * Props:
 *   title       string
 *   items       array of objects with at least a .name field
 *   columns     [{ key, label, render? }]  — columns to show in the list
 *   onSelect    (item) => void
 *   onClose     () => void
 *   onAddNew    (newItem) => void           — called when user saves a new custom item
 *   newItemTemplate  object                — blank object to pre-fill the "add new" form
 *   newItemFields    [{ key, label, type }] — fields for the add-new form
 */
export default function DatabaseModal({ title, items, columns, onSelect, onClose, onAddNew, newItemTemplate, newItemFields }) {
  const [query, setQuery] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem] = useState(() => ({ ...newItemTemplate }))

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(it => it.name.toLowerCase().includes(q) ||
      Object.values(it).some(v => String(v).toLowerCase().includes(q)))
  }, [items, query])

  function saveNew() {
    if (!newItem.name?.trim()) return
    onAddNew({ ...newItem })
    setAddingNew(false)
    setNewItem({ ...newItemTemplate })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!addingNew ? (
          <>
            <div className={styles.searchRow}>
              <input
                className={styles.search}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
              />
              <button className={styles.addNewBtn} onClick={() => setAddingNew(true)}>+ Add New</button>
            </div>
            <div className={styles.listWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map(c => <th key={c.key}>{c.label}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={i} className={styles.row}>
                      {columns.map(c => (
                        <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>
                      ))}
                      <td>
                        <button className={styles.selectBtn} onClick={() => { onSelect(item); onClose() }}>
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={columns.length + 1} className={styles.empty}>No results for "{query}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className={styles.addForm}>
            <div className={styles.addFormTitle}>Add New Entry</div>
            {newItemFields.map(f => (
              <div key={f.key} className={styles.formRow}>
                <label className={styles.formLabel}>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea className={styles.formTextarea} value={newItem[f.key] || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, [f.key]: e.target.value }))} rows={3} />
                ) : (
                  <input className={styles.formInput} type={f.type || 'text'} value={newItem[f.key] || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
            <div className={styles.formBtns}>
              <button className={styles.saveBtn} onClick={saveNew}>Save &amp; Select</button>
              <button className={styles.cancelBtn} onClick={() => setAddingNew(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
