import { Building2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export function DashboardHeader({ 
  greeting, 
  userName, 
  userRole, 
  branchName, 
  subtitle, 
  onRefresh, 
  isRefreshing, 
  actions 
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Building2 className="w-4 h-4" />
          <span>{branchName || 'Main Enterprise'} · <span className="text-foreground/80 font-semibold">{userRole}</span></span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {greeting}, {userName || 'User'}
        </h1>
        <p className="text-sm text-foreground/60 font-medium">
          {subtitle || "Here's what's happening across your workspace today."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-border/80 text-sm font-semibold hover:bg-muted/80"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
