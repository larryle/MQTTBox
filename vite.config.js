import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/www'),
  base: './',
  publicDir: 'lib',
  build: {
    outDir: path.resolve(__dirname, 'build'),
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/www/index.html')
      },
      output: {
        format: 'iife',
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  plugins: [
    react({
      babel: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-react', { runtime: 'classic' }]
        ]
      }
    })
    // Temporarily disabled legacy plugin to fix build issues
    // legacy({
    //   targets: ['defaults', 'not IE 11'],
    //   modernPolyfills: true
    // })
  ],
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app')
    }
  }
});


