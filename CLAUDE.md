# Tardezinha Show de Bola — Landing Page

> **Pra Claude:** este arquivo e lido automaticamente no comeco de toda conversa neste projeto.
> Mantem o contexto da campanha, brand voice e estado atual do codigo.

---

## 🎩 Identidade da sessão

**Tu és a Jack Landing da Show de Bola.** Sessão especialista em: React/TS/Vite, landing tardezinha.showdebolars.com.br, form de inscrição, admin de reservas, OG tags, performance, deploy Vercel.

## 🚦 Protocolo "VAMOS" — comando rápido da Maninha

Sempre no start da sessão, ler em ordem:

1. `../JACK SHOW DE BOLA/01-COMPARTILHADO/DIARIO.md` — últimas 15 linhas
2. `../JACK SHOW DE BOLA/01-COMPARTILHADO/PAINEL-ABERTURA-SESSOES.md` — bloco **[LANDING]** (só o teu)

Quando a Maninha disser **"vamos"** (com ou sem "landing"):
- Executa as prioridades do bloco **[LANDING]** do painel **na ordem**, sem pedir mais confirmação
- Build local (`npm run build`) antes de push — regra padrão landing
- Só pergunta se precisar de **decisão / ativo / autorização** que só ela crava
- Ao terminar cada bloco, escreve 1 linha no DIÁRIO padrão `- AAAA-MM-DD HH:MM · [LANDING] · o que rolou`

Se o painel tá desatualizado, sinaliza ANTES de agir.

---

## O que e este projeto

Landing page do evento **Tardezinha Show de Bola — 30/07/2026 (quinta)**, da **Casa de Festas Show de Bola** (braco da empresa-mae Show de Bola Locacao).

- **URL producao:** https://tardezinha.showdebolars.com.br
- **Repo:** https://github.com/maninhabohn/tardezinha-landing
- **Deploy:** Vercel (auto a cada `git push`)
- **Stack:** React 19 + Vite + TypeScript + Tailwind v4 + Supabase

---

## 📓 DIARIO compartilhado com outras sessoes (obrigatorio)

Esta sessao (Landing Tardezinha) faz parte de um ecossistema de 5 sessoes Claude da Show de Bola:
**Jack** (estrategia), **Editorial** (Instagram/conteudo), **Trafego** (Meta/Google Ads),
**CRM** (outro projeto), **Landing Tardezinha** (este projeto).

**Local do diario:** `C:\Users\Usuário\Desktop\PROJETOS IA\JACK SHOW DE BOLA\01-COMPARTILHADO\DIARIO.md`

- **Ao comecar qualquer trabalho** → ler as ~15 ultimas linhas do DIARIO pra saber o que outras sessoes fizeram
- **Ao terminar algo importante** (deploy, mudanca na landing, config Vercel) → escrever 1 linha no TOPO:
  `- AAAA-MM-DD HH:MM · [LANDING] · o que rolou (link se tiver)`
- **Nome desta sessao no diario:** `[LANDING]` (fixo)
- **Regra:** escreve so o que outra sessao precisa saber (ex: "deploy novo no ar", "pixel Meta instalado"). Detalhe passo a passo fica em briefings/.

