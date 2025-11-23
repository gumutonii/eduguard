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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            if (id.includes('recharts')) {
              return 'chart-vendor'
            }
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-vendor'
            }
            // Other node_modules
            return 'vendor'
          }
          
          // Feature chunks by role
          if (id.includes('/pages/admin/')) {
            if (id.includes('SuperAdminDashboardPage') || id.includes('AllSchoolsPage') || 
                id.includes('SchoolDetailPage') || id.includes('AllUsersPage') || 
                id.includes('UserDetailPage') || id.includes('UserEditPage')) {
              return 'super-admin-pages'
            }
            return 'admin-pages'
          }
          
          if (id.includes('/pages/teacher/')) {
            return 'teacher-pages'
          }
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
