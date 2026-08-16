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
import { Passaporte } from './pages/Passaporte'
import { Painel } from './pages/Painel'
import { Cozinha } from './pages/Cozinha'
import { Central } from './pages/Central'
import { Inscritos } from './pages/Inscritos'
import { InscricoesFechadas } from './components/InscricoesFechadas'
import { INSCRICOES_ABERTAS } from './lib/contact'

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
      {/* Com as inscricoes fechadas, os 2 formularios viram tela de aviso.
          Reabrir = INSCRICOES_ABERTAS true em lib/contact.ts */}
      <Route path="/reservar" element={INSCRICOES_ABERTAS ? <Reservar /> : <InscricoesFechadas />} />
      <Route path="/grupo" element={INSCRICOES_ABERTAS ? <Grupo /> : <InscricoesFechadas />} />
      <Route path="/passaporte" element={<Passaporte />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/cozinha" element={<Cozinha />} />
      <Route path="/central" element={<Central />} />
      <Route path="/inscritos" element={<Inscritos />} />
      <Route path="/admin/tardezinha-stats" element={<AdminStats />} />
    </Routes>
  )
}

export default App
