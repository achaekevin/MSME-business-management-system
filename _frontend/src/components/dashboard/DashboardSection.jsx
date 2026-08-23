import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/utils'

export function DashboardSection({
  title,
  subtitle,
  actionText,
  actionLink,
  children,
  className,
  contentClassName,
  headerRight
}) {
  return (
    <Card className={cn("rounded-2xl border-border/80 shadow-xs", className)}>
      {(title || actionText || headerRight) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/60">
          <div>
            {title && <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>}
            {subtitle && <p className="text-sm text-foreground/60 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {actionText && actionLink && (
              <Link 
                to={actionLink} 
                className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                {actionText} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("pt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
