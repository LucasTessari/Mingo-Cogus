import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules',
    '**/dist',
    '**/coverage',
    '**/playwright-report',
    '**/test-results',
    'apps/api/src/generated',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  },
  {
    files: [
      'apps/api/**/*.ts',
      'packages/**/*.ts',
      'tools/**/*.ts',
      'apps/web/e2e/**/*.ts',
      '*.js',
      'apps/*/*.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    // Arquivo de configuração das rotas (não é um componente; fast refresh não se aplica)
    files: ['apps/web/src/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  prettier,
]);
