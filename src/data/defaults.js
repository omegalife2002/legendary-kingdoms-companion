export const SKILLS = ['Fighting', 'Stealth', 'Lore', 'Survival', 'Charisma']
export const EQ_SLOTS = 10
export const SPELL_SLOTS = 6

export function makeChar(name = '', cls = '', hp = 8, f = 0, st = 0, lo = 0, su = 0, ch = 0, isSC = false) {
  return {
    name,
    cls,
    health: hp,
    maxHealth: hp,
    armour: 0,
    silver: 0,
    status: 'alive',
    skills: { Fighting: f, Stealth: st, Lore: lo, Survival: su, Charisma: ch },
    mods:   { Fighting: '', Stealth: '', Lore: '', Survival: '', Charisma: '' },
    eq: Array.from({ length: EQ_SLOTS }, () => ({ item: '', bonus: '' })),
    spells: Array.from({ length: SPELL_SLOTS }, () => ({ name: '', cost: '', charged: true })),
    notes: '',
    isSpellcaster: isSC,
  }
}

import { parseEquipmentDetails } from './dbParser'

export function getItemBonus(char, skill) {
  let total = 0
  for (const slot of (char.eq || [])) {
    if (!slot?.bonus) continue
    const parsed = parseEquipmentDetails(slot.bonus)
    total += parsed.skills[skill] || 0
  }
  return total
}

export function getModified(char, skill) {
  const base = char.skills[skill] || 0
  const mod  = parseInt(char.mods[skill]) || 0
  const item = getItemBonus(char, skill)
  return base + mod + item
}

export const DEFAULT_CHARS = [
  (() => {
    const c = makeChar('Sar Jessica Dayne', 'Knight', 8, 5, 1, 3, 2, 4, false)
    return c
  })(),
  (() => {
    const c = makeChar("Lord Ti'quon", 'Sorcerer', 6, 1, 2, 5, 1, 2, true)
    c.spells[0] = { name: 'Ice Bolt',        cost: '50', charged: true }
    c.spells[1] = { name: 'Poison Stream',   cost: '50', charged: true }
    c.spells[2] = { name: 'Unfailing Strike', cost: '50', charged: true }
    return c
  })(),
  makeChar('Tasha', 'Buccaneer', 8, 3, 5, 1, 3, 3, false),
  makeChar('', '', 8, 0, 0, 0, 0, 0, false),
]

export const DEFAULT_ENEMIES = [
  { name: 'Enemy', attack: 4, atkDC: 5, def: 4, health: 6, maxHealth: 6 },
]
