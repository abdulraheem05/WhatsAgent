import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: '0.0.0.0', // This allows connections from other devices on your Wi-Fi
    port: 5173,
  },
})