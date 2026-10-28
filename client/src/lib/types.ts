export type CategorySlug = 'carte' | '3d' | 'tavolo' | 'party'

export type RoomStatus = 'waiting' | 'playing'

export interface RoomSummary {
  id: string
  name: string
  game: CategorySlug
  maxPlayers: number
  players: number
  status: RoomStatus
}

export interface RoomPlayer {
  id: string
  nickname: string
  host: boolean
}

export interface RoomDetail extends Omit<RoomSummary, 'players'> {
  players: RoomPlayer[]
  createdAt: number
}

export interface ChatMessage {
  from: string
  text: string
  ts: number
}

export type ClientMessage =
  | { type: 'join_lobby'; nickname: string }
  | { type: 'create_room'; name: string; game: CategorySlug; maxPlayers: number }
  | { type: 'join_room'; roomId: string }
  | { type: 'leave_room' }
  | { type: 'chat'; text: string }
  | { type: 'ping' }

export type ServerMessage =
  | { type: 'hello'; you: { id: string; nickname: string }; rooms: RoomSummary[] }
  | { type: 'lobby_update'; rooms: RoomSummary[] }
  | { type: 'room_joined'; room: RoomDetail; you: { id: string; nickname: string; host: boolean } }
  | { type: 'room_update'; room: RoomDetail }
  | { type: 'room_left' }
  | { type: 'chat'; from: string; text: string; ts: number }
  | { type: 'error'; message: string }
  | { type: 'pong' }