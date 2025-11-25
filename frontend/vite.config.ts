import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['recharts', 'react', 'react-dom', 'react-router-dom'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Simplified chunking strategy to avoid circular dependencies
          // Only chunk the most stable core dependencies
          if (id.includes('node_modules')) {
            // Core React ecosystem - most stable, least likely to cause issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Everything else goes into a single vendor chunk
            // This avoids circular dependencies from complex chunking strategies
            return 'vendor'
          }
          // Don't manually chunk source code - let Vite handle it automatically
          // This prevents circular dependencies between pages and shared components
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 KB
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
          });
        },
      },
    },
  },
})
