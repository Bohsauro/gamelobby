import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatBox } from '../components/ChatBox'
import { EmptyState } from '../components/EmptyState'
import { PlayersList } from '../components/PlayersList'
import { StatusBanner } from '../components/StatusBanner'
import { Badge } from '../components/Badge'
import { ChipsWallet } from '../components/ChipsWallet'
import { CategoryGlyph, IconHome } from '../components/icons'
import { findCategory } from '../data/games'
import { useWebSocket } from '../hooks/useWebSocket'
import { useLocalStorage } from '../lib/storage'
import type { ChatMessage, RoomDetail } from '../lib/types'

const STORAGE_NICKNAME = 'gamelobby.nickname'

export function Room() {
  const { roomId = '' } = useParams<'roomId'>()
  const navigate = useNavigate()
  const normalizedRoomId = roomId.trim().toUpperCase()

  const [nickname] = useLocalStorage<string>(STORAGE_NICKNAME, '')
  const { status, send, subscribe } = useWebSocket(nickname)

  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [youId, setYouId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [appName, setAppName] = useState('')

  const joinedRoomRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'open') {
      if (joinedRoomRef.current !== normalizedRoomId) {
        joinedRoomRef.current = normalizedRoomId
        send({ type: 'join_room', roomId: normalizedRoomId })
      }
    } else {
      joinedRoomRef.current = null
    }
  }, [status, normalizedRoomId, send])

  useEffect(() => {
    const off = subscribe('room_joined', (message) => {
      setRoom(message.room)
      setYouId(message.you.id)
      setAppName(message.you.nickname)
      setNotFound(false)
      setError(null)
    })
    return off
  }, [subscribe])

  useEffect(() => {
    const off = subscribe('room_update', (message) => setRoom(message.room))
    return off
  }, [subscribe])

  useEffect(() => {
    const off = subscribe('chat', (message) => {
      setMessages((prev) => [...prev, { from: message.from, text: message.text, ts: message.ts }])
    })
    return off
  }, [subscribe])

  useEffect(() => {
    const off = subscribe('room_left', () => navigate('/lobby'))
    return off
  }, [subscribe, navigate])

  useEffect(() => {
    const off = subscribe('error', (message) => {
      setError(message.message)
      if (!room && /stanza non (trovata|esiste)|non trovata|codice stanza non valido/i.test(message.message)) {
        setNotFound(true)
      }
    })
    return off
  }, [subscribe, room])

  useEffect(() => {
    if (!error || notFound) return
    const timer = window.setTimeout(() => setError(null), 6000)
    return () => window.clearTimeout(timer)
  }, [error, notFound])

  const leaveRoom = () => {
    if (status === 'open') send({ type: 'leave_room' })
    navigate('/lobby')
  }

  const copyCode = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(room.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Impossibile copiare il codice. Copialo a mano: ' + room.id)
    }
  }

  if (!nickname.trim()) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            icon={<IconHome size={40} />}
            title="Serve un nickname"
            text="Per entrare in una stanza scegli prima un nickname dalla lobby."
            actionLabel="Vai alla lobby"
            action={() => navigate('/lobby')}
          />
        </div>
      </section>
    )
  }

  if (notFound || !room) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            icon={<IconHome size={40} />}
            title={notFound ? 'Stanza non trovata' : 'Apertura stanza…'}
            text={
              notFound
                ? `La stanza con codice ${normalizedRoomId} non esiste (più). Potrebbe essere stata chiusa: quando l’ultimo giocatore esce, la stanza scompare.`
                : 'Stiamo verificando il codice della stanza. Un momento…'
            }
            actionLabel={notFound ? 'Vai alla lobby' : undefined}
            action={notFound ? () => navigate('/lobby') : undefined}
          >
            {error && (
              <p className="form-error" role="alert" style={{ maxWidth: '52ch' }}>
                {error}
              </p>
            )}
          </EmptyState>
        </div>
      </section>
    )
  }

  if (error && !notFound) {
    window.setTimeout(() => setError(null), 6000)
  }

  const category = findCategory(room.game)

  return (
    <section className="section">
      <div className="container">
        <header className="room-head">
          <div className="room-head__top">
            <div className="room-head__title" style={{ ['--cat-accent' as string]: category?.accent }}>
              <span className="room-head__icon">
                <CategoryGlyph slug={room.game} size={30} />
              </span>
              {room.name}
            </div>
            <div className="room-head__meta">
              <StatusBanner status={status} />
              <ChipsWallet nickname={nickname} send={send} subscribe={subscribe} />
              <button className="code-chip" type="button" onClick={copyCode} title="Copia il codice della stanza">
                <span aria-hidden="true">#</span>
                {room.id}
                <Badge tone={copied ? 'ok' : 'info'}>{copied ? 'Copiato' : 'Copia codice'}</Badge>
              </button>
            </div>
          </div>

          <div className="room-head__meta" style={{ color: 'var(--faint)' }}>
            <Badge tone={room.status === 'playing' ? 'ok' : 'warn'}>
              {room.status === 'playing' ? 'In gioco' : 'In attesa'}
            </Badge>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {category?.name ?? room.game}
            </span>
          </div>
        </header>

        {error && (
          <p className="form-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <div className="room-layout">
          <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <PlayersList players={room.players} maxPlayers={room.maxPlayers} youId={youId} />

            <section className="card soon-card" style={{ ['--cat-accent' as string]: category?.accent }}>
              <span className="soon-card__icon">
                <CategoryGlyph slug={room.game} size={34} />
              </span>
              <h2 className="panel__title">Presto disponibile</h2>
              <p className="soon-card__text">
                Il gioco {category?.name ?? 'scelto'} arriverà presto. La stanza funziona già:
                invita i tuoi!
              </p>
            </section>
          </div>

          <ChatBox
            messages={messages}
            ownNickname={appName}
            onSend={(text) => send({ type: 'chat', text })}
            disabled={status !== 'open'}
          />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <button className="btn btn--ghost room-leave" type="button" onClick={leaveRoom}>
            Esci dalla stanza
          </button>
        </div>
      </div>
    </section>
  )
}