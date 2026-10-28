import type { RoomSummary } from '../lib/types'
import { findCategory } from '../data/games'
import { Badge } from './Badge'
import { CategoryGlyph } from './icons'

export function RoomCard({
  room,
  onJoin,
  disabled,
}: {
  room: RoomSummary
  onJoin: () => void
  disabled?: boolean
}) {
  const category = findCategory(room.game)
  const full = room.players >= room.maxPlayers

  return (
    <article
      className="card room-card"
      style={{ ['--cat-accent' as string]: category?.accent ?? 'var(--faint)' }}
    >
      <header className="room-card__head">
        <span className="room-card__icon">
          <CategoryGlyph slug={room.game} size={30} />
        </span>
        <h3 className="room-card__name" title={room.name}>
          {room.name}
        </h3>
      </header>

      <div className="room-card__meta">
        <span>
          Giocatori <b>
            {room.players}/{room.maxPlayers}
          </b>
        </span>
        <span>
          <Badge tone={room.status === 'playing' ? 'ok' : 'warn'}>
            {room.status === 'playing' ? 'In gioco' : 'In attesa'}
          </Badge>
        </span>
      </div>

      <footer className="room-card__footer">
        <span className="room-card__meta">
          <b>{room.id}</b>
        </span>
        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={onJoin}
          disabled={disabled || full}
          title={full ? 'Stanza piena' : 'Entra nella stanza'}
        >
          {full ? 'Piena' : 'Entra'}
        </button>
      </footer>
    </article>
  )
}