# Mingo Cogus

Loja online da Mingo Cogus: catálogo com filtros, carrinho, checkout com login, "Meus Pedidos" e
painel administrativo (produtos, categorias e pedidos).

O visual da loja é o do site original (projeto `ICO`), preservado byte a byte: o CSS original fica em
`apps/web/src/styles/legacy/` e uma suíte de testes compara cada tela com screenshots do site original.

## Stack

| Parte                   | Tecnologia                                                             |
| ----------------------- | ---------------------------------------------------------------------- |
| Monorepo                | npm workspaces, TypeScript                                             |
| `apps/api`              | Node 24, Fastify 5, Prisma 7, PostgreSQL 17, Zod                       |
| `apps/web`              | React 19, Vite, React Router, TanStack Query, Zustand, react-hook-form |
| `packages/shared`       | Schemas Zod, tipos, regras de preço e rótulos usados pelos dois lados  |
| `tools/visual-baseline` | Captura das screenshots de referência a partir do site original        |

## Pré-requisitos

- Node.js 24+
- Docker Desktop **aberto** (o PostgreSQL roda em um container)

## Primeiros passos

```powershell
npm install
Copy-Item apps\api\.env.example apps\api\.env
```

Edite `apps/api/.env` e preencha:

- `JWT_SECRET`: gere com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- `ADMIN_PASSWORD`: senha do usuário administrador (mínimo de 12 caracteres)

Depois, um comando por linha (no PowerShell 5.1 não existe `&&`):

```powershell
npm run db:up        # sobe o PostgreSQL (porta 5433)
npm run db:migrate   # cria as tabelas
npm run db:seed      # catálogo inicial + usuário admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev          # API em http://127.0.0.1:3333 e site em http://localhost:5173
```

O painel admin fica em http://localhost:5173/admin (entre com o usuário admin pelo botão LOGIN).

## Scripts

| Comando                              | O que faz                                                                |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `npm run dev`                        | API e site em modo desenvolvimento (o Vite repassa `/api` para a API)    |
| `npm run db:up` / `db:down`          | Sobe / para o PostgreSQL                                                 |
| `npm run db:migrate`                 | Aplica migrações (e gera o cliente Prisma)                               |
| `npm run db:seed`                    | Catálogo inicial e admin (pode rodar várias vezes; não roda em produção) |
| `npm run db:reset`                   | Apaga e recria o banco de desenvolvimento                                |
| `npm run admin:create -w @mingo/api` | Cria/promove o admin a partir de `ADMIN_*` (vale em produção)            |
| `npm run check`                      | Formatação, lint, typecheck e testes unitários/integração                |
| `npm run test:e2e`                   | Fluxos completos no navegador (Playwright)                               |
| `npm run test:visual`                | Compara cada tela com o site original (tolerância zero)                  |
| `npm run visual:baseline`            | Regera as screenshots de referência a partir do site original            |
| `npm run build`                      | Build de produção (`apps/api/dist` e `apps/web/dist`)                    |

Na primeira vez que rodar testes de navegador: `npx playwright install chromium`.

Os testes usam bancos próprios, criados automaticamente: `mingo_test` (API) e `mingo_e2e`
(Playwright, API na porta 3334 e site na 5174). O banco de desenvolvimento não é tocado.

## Arquitetura

```
apps/api/src
  app.ts               monta o Fastify (plugins + rotas em /api)
  env.ts               valida o ambiente no boot (falha se faltar JWT_SECRET etc.)
  plugins/             erros, segurança (helmet, rate limit, Origin), Prisma, sessão, pagamentos
  modules/catalog      categorias, listagem com filtros e facets
  modules/cart         cotação do carrinho (preços do banco)
  modules/orders       criação do pedido (transação, estoque, número), pagamento, status
  modules/admin        CRUD de produtos/categorias, pedidos, resumo
apps/web/src
  components/          componentes da loja (mesmo markup do site original)
  pages/               páginas da loja
  features/admin/      painel administrativo
  styles/legacy/       CSS original, copiado byte a byte (não editar)
  styles/global.css    variáveis e regras globais do site original
packages/shared/src    enums, schemas, dinheiro (centavos), rótulos, transições de status
```

Decisões importantes:

- **Preço e estoque vêm sempre do servidor.** O pedido não aceita campos de preço; o total é
  calculado no banco e a baixa de estoque é atômica. O carrinho mostra a cotação do servidor.
- **Dinheiro em centavos** (inteiros) em todo o sistema.
- **Número do pedido** (`MC-AAAAMMDD-000042`) vem de uma sequence do PostgreSQL.
- **Sessão** em cookie httpOnly (`mc_session`, SameSite=Lax). O papel (USER/ADMIN) é lido do banco a
  cada requisição. Todas as rotas `/api/admin` exigem admin no servidor.
- **Pagamento simulado** (`PAYMENT_SIMULATOR_OUTCOME=approve|decline|pending`), atrás da interface
  `PaymentProvider` em `apps/api/src/modules/payments/provider.ts`, pronta para um gateway real.
- **Erros** no formato `{ "error": { "code", "message", "details?" } }`; erros inesperados viram um
  500 genérico (detalhes só no log).

## Visual da loja

- Não edite os arquivos de `apps/web/src/styles/legacy/`: um teste compara o hash de cada um com o
  CSS original (`manifest.json`).
- `npm run test:visual` precisa passar em qualquer mudança da loja. As referências ficam em
  `tools/visual-baseline/baseline/` e são geradas **a partir do site original** com
  `npm run visual:baseline` (espera o projeto `ICO` ao lado deste; ou defina `ICO_FRONTEND`).
- Única diferença intencional de cor: o CSS original usava 6 variáveis que o tema nunca definiu
  (`--color-gold-soft`, `--color-brown-medium`, `--color-brown-dark`, `--color-terra-light`,
  `--color-shadow-gray`, `--color-light-green`). Elas estão definidas no `global.css`, e a captura
  aplica os mesmos valores à cópia do site original antes de fotografar. Para mudar uma dessas
  cores, altere o `global.css` e rode `npm run visual:baseline` de novo.
- Para ver o site original lado a lado com o novo: `npm run serve -w @mingo/visual-baseline`
  (http://localhost:3101).

## Problemas comuns (Windows)

- **`failed to connect to the docker API`**: abra o Docker Desktop e espere ele terminar de iniciar.
- **Porta 5433 ocupada**: outro PostgreSQL está usando a porta; pare-o ou mude a porta no
  `docker-compose.yml` e na `DATABASE_URL`.
- **Scripts do npm** rodam no `cmd.exe`: não use `VAR=valor comando`; configure pelo `.env`.
- **Instalação**: o npm 12 bloqueia scripts de instalação de dependências. Prisma e esbuild já estão
  liberados em `allowScripts` no `package.json`; ao atualizar as versões, aprove de novo com
  `npm install-scripts approve prisma @prisma/engines esbuild`.

## Fora do escopo desta versão

Gateway de pagamento real, cálculo de frete, upload de imagens (use URLs), avaliações de produtos,
recuperação de senha, cupons, busca de CEP e página de detalhe do produto.
