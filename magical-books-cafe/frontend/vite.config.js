import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite bloquea hosts no reconocidos; se permite el dominio de ngrok
    // para probar el retorno del pago de Wompi con una URL pǧblica.
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    restoreMocks: true,
  },
})
