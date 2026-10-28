import type { GameInfo } from '../data/games'
import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

export function GameCard({
  game,
  accent,
  badgeTone,
}: {
  game: GameInfo
  accent: string
  badgeTone: BadgeTone
}) {
  return (
    <article
      className="card game-card"
      style={{ ['--cat-accent' as string]: accent }}
    >
      <header className="game-card__head">
        <h3 className="game-card__title">{game.name}</h3>
        <Badge tone={badgeTone}>In arrivo</Badge>
      </header>
      <p className="game-card__desc">{game.description}</p>
      <p className="game-card__meta">{game.players}</p>
      <button className="btn btn--ghost btn--block game-card__cta" type="button" disabled>
        Presto disponibile
      </button>
    </article>
  )
}