// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import spaFallback from './spaFallback';

describe('spaFallback (plugin de vite)', () => {
  let outDir;

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spa-fallback-'));
  });

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('solo se aplica al build, no al servidor de desarrollo', () => {
    expect(spaFallback().apply).toBe('build');
  });

  it('copia index.html como 404.html para que el host sirva la SPA en rutas profundas', () => {
    const html = '<!doctype html><div id="root"></div><script src="/assets/index-abc.js"></script>';
    fs.writeFileSync(path.join(outDir, 'index.html'), html);

    spaFallback().writeBundle({ dir: outDir });

    expect(fs.readFileSync(path.join(outDir, '404.html'), 'utf-8')).toBe(html);
  });
});