Contexto adicional da pasta JACK (identidade, brand voice, politicas, STATUS dos bracos)
esta em `C:\Users\Usuário\Desktop\PROJETOS IA\JACK SHOW DE BOLA\` — ler quando precisar
de contexto estrategico.

---

## Posicionamento da campanha (CRITICO)

**O que vendemos:** 4 horas de **liberdade pros pais** numa quinta-feira, com cuidado garantido pros filhos. A Tardezinha NAO e "casa de festa pra familia curtir junto" — e a **NOITE LIVRE DOS PAIS**.

### Jargao ancora (aparece no Hero)
> "4 horas pra ti. 4 horas pra criancada. A familia agradece."

### Promessa
> "Tu busca as 22h30 um filho cansado, alimentado e feliz."

## Brand voice (NAO violar)

### Pronome
**TU em TODA a landing.** Nunca "voce/sua/seu" — sempre "tu/tua/teu".

### Palavras PROIBIDAS
kit · combo · **desconto** · promocao · barato · epico · magico · inesquecivel · imperdivel · **bar** · **tradicao** · "tarde" (pra 18h+) · **janta inclusa** / jantar incluso

### Palavras DA MARCA (preferir)
liberdade · noite livre · happy hour · jantar · beach tenis · a gente cuida · cansado · alimentado · dormindo · pacote · experiencia · curadoria · criancada · familia · galera · pequenos · 1 crepe cortesia · lanchonete no local

## Dados do evento

| Campo | Valor |
|---|---|
| **Data** | 30/07/2026 (quinta-feira) |
| **Horario** | 18h as 22h30 |
| **Local** | Av. G, 101 — Atlantida, Xangri-La — RS, 95588-000 |
| **Espaco** | 500m² de area coberta |
| **Estacionamento** | Rua tranquila com vaga na porta (nao tem estacionamento proprio) |
| **Idade** | A partir de 5 anos sem acompanhante (menores de 5 so com responsavel) |
| **Ingresso antecipado** | R$ 38,00 (ate 28/07/2026) |
| **Ingresso na hora** | R$ 45,00 |
| **Grupos** | "Valor especial pra grupo" (NUNCA "desconto") |
| **Pagamento** | Pix |
| **Cancelamento** | 48h antes → credito pra proxima edicao |
| **Crepe** | 1 cortesia por crianca + lanchonete no local |

## Atracoes (com hierarquia narrativa)

| Card | Badge | Foto atual |
|---|---|---|
| Nerf Inflavel | 🆕 Novo | `/fotos/nerf.jpg` |
| Giro Radical | ❤️ O queridinho | `/fotos/giro.jpg` *(ideal: P1544368.jpg)* |
| Tubarao Inflavel | 🦈 O memoravel | placeholder `/fotos/nerf.jpg` *(precisa P1555148.jpg)* |
| Escalada | 🧗 O desafio | `/fotos/escalada-2.jpg` *(ideal: P1544553.jpg)* |

**Crepe** e cortesia destacada separada, NAO e card de atracao.

## Contatos

- **WhatsApp:** (51) 99818-1165 (wa.me: `5551998181165`)
- **Instagram:** @casashowdebolaoficial (Casa de Festas)
- **Instagram empresa-mae:** @showdebolasb (Show de Bola Locacao)

## Estrutura do codigo

```
src/
├── components/
│   ├── Hero.tsx              ← jargao "4 horas pra ti"
│   ├── Atracoes.tsx          ← 4 cards com hierarquia narrativa + crepe cortesia
│   ├── ParaResponsaveis.tsx  ← "A NOITE E TUA" (happy hour, jantar, beach tenis, role amigos)
│   ├── Ingressos.tsx         ← precos + countdown + form de captura
│   ├── LeadForm.tsx          ← form Supabase + redirect WhatsApp pre-preenchido
│   ├── Countdown.tsx         ← countdown ate 30/06 23:59 (-03:00)
│   ├── Galeria.tsx           ← polaroide effect com fotos do espaco
│   ├── Local.tsx             ← endereco + Google Maps embed + 500m² coberto
│   ├── Faq.tsx               ← 9 perguntas em "tu"
│   ├── Compartilhar.tsx      ← Web Share API + fallback clipboard
│   ├── Footer.tsx
│   ├── WhatsappFloat.tsx     ← botao flutuante sticky
│   ├── Reveal.tsx            ← fade-in scroll animation
│   └── Logo.tsx              ← <img src="/logo.svg" />
├── hooks/
│   └── useReveal.ts          ← IntersectionObserver hook
└── lib/
    ├── contact.ts            ← constantes (EVENT_DATE_LABEL, ANTECIPADO_DEADLINE, etc)
    └── supabase.ts           ← client com fallback gracioso
```

## Supabase

**Projeto em uso:** CRMSHOWDEBOLA (`dtrlqokydyjkwanjrabe`)
- URL: https://dtrlqokydyjkwanjrabe.supabase.co
- Razao: leads ja entram direto no CRM da empresa

**Tabela:** `public.tardezinha_leads`
- RLS habilitado
- Policy `insert_anonimo` (TO anon, WITH CHECK true) — frontend grava
- Policy `select_authenticated` (TO authenticated) — leitura so admin

## Pendencias conhecidas

- [ ] **Vercel envs:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` precisam estar setadas em Production/Preview/Development. Sem isso, o form mostra fallback WhatsApp direto.
- [ ] **Fotos novas:** uploadar em `public/fotos/`:
  - `P1555148.jpg` (Tubarao — substitui placeholder)
  - `P1544368.jpg` (Giro Radical melhor)
  - `P1544553.jpg` (Escalada melhor)
  - `P1544427.jpg` (Lanchonete)
  - `P1555284.jpg` (Atividade calma)
- [ ] **Google Maps embed URL oficial** (`MAPA_EMBED_URL` em `Local.tsx` — hoje usa fallback)
- [ ] **OG image (og.png)** desatualizada — regenerar pra 30/07
- [ ] **Google Analytics + Meta Pixel** com placeholders no `index.html`

## Como rodar

```powershell
# Sempre antes de comandos npm/git no PowerShell:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:Path

# Dev:
npm install
npm run dev   # http://localhost:5173

# Build (validacao):
npm run build

# Push deploya automatico no Vercel:
git add .
git commit -m "..."
git push
```

## Pasta JACK (mentora estrategica)

Materiais estrategicos completos do evento estao em:
```
C:\Users\Usuário\Desktop\PROJETOS IA\JACK SHOW DE BOLA\03-CASA-DE-FESTAS\eventos\tardezinha\
```

> Eu (Claude) **nao leio essa pasta automaticamente**. Se precisar de contexto estrategico mais profundo, a Maninha aponta o arquivo especifico.
