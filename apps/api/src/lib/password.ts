import { hash, verify } from '@node-rs/argon2';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
}

// argon2id com a memória configurável (testes usam pouca memória para rodar rápido)
export function createPasswordHasher(memoryCost: number): PasswordHasher {
  const options = { memoryCost, timeCost: 2, parallelism: 1 };
  return {
    hash: (password) => hash(password, options),
    verify: async (passwordHash, password) => {
      try {
        return await verify(passwordHash, password);
      } catch {
        return false;
      }
    },
  };
}
