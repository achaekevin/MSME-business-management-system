import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatCurrency, formatCompact, formatPercent } from '@/utils'
import { Card, CardContent } from '@/components/ui'
import { Skeleton } from '@/components/ui'

export function StatCard({ title, value, change, period, format = 'number', icon: Icon, color = 'blue', isLoading }) {
  const isPositive = change > 0
  const isNeutral = change === 0 || change === undefined

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
  }

  const formatValue = (v) => {
    if (v === undefined || v === null) return '—'
    switch (format) {
      case 'currency': return formatCurrency(v)
      case 'compact': return formatCompact(v)
      case 'percent': return formatPercent(v)
      default: return v.toLocaleString()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {Icon && (
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorMap[color])}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="text-2xl font-bold tracking-tight">{formatValue(value)}</div>
          {change !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {isNeutral ? (
                <Minus className="h-3 w-3 text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isNeutral ? '0%' : `${isPositive ? '+' : ''}${formatPercent(change)}`}
              </span>
              {period && <span className="text-muted-foreground ml-0.5">{period}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function StatCardGrid({ children, cols = 4 }) {
  const colsMap = { 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }
  return <div className={cn('grid gap-4', colsMap[cols] || colsMap[4])}>{children}</div>
}
