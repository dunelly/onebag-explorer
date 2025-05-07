import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/onebag-explorer/',
  plugins: [
    react({
      // Disable refresh overlay
      fastRefresh: true,
    })
  ],
  server: {
    port: 5173,
    hmr: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  // Add better error handling
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
