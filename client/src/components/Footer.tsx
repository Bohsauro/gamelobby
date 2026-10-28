import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/games'
import { IconBrand } from './icons'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="brand" aria-label="GameLobby — home">
            <IconBrand className="brand__logo" />
            GameLobby
          </Link>
          <p className="footer__desc">
            Giochi online per pochi amici: stanze private, partite live e nessuna iscrizione.
            Tutti i giochi arrivano presto.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="footer__links">
            <li>
              <Link className="footer__link" to="/lobby">
                Lobby
              </Link>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link className="footer__link" to={`/${category.slug}`}>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="footer__bottom">© {new Date().getFullYear()} GameLobby — nessuna iscrizione, solo amici.</p>
      </div>
    </footer>
  )
}