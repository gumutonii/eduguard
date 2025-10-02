import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingVariants = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ 
  children, 
  padding = 'md', 
  className, 
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        paddingVariants[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ 
  children, 
  className, 
  ...props 
}: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ 
  children, 
  className, 
  ...props 
}: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-neutral-900', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ 
  children, 
  className, 
  ...props 
}: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
