import { readFileSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_BALANCE = 1000
const MAX_BALANCE = 100_000

export class ChipWallet {
  constructor(filePath) {
    this.filePath = filePath
    this.balances = new Map() // nickname (lowercase) -> balance
    this._load()
  }

  _load() {
    try {
      const raw = readFileSync(this.filePath, 'utf8')
      const data = JSON.parse(raw)
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            this.balances.set(key.toLowerCase(), Math.floor(value))
          }
        }
      }
    } catch {
      // file mancante o corrotto: si parte con un wallet vuoto
    }
  }

  get(nickname) {
    const key = nickname.toLowerCase()
    let balance = this.balances.get(key)
    if (typeof balance !== 'number') {
      balance = DEFAULT_BALANCE
      this.balances.set(key, balance)
    }
    return balance
  }

  add(nickname, amount) {
    const current = this.get(nickname)
    const next = Math.min(MAX_BALANCE, current + Math.max(0, Math.trunc(amount)))
    this.balances.set(nickname.toLowerCase(), next)
    return next
  }

  save() {
    mkdirSync(path.dirname(this.filePath), { recursive: true })
    const data = Object.fromEntries(this.balances.entries())
    return writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8')
  }
}