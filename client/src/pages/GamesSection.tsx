import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { GameCard } from '../components/GameCard'
import { StatusBanner } from '../components/StatusBanner'
import { CategoryGlyph, IconHome } from '../components/icons'
import { findCategory } from '../data/games'
import { useWebSocket } from '../hooks/useWebSocket'
import { useLocalStorage } from '../lib/storage'
import type { BadgeTone } from '../components/Badge'

const BADGE_TONE: Record<string, BadgeTone> = {
  carte: 'accent',
  '3d': 'info',
  tavolo: 'ok',
  party: 'warn',
}

const STORAGE_NICKNAME = 'gamelobby.nickname'

export function GamesSection() {
  const { slug = '' } = useParams<'slug'>()
  const navigate = useNavigate()
  const category = findCategory(slug)

  const [nickname] = useLocalStorage<string>(STORAGE_NICKNAME, '')
  const { status, send, subscribe } = useWebSocket(nickname)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const creatingRef = useRef(false)

  useEffect(() => {
    const off = subscribe('room_joined', (message) => {
      if (creatingRef.current) {
        creatingRef.current = false
        setCreating(false)
        navigate(`/stanza/${message.room.id}`)
      }
    })
    return off
  }, [subscribe, navigate])

  useEffect(() => {
    const off = subscribe('error', (message) => {
      if (creatingRef.current) {
        creatingRef.current = false
        setCreating(false)
      }
      setError(message.message)
    })
    return off
  }, [subscribe])

  if (!category) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            icon={<IconHome size={40} />}
            title="Sezione non trovata"
            text="Questa sezione non esiste. Torna alla home e scegli un tavolo dal catalogo."
            actionLabel="Torna alla home"
            action={() => navigate('/')}
          />
        </div>
      </section>
    )
  }

  const handleCreate = () => {
    setError(null)
    if (!nickname.trim()) {
      navigate(`/lobby?create=${category.slug}`)
      return
    }
    if (status !== 'open' || creating) return
    creatingRef.current = true
    setCreating(true)
    send({
      type: 'create_room',
      name: `Sala ${category.name}`,
      game: category.slug,
      maxPlayers: 4,
    })
  }

  return (
    <section className="section">
      <div className="container">
        <div className="room-head" style={{ marginBottom: 'clamp(2rem,4vw,2.75rem)' }}>
          <div className="room-head__top">
            <div className="room-head__title" style={{ ['--cat-accent' as string]: category.accent }}>
              <span className="room-head__icon">
                <CategoryGlyph slug={category.slug} size={30} />
              </span>
              {category.name}
            </div>
            <StatusBanner status={status} />
          </div>
          <p className="section-head__lede" style={{ marginTop: 0 }}>
            {category.tagline}
          </p>
          <div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleCreate}
              disabled={status !== 'open' || creating}
            >
              {creating ? 'Creando…' : 'Crea una stanza di prova'}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="grid">
          {category.games.map((game) => (
            <GameCard
              key={game.name}
              game={game}
              accent={category.accent}
              badgeTone={BADGE_TONE[category.slug] ?? 'accent'}
            />
          ))}
        </div>
      </div>
    </section>
  )
}