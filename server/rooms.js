import { randomUUID } from 'node:crypto'

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ID_LENGTH = 6

export const GAME_SLUGS = new Set(['carte', '3d', 'tavolo', 'party'])
export const MAX_PLAYERS_CHOICES = new Set([2, 4, 6, 8])
export const ROOM_NAME_MAX = 40
export const NICKNAME_MAX = 16
export const CHAT_MAX = 500

export class RoomManager {
  constructor(onEvent = () => {}) {
    this.clients = new Map() // clientId -> { id, nickname, roomId, ws }
    this.rooms = new Map() // roomId -> { id, name, game, maxPlayers, status, createdAt, players: Map }
    this.onEvent = onEvent
  }

  // ---------- interni ----------

  _send(clientId, msg) {
    const client = this.clients.get(clientId)
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(msg))
    }
  }

  _sendAll(msg) {
    for (const client of this.clients.values()) {
      this._send(client.id, msg)
    }
  }

  _sendRoom(room, msg) {
    for (const playerId of room.players.keys()) {
      this._send(playerId, msg)
    }
  }

  _summary(room) {
    return {
      id: room.id,
      name: room.name,
      game: room.game,
      maxPlayers: room.maxPlayers,
      players: room.players.size,
      status: room.status,
    }
  }

  _detail(room) {
    return {
      ...this._summary(room),
      players: [...room.players.values()].map(({ id, nickname, host }) => ({
        id,
        nickname,
        host,
      })),
      createdAt: room.createdAt,
    }
  }

  _genId() {
    let id = ''
    for (let i = 0; i < ID_LENGTH; i += 1) {
      id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
    }
    return id
  }

  _uniqueNickname(room, base) {
    const taken = new Set([...room.players.values()].map((player) => player.nickname))
    if (!taken.has(base)) return base
    let n = 2
    while (taken.has(`${base}#${n}`)) n += 1
    return `${base}#${n}`
  }

  _broadcastLobby() {
    const rooms = [...this.rooms.values()]
      .map((room) => this._summary(room))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))
    this._sendAll({ type: 'lobby_update', rooms })
  }

  _leaveRoom(clientId) {
    const client = this.clients.get(clientId)
    if (!client || !client.roomId) return false
    const room = this.rooms.get(client.roomId)
    client.roomId = null
    if (!room) return false

    room.players.delete(clientId)
    this._sendRoom(room, { type: 'room_update', room: this._detail(room) })

    if (room.players.size === 0) {
      this.rooms.delete(room.id)
      this.onEvent(`destroy ${room.id}`)
    }
    this._broadcastLobby()
    return true
  }

  listSummaries() {
    return [...this.rooms.values()]
      .map((room) => this._summary(room))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }

  // ---------- azioni ----------

  joinLobby(clientId, nickname) {
    const client = this.clients.get(clientId)
    if (!client) {
      return { type: 'error', message: 'Sessione non valida.' }
    }
    // Ricollegamento: la lobby è l'orbita di default
    this._leaveRoom(clientId)
    client.nickname = nickname
    this.onEvent(`join_lobby ${nickname} (${clientId})`)
    return {
      type: 'hello',
      you: { id: client.id, nickname },
      rooms: this.listSummaries(),
    }
  }

  createRoom(clientId, name, game, maxPlayers) {
    const client = this.clients.get(clientId)
    if (!client) {
      return { type: 'error', message: 'Sessione non valida.' }
    }
    if (client.roomId) {
      const current = this.rooms.get(client.roomId)
      if (current) {
        return { type: 'error', message: 'Sei già in una stanza.' }
      }
      client.roomId = null
    }
    if (!client.nickname) {
      return { type: 'error', message: 'Scegli prima un nickname.' }
    }

    const room = {
      id: this._genId(),
      name,
      game,
      maxPlayers,
      status: 'waiting',
      createdAt: Date.now(),
      players: new Map(),
    }
    this.rooms.set(room.id, room)

    client.roomId = room.id
    room.players.set(clientId, { id: clientId, nickname: client.nickname, host: true })

    this.onEvent(`create ${room.id} "${name}" (${game}, max ${maxPlayers}) da ${client.nickname}`)
    this._broadcastLobby()

    return {
      type: 'room_joined',
      room: this._detail(room),
      you: { id: clientId, nickname: client.nickname, host: true },
    }
  }

  joinRoom(clientId, roomId) {
    const client = this.clients.get(clientId)
    if (!client) {
      return { type: 'error', message: 'Sessione non valida.' }
    }
    if (client.roomId === roomId) {
      const current = this.rooms.get(roomId)
      if (current) {
        // Risincronizzazione: restituisci lo stato attuale senza duplicare il giocatore
        const player = current.players.get(clientId)
        return {
          type: 'room_joined',
          room: this._detail(current),
          you: { id: clientId, nickname: player ? player.nickname : client.nickname, host: player ? player.host : false },
        }
      }
      client.roomId = null
    }
    if (client.roomId) {
      return { type: 'error', message: 'Sei già in una stanza.' }
    }
    if (!client.nickname) {
      return { type: 'error', message: 'Scegli prima un nickname.' }
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      return { type: 'error', message: 'Stanza non trovata.' }
    }
    if (room.players.size >= room.maxPlayers) {
      return { type: 'error', message: 'Stanza piena.' }
    }

    const nickname = this._uniqueNickname(room, client.nickname)
    client.roomId = room.id
    room.players.set(clientId, { id: clientId, nickname, host: false })

    this._sendRoom(room, { type: 'room_update', room: this._detail(room) })
    this._broadcastLobby()
    this.onEvent(`join ${room.id} ${nickname}`)

    return {
      type: 'room_joined',
      room: this._detail(room),
      you: { id: clientId, nickname, host: false },
    }
  }

  leaveRoom(clientId) {
    const client = this.clients.get(clientId)
    const roomId = client ? client.roomId : null
    const left = client ? this._leaveRoom(clientId) : false
    this.onEvent(left ? `leave ${roomId} ${clientId}` : `leave_attempt senza stanza ${clientId}`)
    return { type: 'room_left' }
  }

  chat(clientId, text) {
    const client = this.clients.get(clientId)
    if (!client || !client.roomId) {
      return { type: 'error', message: 'Devi essere in una stanza per inviare messaggi.' }
    }
    const room = this.rooms.get(client.roomId)
    if (!room) {
      client.roomId = null
      return { type: 'error', message: 'La stanza non esiste più.' }
    }
    const player = room.players.get(clientId)
    const from = player ? player.nickname : client.nickname
    const msg = { type: 'chat', from, text, ts: Date.now() }
    this._sendRoom(room, msg)
    this.onEvent(`chat ${room.id} ${from}: ${text.slice(0, 40)}`)
    return null
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId)
    if (!client) return
    this._leaveRoom(clientId)
    this.clients.delete(clientId)
    this.onEvent(`disconnect ${clientId}`)
  }

  newClient(ws) {
    const id = randomUUID()
    this.clients.set(id, { id, nickname: null, roomId: null, ws })
    return id
  }
}