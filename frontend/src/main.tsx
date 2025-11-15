import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setQueryClient } from './stores/auth'
import App from './App'
import './styles/globals.css'

// MSW disabled - using real backend API
// Initialize MSW in development
// if (import.meta.env?.DEV) {
//   import('./lib/msw').then(({ worker }) => {
//     worker.start()
//   }).catch(console.error)
// }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider data fresh for 30 seconds (dashboard data)
      gcTime: 300000, // Keep in cache for 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      refetchOnMount: false, // Use cached data if fresh
      retry: 1,
    },
    mutations: {
      // Refetch all queries after mutations for real-time updates
      onSettled: () => {
        queryClient.invalidateQueries()
      },
    },
  },
})

// Make query client available to auth store for cache clearing
setQueryClient(queryClient)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
