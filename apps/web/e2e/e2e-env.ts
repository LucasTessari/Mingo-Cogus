// Ambiente isolado dos testes E2E/visuais: banco próprio (mingo_e2e) e portas próprias.
// Credenciais abaixo são só de teste (criadas pelo seed no banco de E2E).

export const API_PORT = 3334;
export const WEB_PORT = 5174;
export const WEB_URL = `http://localhost:${WEB_PORT}`;

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://mingo:mingo@127.0.0.1:5433/mingo_e2e?schema=public';

export const E2E_ADMIN = {
  email: 'admin@mingocogus.test',
  name: 'Administrador',
  password: 'senha-admin-e2e-123',
};
export const E2E_CUSTOMER = {
  email: 'visual@mingocogus.test',
  name: 'Cliente Visual',
  password: 'senha-cliente-e2e',
};

export const API_ENV = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: String(API_PORT),
  DATABASE_URL: E2E_DATABASE_URL,
  JWT_SECRET: 'segredo-dos-testes-e2e-com-mais-de-32-caracteres',
  WEB_ORIGIN: WEB_URL,
  CORS_ORIGINS: '',
  RATE_LIMIT_ENABLED: 'false',
  LOG_LEVEL: 'warn',
  ARGON2_MEMORY_KIB: '1024',
  PAYMENT_SIMULATOR_OUTCOME: 'approve',
};
