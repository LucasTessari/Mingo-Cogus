// Gera as screenshots de referência do site original (ICO) para a comparação visual.
//
//   npm run visual:baseline
//
// Copia o frontend do ICO para uma pasta temporária (o ICO não é alterado), instala as
// dependências dele, sobe o app com uma API falsa servindo o mesmo catálogo do seed e
// fotografa cada cenário em desktop e mobile.
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext } from '@playwright/test';
import { VISUAL_USER, icoProducts, startMockIcoApi } from './mock-ico-api';
import { SCENARIOS, VIEWPORTS, prepareContext, type ScenarioContext } from './scenarios';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const ICO_FRONTEND = process.env.ICO_FRONTEND ?? path.resolve(REPO, '../ICO/frontend');
const BASELINE_DIR = path.join(HERE, 'baseline');
export const MOCK_PORT = 5055;
const ICO_PORT = 3101;
export const ICO_URL = `http://localhost:${ICO_PORT}`;

// Caminho longo (não o 8.3 "LUCAS~1.GIA"): o file watcher do CRA falha com o caminho curto no Windows
const WORK_DIR = path.join(realpathSync.native(tmpdir()), 'mingo-ico-baseline');
const ICO_APP = path.join(WORK_DIR, 'ico-app');

// Variáveis que o CSS do site original usa mas o tema dele nunca definiu. O projeto novo as
// define no global.css (mudança intencional); a referência aplica os mesmos valores ao original
// para que a comparação continue cobrindo todo o resto.
const ADDED_CSS_VARS = [
  '--color-gold-soft',
  '--color-brown-medium',
  '--color-brown-dark',
  '--color-terra-light',
  '--color-shadow-gray',
  '--color-light-green',
];

function readAddedCssVars(): Record<string, string> {
  const css = readFileSync(path.join(REPO, 'apps/web/src/styles/global.css'), 'utf8');
  return Object.fromEntries(
    ADDED_CSS_VARS.map((name) => {
      const value = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1];
      if (!value) throw new Error(`${name} não está definida em apps/web/src/styles/global.css`);
      return [name, value.trim()];
    }),
  );
}

// Só na cópia: o prepareIcoApp recopia o public/ a cada execução
function injectAddedCssVars(vars: Record<string, string>) {
  const indexHtml = path.join(ICO_APP, 'public/index.html');
  const html = readFileSync(indexHtml, 'utf8');
  if (!html.includes('</head>')) throw new Error(`</head> não encontrado em ${indexHtml}`);
  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
  writeFileSync(
    indexHtml,
    html.replace('</head>', `<style>:root { ${declarations} }</style></head>`),
  );
}

export function prepareIcoApp() {
  if (!existsSync(ICO_FRONTEND))
    throw new Error(`Frontend do ICO não encontrado em ${ICO_FRONTEND} (defina ICO_FRONTEND)`);
  mkdirSync(ICO_APP, { recursive: true });
  for (const entry of ['src', 'public', 'package.json', 'package-lock.json', 'tsconfig.json']) {
    rmSync(path.join(ICO_APP, entry), { recursive: true, force: true });
    cpSync(path.join(ICO_FRONTEND, entry), path.join(ICO_APP, entry), { recursive: true });
  }
  // Mesmas imagens de produto do projeto novo
  cpSync(
    path.join(REPO, 'apps/web/public/placeholders'),
    path.join(ICO_APP, 'public/placeholders'),
    { recursive: true },
  );

  if (!existsSync(path.join(ICO_APP, 'node_modules', 'react-scripts'))) {
    console.log('📦 Instalando dependências do ICO (só na primeira vez)...');
    execSync('npm ci --ignore-scripts --no-audit --no-fund', { cwd: ICO_APP, stdio: 'inherit' });
  }
}

export function startIcoApp(): ChildProcess {
  const child = spawn(
    process.execPath,
    [path.join(ICO_APP, 'node_modules/react-scripts/scripts/start.js')],
    {
      cwd: ICO_APP,
      env: {
        ...process.env,
        PORT: String(ICO_PORT),
        BROWSER: 'none',
        REACT_APP_API_URL: `http://127.0.0.1:${MOCK_PORT}`,
        FAST_REFRESH: 'false',
        DISABLE_ESLINT_PLUGIN: 'true',
        WATCHPACK_POLLING: 'true',
        CHOKIDAR_USEPOLLING: 'true',
      },
      stdio: 'pipe',
    },
  );
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

export async function waitFor(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(5000) })).ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Tempo esgotado esperando ${url}`);
}

// Login e carrinho no formato de armazenamento do site original
function icoContext(context: BrowserContext): ScenarioContext {
  return {
    app: 'ico',
    login: async () => {
      const { token, ...user } = { ...VISUAL_USER, token: 'visual-token' };
      await context.addInitScript(
        ({ token, user }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        },
        { token, user },
      );
    },
    fillCart: async (items) => {
      const cartItems = items.map(({ slug, quantity }) => ({
        product: icoProducts.find((product) => product.slug === slug)!,
        quantity,
      }));
      const cart = {
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      };
      await context.addInitScript(
        (value) => localStorage.setItem('ecommerce-cart', value),
        JSON.stringify(cart),
      );
    },
  };
}

async function main() {
  prepareIcoApp();
  injectAddedCssVars(readAddedCssVars());
  const mock = await startMockIcoApi(MOCK_PORT);
  const icoApp = startIcoApp();
  try {
    console.log('⏳ Subindo o site original...');
    await waitFor(ICO_URL, 180_000);

    rmSync(BASELINE_DIR, { recursive: true, force: true });
    mkdirSync(BASELINE_DIR, { recursive: true });

    const browser = await chromium.launch();
    for (const viewport of VIEWPORTS) {
      for (const scenario of SCENARIOS) {
        const context = await browser.newContext({
          baseURL: ICO_URL,
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          locale: 'pt-BR',
          timezoneId: 'America/Sao_Paulo',
        });
        await prepareContext(context);
        const page = await context.newPage();
        await scenario.run(page, icoContext(context));
        await page.screenshot({
          path: path.join(BASELINE_DIR, `${scenario.name}-${viewport.name}.png`),
          fullPage: scenario.fullPage,
          animations: 'disabled',
          caret: 'hide',
        });
        await context.close();
        console.log(`📸 ${scenario.name} (${viewport.name})`);
      }
    }
    await browser.close();
    console.log(`✅ ${readdirSync(BASELINE_DIR).length} screenshots em ${BASELINE_DIR}`);
  } finally {
    icoApp.kill();
    mock.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('❌', error);
    process.exit(1);
  });
}
