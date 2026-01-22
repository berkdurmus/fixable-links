import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Separate Vite config for building the injectable script
// This builds a single self-contained JS file that can be injected into proxied pages

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist-inject',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/inject/index.ts'),
      name: 'PlsFixInject',
      formats: ['iife'],
      fileName: () => 'plsfix-inject.js',
    },
    rollupOptions: {
      output: {
        // Ensure all dependencies are bundled
        inlineDynamicImports: true,
        // Global variable names for external deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    // Don't minify for easier debugging during development
    minify: false,
  },
});
