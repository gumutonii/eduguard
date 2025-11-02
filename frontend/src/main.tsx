import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
      staleTime: 0, // Always consider data stale for real-time updates
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
