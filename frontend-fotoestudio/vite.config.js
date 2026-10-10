import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  server: {
    host: true, // Escucha en todas las interfaces (0.0.0.0) dentro del contenedor
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws', // Usa WebSocket estándar
    },
    watch: {
      usePolling: true, // Permite detectar cambios de archivos entre Windows y el volumen del contenedor
    },
  },
})