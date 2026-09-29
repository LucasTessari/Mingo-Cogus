import { defineConfig } from '@playwright/test';
import { API_ENV, API_PORT, WEB_PORT, WEB_URL } from './e2e/e2e-env';

export default defineConfig({
  testDir: './e2e',
  // Um banco compartilhado: testes em sequência
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  use: {
    baseURL: WEB_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  // Screenshots de referência geradas a partir do site original (npm run visual:baseline).
  // Tolerância zero por padrão: qualquer mudança visual na loja faz o teste falhar.
  snapshotPathTemplate: '{testDir}/../../../tools/visual-baseline/baseline/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: Number(process.env.VISUAL_MAX_DIFF_RATIO ?? 0),
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: [
    { name: 'e2e', testMatch: /.*\.e2e\.ts/ },
    { name: 'visual', testMatch: /visual\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'node --import tsx src/server.ts',
      cwd: '../api',
      env: API_ENV,
      // Rota que não consulta o banco: o servidor pode subir antes das migrações do global-setup
      url: `http://127.0.0.1:${API_PORT}/api/auth/me`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      env: { VITE_API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`, PORT: String(WEB_PORT) },
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
