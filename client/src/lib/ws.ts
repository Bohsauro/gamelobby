import type { ClientMessage, ServerMessage } from './types'

export type WsStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

type AnyHandler = (msg: ServerMessage) => void

const BACKOFFS_MS = [1000, 2000, 5000]
const MAX_ATTEMPTS = 5
const PING_INTERVAL_MS = 25_000

const SILENT_TYPES = new Set<string>(['pong'])

function defaultWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

function safeParse(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    if (typeof record.type !== 'string') return null
    return parsed as ServerMessage
  } catch {
    return null
  }
}

class WsClient {
  private ws: WebSocket | null = null
  private url = ''
  private nickname: string | null = null
  private announced: string | null = null
  private status: WsStatus = 'connecting'
  private attempts = 0
  private queue: ClientMessage[] = []
  private pingTimer: number | null = null
  private statusCbs = new Set<(s: WsStatus) => void>()
  private typeCbs = new Map<string, Set<AnyHandler>>()

  getStatus(): WsStatus {
    return this.status
  }

  private setStatus(next: WsStatus): void {
    if (this.status === next) return
    this.status = next
    this.statusCbs.forEach((cb) => cb(next))
  }

  onStatus(cb: (s: WsStatus) => void): () => void {
    this.statusCbs.add(cb)
    return () => {
      this.statusCbs.delete(cb)
    }
  }

  on<K extends ServerMessage['type']>(
    type: K,
    handler: (msg: Extract<ServerMessage, { type: K }>) => void,
  ): () => void {
    let set = this.typeCbs.get(type)
    if (!set) {
      set = new Set<AnyHandler>()
      this.typeCbs.set(type, set)
    }
    const wrapped = handler as AnyHandler
    set.add(wrapped)
    return () => {
      set.delete(wrapped)
    }
  }

  joinLobby(nickname: string): void {
    this.nickname = nickname.trim() === '' ? null : nickname
    if (this.status === 'closed') this.attempts = 0
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Socket già aperto: join_lobby va annunciato SOLO se il nickname è cambiato
      // (join_lobby sul server = "torna alla lobby", esce da una stanza eventuale:
      // re-annunciare lo stesso nickname a ogni mount butterebbe fuori dalla stanza).
      if (this.nickname && this.nickname !== this.announced) {
        this.announced = this.nickname
        this.send({ type: 'join_lobby', nickname: this.nickname })
      }
      return
    }
    this.ensureSocket()
  }

  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    } else {
      this.queue.push(msg)
    }
  }

  close(): void {
    this.nickname = null
    this.stopPing()
    const ws = this.ws
    this.ws = null
    this.attempts = MAX_ATTEMPTS
    if (ws) ws.close()
    this.setStatus('closed')
  }

  private ensureSocket(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }
    this.connect()
  }

  private connect(): void {
    this.url = this.url || defaultWsUrl()
    this.attempts += 1
    this.setStatus(this.attempts > 1 ? 'reconnecting' : 'connecting')

    const ws = new WebSocket(this.url)
    this.ws = ws

    ws.onopen = () => {
      this.attempts = 0
      this.setStatus('open')
      this.flushQueue()
      if (this.nickname) {
        this.announced = this.nickname
        this.send({ type: 'join_lobby', nickname: this.nickname })
      }
      this.startPing()
    }

    ws.onmessage = (ev) => {
      this.handleMessage(ev.data)
    }

    ws.onclose = () => {
      this.stopPing()
      if (this.ws !== ws) return
      this.ws = null
      if (this.attempts >= MAX_ATTEMPTS) {
        this.setStatus('closed')
        return
      }
      this.setStatus('reconnecting')
      const delay = BACKOFFS_MS[Math.min(this.attempts - 1, BACKOFFS_MS.length - 1)] ?? 5000
      window.setTimeout(() => {
        if (this.attempts >= MAX_ATTEMPTS) return
        this.connect()
      }, delay)
    }

    ws.onerror = () => {
      // onclose segue sempre un errore: qui non serve altro
    }
  }

  private flushQueue(): void {
    while (this.queue.length > 0) {
      const msg = this.queue.shift()
      if (msg) this.send(msg)
    }
  }

  private handleMessage(raw: unknown): void {
    const msg = safeParse(raw)
    if (!msg) {
      if (import.meta.env.DEV) console.warn('[ws] messaggio non valido, ignorato')
      return
    }
    const set = this.typeCbs.get(msg.type)
    if (set && set.size > 0) {
      set.forEach((cb) => cb(msg))
    } else if (import.meta.env.DEV && !SILENT_TYPES.has(msg.type)) {
      console.warn(`[ws] nessun handler registrato per "${msg.type}"`)
    }
  }

  private startPing(): void {
    this.stopPing()
    this.pingTimer = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, PING_INTERVAL_MS)
  }

  private stopPing(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

export const wsClient = new WsClient()