import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui'

export default function CreateInvoice() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/invoices"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold">New invoice</h1>
      </div>
      <Card><CardContent className="p-6 text-center text-muted-foreground">Invoice creation form — connects to invoiceService.create()</CardContent></Card>
    </div>
  )
}
