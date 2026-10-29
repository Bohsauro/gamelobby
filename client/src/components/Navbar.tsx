import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { IconBrand } from './icons'

const NAV_LINKS = [
  { to: '/carte', label: 'Carte' },
  { to: '/3d', label: '3D' },
  { to: '/tavolo', label: 'Da tavolo' },
  { to: '/party', label: 'Party' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="brand" aria-label="GameLobby — home">
          <IconBrand className="brand__logo" />
          GameLobby
        </NavLink>

        <nav aria-label="Navigazione principale">
          <button
            className="navbar__toggle"
            type="button"
            aria-expanded={open}
            aria-controls="navbar-menu"
            aria-label={open ? 'Chiudi menu' : 'Apri menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>

          <ul
            className={`navbar__links${open ? ' navbar__links--open' : ''}`}
            id="navbar-menu"
            onClick={() => setOpen(false)}
          >
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
              >
                Home
              </NavLink>
            </li>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/lobby" className="btn btn--primary btn--sm navbar__cta">
                Lobby
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}