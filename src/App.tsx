import { Routes, Route } from 'react-router-dom'
import { DateBanner } from './components/DateBanner'
import { Hero } from './components/Hero'
import { Atracoes } from './components/Atracoes'
import { ParaResponsaveis } from './components/ParaResponsaveis'
import { Ingressos } from './components/Ingressos'
import { Galeria } from './components/Galeria'
import { Local } from './components/Local'
import { Faq } from './components/Faq'
import { Compartilhar } from './components/Compartilhar'
import { Footer } from './components/Footer'
import { WhatsappFloat } from './components/WhatsappFloat'
import { Reveal } from './components/Reveal'
import { Reservar } from './pages/Reservar'
import { AdminStats } from './pages/AdminStats'
import { Grupo } from './pages/Grupo'

function Home() {
  return (
    <>
      <DateBanner />
      <Hero />
      <Reveal><Atracoes /></Reveal>
      <Reveal><ParaResponsaveis /></Reveal>
      <Reveal><Ingressos /></Reveal>
      <Reveal><Galeria /></Reveal>
      <Reveal><Local /></Reveal>
      <Reveal><Faq /></Reveal>
      <Reveal><Compartilhar /></Reveal>
      <Footer />
      <WhatsappFloat />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reservar" element={<Reservar />} />
      <Route path="/grupo" element={<Grupo />} />
      <Route path="/admin/tardezinha-stats" element={<AdminStats />} />
    </Routes>
  )
}

export default App
