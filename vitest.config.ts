import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test.setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts', 'src/**/*.js', 'scripts/**/*'],
        exclude: ['src/vite-env.d.ts', 'src/config.*', '**/*.config.*', '**/*.test.*', '**/index.*'],
      },
    },
  })
);
