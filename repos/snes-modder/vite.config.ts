import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SNESModder',
      formats: ['es', 'cjs'],
      fileName: (format) => `snes-modder.${format}.js`
    },
    rollupOptions: {
      external: ['fs', 'path', 'crypto'],
      output: {
        globals: {
          fs: 'fs',
          path: 'path',
          crypto: 'crypto'
        }
      }
    },
    sourcemap: true,
    minify: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@mods': resolve(__dirname, 'src/mods'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'html', 'lcov']
    }
  }
});