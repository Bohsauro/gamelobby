import { Link } from 'react-router-dom'
import { CATEGORIES, TOTAL_GAMES } from '../data/games'
import { CategoryGlyph, IconZap } from '../components/icons'

const STATS = [
  { num: `${TOTAL_GAMES}`, label: 'giochi previsti' },
  { num: '8', label: 'stanze massimo' },
  { num: '8', label: 'giocatori per stanza' },
  { num: '0', label: 'iscrizioni' },
]

const STEPS = [
  {
    num: '01',
    title: 'Crea o entra in una stanza',
    text: 'Scegli un nickname, apri una stanza nella lobby e condividi il codice con gli amici.',
  },
  {
    num: '02',
    title: 'Condividi il codice',
    text: 'Ogni stanza ha un codice di 6 caratteri: invialo e i tuoi amici entrano in un tocco.',
  },
  {
    num: '03',
    title: 'Gioca insieme (presto)',
    text: 'La stanza funziona già con chat e posti live. I giochi stanno arrivando, promesso.',
  },
]

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1>
            Giochi online per <span className="accent">pochi amici.</span>
          </h1>
          <p className="hero__lede">
            Stanze private, partite live e un posto dove ridere insieme — senza iscriversi a
            niente.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/lobby">
              Entra nella lobby
            </Link>
            <a className="btn btn--ghost" href="#sezioni">
              Sfoglia i giochi
            </a>
          </div>

          <div className="hero__stats">
            {STATS.map((stat) => (
              <div className="stat" key={stat.label}>
                <span className="stat__num">{stat.num}</span>
                <span className="stat__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="sezioni">
        <div className="container">
          <div className="section-head">
            <h2>Scegli il tuo tavolo</h2>
            <p className="section-head__lede">
              Quattro stanze, ventiquattro giochi in arrivo. Ogni categoria ha il suo colore:
              scegli quella che ti somiglia di più.
            </p>
          </div>

          <div className="grid grid--compact">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={`/${category.slug}`}
                className="card cat-card"
                style={{ ['--cat-accent' as string]: category.accent }}
              >
                <span className="cat-card__icon">
                  <CategoryGlyph slug={category.slug} size={40} />
                </span>
                <span className="cat-card__title">{category.name}</span>
                <span className="cat-card__meta">
                  {category.games.length} giochi in arrivo
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Come funziona</h2>
            <p className="section-head__lede">
              Da zero a partita in tre passi. Nessun account, nessuna installazione.
            </p>
          </div>

          <div className="grid">
            {STEPS.map((step) => (
              <article className="card step-card" key={step.num}>
                <span className="step-card__num">
                  <IconZap size={14} /> Step {step.num}
                </span>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__text">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}