import styles from './ThemeSwitcher.module.css'

const THEMES = [
  {
    key: 'valley',
    label: 'Valley of Bones',
    short: 'Book I',
    accent: '#d4a017',
    bg: '#2c1f0e',
  },
  {
    key: 'crown',
    label: 'Crown and Tower',
    short: 'Book II',
    accent: '#c0d0e0',
    bg: '#0f1820',
  },
  {
    key: 'pirates',
    label: 'Pirates of the Splintered Isles',
    short: 'Book III',
    accent: '#e0a830',
    bg: '#1a2018',
  },
]

export default function ThemeSwitcher({ theme, onThemeChange }) {
  return (
    <div className={styles.switcher}>
      {THEMES.map(t => (
        <button
          key={t.key}
          className={`${styles.btn} ${theme === t.key ? styles.active : ''}`}
          onClick={() => onThemeChange(t.key)}
          title={t.label}
          style={{
            '--t-accent': t.accent,
            '--t-bg': t.bg,
          }}
        >
          <span className={styles.dot} />
          <span className={styles.label}>{t.short}</span>
        </button>
      ))}
    </div>
  )
}
