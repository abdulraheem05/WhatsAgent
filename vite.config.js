import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows connections from other devices
    port: 5173,
    allowedHosts: [
      'accustom-varying-baking.ngrok-free.dev', // Add your ngrok host here
      'localhost',
      '127.0.0.1'
    ],
  },
})