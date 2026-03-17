# Legendary Kingdoms Companion

A digital campaign companion for the Legendary Kingdoms gamebook series. Built with React + Vite.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node)

### Install & Run

```bash
# 1. Navigate into the project folder
cd lkc

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open your browser to **http://localhost:5173**

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── main.jsx                    # App entry point
├── index.css                   # Global styles & CSS theme tokens
├── App.jsx                     # Root component, page routing, persisted state
├── App.module.css
│
├── hooks/
│   └── usePersist.js           # Drop-in useState replacement with localStorage sync
│
├── data/
│   └── defaults.js             # Character factory, default party data, skill helpers
│
└── components/
    ├── Panel.jsx               # Reusable parchment panel wrapper
    ├── CharacterSheet.jsx      # Full character sheet (stats, equipment, spells)
    ├── SkillCheck.jsx          # Skill check roller (individual & team)
    ├── Combat.jsx              # Combat round manager with dice resolution
    └── VaultAndCodes.jsx       # Shared vault storage + A1–A100 adventure codes
```

## Features

- **Persistent** — all campaign data (party, vault, codes) is saved to `localStorage` automatically. Refreshing the page or closing the browser preserves everything.
- **New Campaign** button in the header resets all data with a confirmation prompt.
- **Party** — 4-character party with name, class, status, health/max HP, armour, silver, skills (base/mod/final), equipment slots with bonuses, spellbook with charged/drained tracking, and notes
- **Skill Checks** — Individual or team checks, configurable DC and successes needed, visual dice result with hit/miss highlighting
- **Combat** — Add/remove enemies with Attack Dice, Attack DC, Defence, and HP; Party Attacks and Enemy Attacks resolve automatically with armour saves
- **Vault & Codes** — Shared party storage, vault silver, and all 100 A-codes to click and track

## How Persistence Works

`src/hooks/usePersist.js` exports a custom hook that is a drop-in replacement for `useState`:

```js
// Instead of:
const [chars, setChars] = useState(DEFAULT_CHARS)

// Use:
const [chars, setChars] = usePersist('lkc-chars', DEFAULT_CHARS)
```

It reads from `localStorage` on first render and writes back on every change via `useEffect`. If localStorage is unavailable (private browsing, storage full), it fails silently and behaves like normal `useState`.

All persisted keys are prefixed with `lkc-` so they're easy to find in browser DevTools → Application → Local Storage.

## Adding Features

Each section is its own component file — to extend the app:

- Add a new character stat → edit `defaults.js` and `CharacterSheet.jsx`
- Add a new page (e.g. Armies) → create a new component, add it to `PAGES` in `App.jsx`
- Persist data across sessions → add `localStorage` reads/writes in `App.jsx` using `useEffect`
