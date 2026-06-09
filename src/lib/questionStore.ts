const USED_KEY = 'dq_used_ids'

export function loadUsedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(USED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function saveUsedIds(ids: Set<string>): void {
  localStorage.setItem(USED_KEY, JSON.stringify([...ids]))
}

export function clearUsedIds(): void {
  localStorage.removeItem(USED_KEY)
}
