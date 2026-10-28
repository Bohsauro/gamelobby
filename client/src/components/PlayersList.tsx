import type { RoomPlayer } from '../lib/types'
import { Badge } from './Badge'

export function PlayersList({
  players,
  maxPlayers,
  youId,
}: {
  players: RoomPlayer[]
  maxPlayers: number
  youId: string | null
}) {
  return (
    <section className="panel">
      <div className="panel__head" style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'center' }}>
        <h2 className="panel__title">Giocatori</h2>
        <span className="player-counter" aria-label="giocatori in stanza">
          <b>
            {players.length}/{maxPlayers}
          </b>{' '}
          in stanza
        </span>
      </div>
      <ul className="players-list">
        {players.map((player) => {
          const isYou = player.id === youId
          return (
            <li key={player.id} className={`player-row${isYou ? ' player-row--you' : ''}`}>
              <span className={`player-row__dot${isYou ? ' player-row__dot--you' : ''}`} aria-hidden="true" />
              <span className="player-row__name">{player.nickname}</span>
              {player.host && <span className="player-row__host">Host</span>}
              {isYou && <Badge tone="info">Tu</Badge>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}