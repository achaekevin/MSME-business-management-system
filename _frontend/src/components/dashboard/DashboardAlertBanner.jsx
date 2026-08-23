import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { cn } from '@/utils'

export function DashboardAlertBanner({
  type = 'warning', // 'warning' | 'danger' | 'info'
  title,
  message,
  actionText,
  actionLink,
  onActionClick
}) {
  const styles = {
    warning: {
      border: 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      btn: 'hover:bg-amber-500/10 text-amber-800 dark:text-amber-300'
    },
    danger: {
      border: 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 text-rose-900 dark:text-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      btn: 'hover:bg-rose-500/10 text-rose-800 dark:text-rose-300'
    },
    info: {
      border: 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 text-blue-900 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      btn: 'hover:bg-blue-500/10 text-blue-800 dark:text-blue-300'
    }
  }

  const current = styles[type] || styles.warning
  const Icon = current.icon

  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3", current.border)}>
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-1.5 rounded-lg bg-background/60 shadow-2xs shrink-0">
          <Icon className={cn("w-4 h-4", current.iconColor)} />
        </div>
        <div>
          <div className="text-xs font-semibold">{title}</div>
          <div className="text-xs opacity-90 mt-0.5">{message}</div>
        </div>
      </div>

      {(actionText && (actionLink || onActionClick)) && (
        <div className="shrink-0 pl-7 sm:pl-0">
          {actionLink ? (
            <Button variant="ghost" size="sm" asChild className={cn("text-xs h-8 px-2.5 font-medium", current.btn)}>
              <Link to={actionLink}>
                {actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onActionClick} className={cn("text-xs h-8 px-2.5 font-medium", current.btn)}>
              {actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
