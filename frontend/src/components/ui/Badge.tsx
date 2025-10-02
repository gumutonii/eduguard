import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'low' | 'medium' | 'high' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variants = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  success: 'bg-accent-100 text-accent-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-primary-100 text-primary-800',
  neutral: 'bg-neutral-100 text-neutral-800',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md', 
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
