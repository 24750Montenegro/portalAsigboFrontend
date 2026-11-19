import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reutiliza los alias de vite (el plugin de eslint se apaga solo bajo VITEST).
export default defineConfig((env) => mergeConfig(viteConfig(env), {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'build/**/*.test.js'],
    css: false,
  },
}));
