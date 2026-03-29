export function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function readOptionalText(value: unknown) {
  if (value === undefined || value === null) return ''
  return readText(value)
}

export function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

export function isGender(value: unknown): value is '男' | '女' {
  return value === '男' || value === '女'
}
