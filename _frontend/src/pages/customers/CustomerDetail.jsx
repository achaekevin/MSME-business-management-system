import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Phone, Mail, MapPin, FileText, DollarSign } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { customerService } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, Badge, Avatar, Skeleton } from '@/components/ui'
import { StatCard, StatCardGrid } from '@/components/cards/StatCard'
import { formatCurrency, formatDate } from '@/utils'

export default function CustomerDetail() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.get(id)
  })
  const customer = data?.data

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  if (!customer) return <div className="text-center py-12 text-muted-foreground">Customer not found</div>

  return (
    <>
      <Helmet><title>{customer.name} — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/customers"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={customer.type === 'business' ? 'blue' : 'secondary'}>{customer.type}</Badge>
              <Badge variant={customer.isActive ? 'success' : 'secondary'}>{customer.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
          <Button asChild variant="outline"><Link to={`/customers/${id}/edit`}><Edit className="h-4 w-4 mr-1" />Edit</Link></Button>
        </div>

        <StatCardGrid cols={4}>
          <StatCard title="Total purchases" value={customer.totalPurchases} format="currency" icon={DollarSign} color="blue" />
          <StatCard title="Balance" value={Math.abs(customer.balance)} format="currency" icon={DollarSign} color={customer.balance > 0 ? 'red' : 'green'} />
          <StatCard title="Loyalty points" value={customer.loyaltyPoints} icon={DollarSign} color="purple" />
          <StatCard title="Credit limit" value={customer.creditLimit || 0} format="currency" icon={DollarSign} color="yellow" />
        </StatCardGrid>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center mb-4">
                <Avatar name={customer.name} size="xl" />
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary">{customer.phone}</a>
                </div>
              )}
              {customer.address?.city && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{[customer.address.street, customer.address.city, customer.address.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                Customer since {formatDate(customer.createdAt)}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle>Recent transactions</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/invoices?customerId=${id}`}><FileText className="h-3.5 w-3.5 mr-1" />View invoices</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Transaction history will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
