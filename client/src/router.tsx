import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { EmptyState } from './components/EmptyState'
import { IconHome } from './components/icons'
import { GamesSection } from './pages/GamesSection'
import { Home } from './pages/Home'
import { Lobby } from './pages/Lobby'
import { Room } from './pages/Room'

function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <EmptyState
          icon={<IconHome size={40} />}
          title="Pagina non trovata"
          text="Quello che cerchi non sta qui. Torna alla home e ricomincia da una partita."
          actionLabel="Torna alla home"
          action={() => window.history.back()}
        />
      </div>
    </section>
  )
}

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/lobby', element: <Lobby /> },
      { path: '/stanza/:roomId', element: <Room /> },
      { path: '/:slug', element: <GamesSection /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])