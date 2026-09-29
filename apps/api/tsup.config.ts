import { defineConfig } from 'tsup';

// Build de produção da API: um bundle ESM para Node 24. O pacote @mingo/shared (só código-fonte)
// e o cliente Prisma gerado entram no bundle; as dependências do package.json ficam externas.
export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node24',
  sourcemap: true,
  clean: true,
  noExternal: ['@mingo/shared'],
  // Carregado só em desenvolvimento
  external: ['pino-pretty'],
});
