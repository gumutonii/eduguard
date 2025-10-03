import { Link } from 'react-router-dom'

export function SimpleFooter() {
  return (
    <footer className="bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <svg 
              className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <h1 className="ml-2 text-lg sm:text-xl font-bold text-white">EduGuard</h1>
          </div>
          <p className="text-sm sm:text-base text-neutral-400 text-center sm:text-right">
            © 2025 EduGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
