import { Skeleton } from '@/components/ui'
import { cn } from '@/utils'

export function DashboardKpiCard({ 
  label, 
  value, 
  subtext, 
  icon: Icon, 
  iconColor = 'text-primary', 
  iconBg = 'bg-primary/10 border-primary/20',
  trend,
  trendPositive,
  isLoading,
  onClick,
  className
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl bg-card border border-border/80 text-card-foreground shadow-xs transition-all duration-200",
        onClick ? "cursor-pointer hover:border-border hover:shadow-sm" : "hover:border-border",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/70">{label}</span>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", iconBg, iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        {isLoading ? (
          <Skeleton className="h-9 w-32 my-1" />
        ) : (
          <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
            {value ?? '—'}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-1.5 text-sm text-foreground/60 font-medium mt-2">
          {trend && (
            <span className={cn(
              "font-bold",
              trendPositive === true ? "text-emerald-600 dark:text-emerald-400" :
              trendPositive === false ? "text-rose-600 dark:text-rose-400" :
              "text-foreground/60"
            )}>
              {trend}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  )
}
