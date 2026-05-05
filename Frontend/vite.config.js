import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Această linie va genera folderul 'coverage' cu raportul de 80%
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})