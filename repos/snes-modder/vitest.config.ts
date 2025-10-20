import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/__tests__/**/*.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'quick-mods/**',
      'test-roms/**',
      'backups/**',
      'docs/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 75,
        statements: 80
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/testing/**' // Exclude testing utilities from coverage
      ]
    },
    setupFiles: ['./src/testing/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
        minThreads: 2,
        maxThreads: 8  // bsnes-inspired parallel execution
      }
    },
    // Pytest-xdist inspired configuration
    maxConcurrency: 8,
    isolate: false  // Speed up execution for independent tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@mods': resolve(__dirname, 'src/mods'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@testing': resolve(__dirname, 'src/testing')
    }
  }
});