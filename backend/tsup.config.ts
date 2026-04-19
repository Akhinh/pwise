import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  noExternal: ['@prepwise/types', '@prepwise/utils'],
  esbuildOptions(options) {
    options.alias = {
      '@prepwise/types': resolve(__dirname, '../packages/types/src/index.ts'),
      '@prepwise/utils': resolve(__dirname, '../packages/utils/src/index.ts'),
    };
  },
});