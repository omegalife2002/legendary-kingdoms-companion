// Parses an equipment "details" string like "+2 Fighting; +1 Armour; +3 Lore"
// Returns an object of stat deltas that can be applied to a character
const SKILL_MAP = {
  'fighting': 'Fighting',
  'stealth': 'Stealth',
  'lore': 'Lore',
  'survival': 'Survival',
  'charisma': 'Charisma',
}

export function parseEquipmentDetails(details) {
  const result = {
    armour: 0,
    maxHealth: 0,
    skills: { Fighting: 0, Stealth: 0, Lore: 0, Survival: 0, Charisma: 0 },
    notes: '',
  }
  if (!details) return result

  const parts = details.split(';').map(s => s.trim())
  for (const part of parts) {
    const m = part.match(/([+-]\d+)\s+(.+)/i)
    if (!m) { result.notes += (result.notes ? '; ' : '') + part; continue }
    const val = parseInt(m[1])
    const key = m[2].trim().toLowerCase()
    if (key === 'armour') { result.armour += val; continue }
    if (key === 'maximum health' || key === 'max health' || key === 'health') { result.maxHealth += val; continue }
    if (key === 'all skills') {
      for (const sk of Object.values(SKILL_MAP)) result.skills[sk] += val
      continue
    }
    const sk = SKILL_MAP[key]
    if (sk) result.skills[sk] += val
    else result.notes += (result.notes ? '; ' : '') + part
  }
  return result
}
