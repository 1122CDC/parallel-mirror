import fs from 'node:fs'
import path from 'node:path'

function parseLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex < 0) {
    return null
  }

  const key = trimmed.slice(0, separatorIndex).trim()
  if (!key) {
    return null
  }

  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const entry = parseLine(line)
    if (!entry) {
      continue
    }

    if (process.env[entry.key] === undefined) {
      process.env[entry.key] = entry.value
    }
  }
}

const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
]

for (const candidate of candidates) {
  loadEnvFile(candidate)
}
