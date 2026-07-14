import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, ShoppingCart, FileText, Package, Users, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui'
import { formatRelativeTime } from '@/utils'
import { axiosInstance } from '@/lib/axios'

const activityIcons = {
  'sale.created': ShoppingCart,
  'invoice.created': FileText,
  'invoice.paid': DollarSign,
  'payment.received': DollarSign,
  'product.created': Package,
  'customer.created': Users,
  'employee.added': Users,
  'expense.recorded': TrendingUp,
  'stock.adjusted': Package,
  'purchase.created': ShoppingCart
}

const activityColors = {
  'sale.created': 'text-blue-500',
  'invoice.created': 'text-purple-500',
  'invoice.paid': 'text-green-500',
  'payment.received': 'text-green-500',
  'product.created': 'text-orange-500',
  'customer.created': 'text-indigo-500',
  'employee.added': 'text-teal-500',
  'expense.recorded': 'text-red-500',
  'stock.adjusted': 'text-yellow-500',
  'purchase.created': 'text-blue-500'
}

export function ActivityFeed({ limit = 10, className = '' }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const res = await axiosInstance.get(`/activity?limit=${limit}`)
      return res.data.data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent activity
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || Clock
            const colorClass = activityColors[activity.type] || 'text-gray-500'

            return (
              <div key={activity.id} className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {activity.user?.name || 'System'}
                    </p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
