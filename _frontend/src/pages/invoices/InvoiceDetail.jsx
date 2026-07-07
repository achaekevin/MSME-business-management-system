import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui'

export default function InvoiceDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold">Invoice #{id}</h1>
      </div>
      <Card><CardContent className="p-6 text-center text-muted-foreground">Invoice detail view for ID: {id}</CardContent></Card>
    </div>
  )
}
