import { z } from 'zod';
import type { PrismaClient } from './db';
import type { PasswordHasher } from './password';

const adminEnv = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  ADMIN_NAME: z.string().trim().min(1).default('Administrador'),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD precisa ter pelo menos 12 caracteres'),
});

export const readAdminEnv = (source: NodeJS.ProcessEnv = process.env) => {
  const result = adminEnv.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Variáveis ADMIN_* inválidas:\n${issues.join('\n')}`);
  }
  return result.data;
};

// Cria o admin (ou promove um usuário existente). A senha só é definida na criação.
export async function ensureAdmin(
  prisma: PrismaClient,
  passwords: PasswordHasher,
  admin: z.output<typeof adminEnv>,
) {
  const existing = await prisma.user.findUnique({ where: { email: admin.ADMIN_EMAIL } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
    return { email: admin.ADMIN_EMAIL, created: false };
  }
  await prisma.user.create({
    data: {
      email: admin.ADMIN_EMAIL,
      name: admin.ADMIN_NAME,
      role: 'ADMIN',
      passwordHash: await passwords.hash(admin.ADMIN_PASSWORD),
    },
  });
  return { email: admin.ADMIN_EMAIL, created: true };
}
