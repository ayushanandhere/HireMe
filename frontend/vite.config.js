import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'events', 'stream', 'string_decoder']
    })
  ],
  server: {
    port: 5173, // Frontend will run on port 5173
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // 👈 Proxy API requests to backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      // Add any aliases if needed
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      plugins: []
    }
  }
})
