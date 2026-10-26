import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for the frontend dev server
export default defineConfig({
  plugins: [react()],
  // Proxy API calls to the backend so we don't hit CORS issues in dev
  // When you call http://localhost:5173/api/signup, Vite forwards it to http://localhost:3001/signup
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Strip the /api prefix so /api/signup -> /signup on the backend
        rewrite: (path) => path.replace(/^\/api/, ''),
        // credentials: true sends cookies (refresh token) with proxied requests
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
        },
      },
    },
  },
})
