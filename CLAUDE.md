# Tardezinha Landing — Instrucoes pro Claude

## O que e este projeto
Landing page do projeto **Tardezinha** (TESTE). Construida do zero como exercicio
do programa PAIN (nivel Builder).

## Stack
- **React 19** + **TypeScript**
- **Vite 8** (bundler / dev server)
- **Tailwind CSS v4** (estilos) — usando o plugin oficial `@tailwindcss/vite`
- **Supabase** (backend: auth, banco, storage) — cliente em `src/lib/supabase.ts`

## Como rodar localmente
```powershell
npm install         # so na primeira vez (instala dependencias)
npm run dev         # liga o fogao em modo desenvolvimento
npm run build       # compila pra producao (gera pasta dist/)
npm run preview     # roda a versao compilada localmente
npm run lint        # checa o codigo com ESLint
```

Servidor de dev sobe em `http://localhost:5173` por padrao.

## Estrutura de pastas
```
.
├── public/              # assets estaticos (favicon, imagens publicas)
├── src/
│   ├── lib/
│   │   └── supabase.ts  # cliente Supabase (o "garcom")
│   ├── App.tsx          # componente raiz
│   ├── main.tsx         # entrypoint
│   ├── index.css        # @import "tailwindcss"
│   └── assets/
├── .env                 # cofre — NUNCA commitar
├── .env.example         # modelo das variaveis (vai pro Git)
└── vite.config.ts       # config do Vite (com plugin do Tailwind)
```

## Variaveis de ambiente
Definidas em `.env` (raiz do projeto). Veja `.env.example` pro modelo.

| Variavel | O que e |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima publica (frontend pode usar) |

Regra: toda variavel exposta ao frontend **precisa** comecar com `VITE_`. E uma
protecao do Vite — qualquer coisa sem esse prefixo nao vai pro navegador.

## Regras de seguranca
- NUNCA commitar `.env`
- NUNCA usar a `service_role` key no frontend
- Sempre revisar `.gitignore` antes de qualquer `git add .`

## Convencoes
- Texto da UI em portugues brasileiro
- Codigo, nomes de funcoes/componentes em ingles (padrao do ecossistema)
- Tailwind direto no JSX (`className="..."`) — sem CSS modules ou styled-components

## Estado atual (2026-05-22)
- Projeto recem-criado a partir do template `npm create vite@latest`
- Tailwind v4 ja configurado e funcionando
- Supabase SDK instalado, cliente criado em `src/lib/supabase.ts`
- Faltando: colar URL e anon key reais no `.env` e testar conexao
