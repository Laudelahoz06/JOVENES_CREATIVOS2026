import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite bloquea hosts no reconocidos; se permite el dominio de ngrok
    // para probar el retorno del pago de Wompi con una URL pública.
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', 'localhost', '127.0.0.1'],
  },
})
