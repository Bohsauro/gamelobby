import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { RoomCard } from '../components/RoomCard'
import { StatusBanner } from '../components/StatusBanner'
import { ChipsWallet } from '../components/ChipsWallet'
import { IconUsers } from '../components/icons'
import { CATEGORIES } from '../data/games'
import { useWebSocket } from '../hooks/useWebSocket'
import { useLocalStorage } from '../lib/storage'
import type { CategorySlug, RoomSummary } from '../lib/types'

const STORAGE_NICKNAME = 'gamelobby.nickname'
const MAX_PLAYERS_CHOICES = [2, 4, 6, 8]
const NICKNAME_MAX = 16
const ROOM_NAME_MAX = 40

export function Lobby() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [nickname, setNickname] = useLocalStorage<string>(STORAGE_NICKNAME, '')
  const { status, send, subscribe } = useWebSocket(nickname)

  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [nicknameDraft, setNicknameDraft] = useState(nickname)
  const [roomName, setRoomName] = useState('')
  const [game, setGame] = useState<CategorySlug>('carte')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [busy, setBusy] = useState(false)

  const pendingRef = useRef(false)

  // Sincronizza il draft del nickname quando arriva da localStorage
  useEffect(() => {
    setNicknameDraft(nickname)
  }, [nickname])

  useEffect(() => {
    const offRooms = subscribe('lobby_update', (message) => setRooms(message.rooms))
    const offHello = subscribe('hello', (message) => setRooms(message.rooms))
    return () => {
      offRooms()
      offHello()
    }
  }, [subscribe])

  useEffect(() => {
    const off = subscribe('room_joined', (message) => {
      if (pendingRef.current) {
        pendingRef.current = false
        setBusy(false)
        navigate(`/stanza/${message.room.id}`)
      }
    })
    return off
  }, [subscribe, navigate])

  useEffect(() => {
    const off = subscribe('error', (message) => {
      if (pendingRef.current) {
        pendingRef.current = false
        setBusy(false)
      }
      setError(message.message)
    })
    return off
  }, [subscribe])

  // Flusso "Crea una stanza di prova" dalla sezione giochi
  useEffect(() => {
    const create = searchParams.get('create')
    if (create && CATEGORIES.some((c) => c.slug === create) && status === 'open') {
      setSearchParams({}, { replace: true })
      const requested = create as CategorySlug
      const suggestedName = `Sala ${CATEGORIES.find((c) => c.slug === requested)?.name ?? ''}`
      if (nickname.trim()) {
        setGame(requested)
        setRoomName(suggestedName)
        pendingRef.current = true
        setBusy(true)
        send({ type: 'create_room', name: suggestedName, game: requested, maxPlayers: 4 })
      } else {
        setGame(requested)
        setRoomName(suggestedName)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status, nickname])

  const connected = status === 'open'

  const saveNickname = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = nicknameDraft.trim().slice(0, NICKNAME_MAX)
    if (!value) return
    setError(null)
    setNickname(value)
  }

  const joinRoom = (roomId: string) => {
    if (!connected || busy) return
    setError(null)
    pendingRef.current = true
    setBusy(true)
    send({ type: 'join_room', roomId })
  }

  const createRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = roomName.trim().slice(0, ROOM_NAME_MAX)
    if (!name || !connected || busy) return
    setError(null)
    pendingRef.current = true
    setBusy(true)
    send({ type: 'create_room', name, game, maxPlayers })
  }

  return (
    <section className="section">
      <div className="container">
        <div className="lobby-toolbar">
          <div>
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>Lobby</h1>
          </div>
          <div className="lobby-toolbar__right">
            <StatusBanner status={status} />
            {nickname.trim() !== '' && (
              <ChipsWallet nickname={nickname} send={send} subscribe={subscribe} />
            )}
          </div>
        </div>

        <form className="nickname-form" onSubmit={saveNickname} aria-label="Scegli il tuo nickname">
          <label className="field__label" htmlFor="nickname-input">
            Nickname
          </label>
          <input
            id="nickname-input"
            className="input"
            type="text"
            placeholder="Come ti chiamano gli amici?"
            value={nicknameDraft}
            maxLength={NICKNAME_MAX}
            onChange={(event) => setNicknameDraft(event.target.value)}
            autoComplete="nickname"
          />
          <button className="btn btn--ghost" type="submit" disabled={!nicknameDraft.trim()}>
            Salva nickname
          </button>
        </form>

        {error && (
          <p className="form-error" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        {!connected && nickname.trim() === '' && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <EmptyState
              icon={<IconUsers size={40} />}
              title="Scegli un nickname per iniziare"
              text="Dalla lobby vedi le stanze aperte, ne crei di nuove e tieni d’occhio chi c’è. Ti basta un nome."
            />
          </div>
        )}

        {nickname.trim() !== '' && (
          <div className="lobby-grid" style={{ marginTop: 'var(--space-6)' }}>
            <div className="lobby-grid__rooms">
              <h2 style={{ fontSize: 'var(--fs-lg)' }}>Stanze aperte</h2>

              {!connected ? (
                <EmptyState
                  icon={<IconUsers size={40} />}
                  title="Stiamo riconnettendo…"
                  text="La connessione al server è in corso. Appena siamo online, tornano anche le stanze."
                />
              ) : rooms.length === 0 ? (
                <EmptyState
                  icon={<IconUsers size={40} />}
                  title="Nessuna stanza aperta"
                  text="Sii tu il primo: crea una stanza, scegli la categoria e invita gli amici con il codice."
                />
              ) : (
                <ul className="lobby-grid__rooms">
                  {rooms.map((room) => (
                    <li key={room.id}>
                      <RoomCard room={room} onJoin={() => joinRoom(room.id)} disabled={busy} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="card create-form" onSubmit={createRoom} aria-label="Crea una nuova stanza">
              <h2 className="create-form__title">Nuova stanza</h2>

              <div className="field">
                <label className="field__label" htmlFor="room-name">
                  Nome della stanza
                </label>
                <input
                  id="room-name"
                  className="input"
                  type="text"
                  placeholder="es. Partita serale"
                  value={roomName}
                  maxLength={ROOM_NAME_MAX}
                  onChange={(event) => setRoomName(event.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="room-game">
                  Gioco
                </label>
                <select
                  id="room-game"
                  className="select"
                  value={game}
                  onChange={(event) => setGame(event.target.value as CategorySlug)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="room-max">
                  Massimo giocatori
                </label>
                <select
                  id="room-max"
                  className="select"
                  value={maxPlayers}
                  onChange={(event) => setMaxPlayers(Number(event.target.value))}
                >
                  {MAX_PLAYERS_CHOICES.map((value) => (
                    <option key={value} value={value}>
                      {value} giocatori
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn--primary btn--block"
                type="submit"
                disabled={!connected || !roomName.trim() || busy}
              >
                {busy ? 'Azione in corso…' : 'Crea e unisciti'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}