// SaleDetail.jsx
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils'
import { SALE_STATUSES } from '@/constants'

export default function SaleDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/sales"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold">Sale #{id}</h1>
      </div>
      <Card><CardContent className="p-6 text-center text-muted-foreground">Sale details loaded from API for ID: {id}</CardContent></Card>
    </div>
  )
}
