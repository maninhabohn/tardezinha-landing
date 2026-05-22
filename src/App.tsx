import { Hero } from './components/Hero'
import { Atracoes } from './components/Atracoes'
import { ParaResponsaveis } from './components/ParaResponsaveis'
import { Ingressos } from './components/Ingressos'
import { Galeria } from './components/Galeria'
import { Local } from './components/Local'
import { Compartilhar } from './components/Compartilhar'
import { Footer } from './components/Footer'
import { WhatsappFloat } from './components/WhatsappFloat'
import { Reveal } from './components/Reveal'

function App() {
  return (
    <>
      {/* Hero entra sem animacao — primeira coisa que aparece */}
      <Hero />

      {/* Demais secoes com fade-in ao scrollar */}
      <Reveal>
        <Atracoes />
      </Reveal>
      <Reveal>
        <ParaResponsaveis />
      </Reveal>
      <Reveal>
        <Ingressos />
      </Reveal>
      <Reveal>
        <Galeria />
      </Reveal>
      <Reveal>
        <Local />
      </Reveal>
      <Reveal>
        <Compartilhar />
      </Reveal>

      <Footer />
      <WhatsappFloat />
    </>
  )
}

export default App
