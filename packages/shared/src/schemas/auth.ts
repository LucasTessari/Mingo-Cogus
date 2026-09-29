import { z } from 'zod';
import { ROLES } from '../enums';

const email = z.string().trim().toLowerCase().pipe(z.email('Email inválido'));

export const registerInput = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(50),
  email,
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(128),
});
export type RegisterInput = z.infer<typeof registerInput>;

export const loginInput = z.object({
  email,
  password: z.string().min(1, 'Informe a senha').max(128),
});
export type LoginInput = z.infer<typeof loginInput>;

export const publicUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
});
export type PublicUser = z.infer<typeof publicUser>;

export const sessionResponse = z.object({ user: publicUser.nullable() });
export type SessionResponse = z.infer<typeof sessionResponse>;
