import { Outlet } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}