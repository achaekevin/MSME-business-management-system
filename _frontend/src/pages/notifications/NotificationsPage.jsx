import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui'

export default function NotificationsPage() {
  return (
    <>
      <Helmet><title>NotificationsPage — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">NotificationsPage</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Full implementation connects to backend API via service layer.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
