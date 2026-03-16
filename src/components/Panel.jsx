import styles from './Panel.module.css'

export default function Panel({ title, ornament = '✦', children, style, action }) {
  return (
    <div className={styles.panel} style={style}>
      <div className={styles.title}>
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {action}
          <span className={styles.ornament}>{ornament}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
