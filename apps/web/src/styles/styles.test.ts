// Guardas do visual: o CSS original não pode mudar e toda variável CSS usada precisa ter valor
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const STYLES_DIR = path.resolve(__dirname);
const LEGACY_DIR = path.join(STYLES_DIR, 'legacy');
const SRC_DIR = path.resolve(STYLES_DIR, '..');

const listFiles = (dir: string, extension: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full, extension);
    return full.endsWith(extension) ? [full] : [];
  });

describe('CSS original (legacy)', () => {
  const manifest = JSON.parse(readFileSync(path.join(LEGACY_DIR, 'manifest.json'), 'utf8')) as {
    files: Record<string, string>;
  };

  test('cada arquivo é idêntico ao copiado do site original', () => {
    for (const [file, hash] of Object.entries(manifest.files)) {
      const content = readFileSync(path.join(LEGACY_DIR, file));
      expect(createHash('sha256').update(content).digest('hex'), file).toBe(hash);
    }
  });

  test('nenhum arquivo foi adicionado ou removido', () => {
    const present = listFiles(LEGACY_DIR, '.css').map((file) =>
      path.relative(LEGACY_DIR, file).replace(/\\/g, '/'),
    );
    expect(present.sort()).toEqual(Object.keys(manifest.files).sort());
  });
});

test('toda variável CSS usada tem valor definido', () => {
  const cssFiles = listFiles(SRC_DIR, '.css');
  const defined = new Set<string>();
  const used = new Map<string, string>();
  for (const file of cssFiles) {
    const css = readFileSync(file, 'utf8');
    for (const [, name] of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(name!);
    for (const [, name] of css.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      if (!used.has(name!)) used.set(name!, path.relative(SRC_DIR, file));
    }
  }
  const undefinedVars = [...used.keys()].filter((name) => !defined.has(name));
  expect(undefinedVars.map((name) => `${name} (${used.get(name)})`)).toEqual([]);
});
