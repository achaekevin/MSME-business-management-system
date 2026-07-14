import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { BarChart3, Package, PiggyBank, Users, UserCheck, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function ReportsDashboard() {
  const reports = [
    { label: 'Sales Reports', desc: 'Revenue analysis, invoice status, and top items sold', to: '/app/reports/sales', icon: BarChart3, color: 'bg-blue-500' },
    { label: 'Inventory Reports', desc: 'Stock value assessment and low-stock forecasting', to: '/app/reports/inventory', icon: Package, color: 'bg-green-500' },
    { label: 'Financial Reports', desc: 'VAT/Tax calculations, cash book journals, and Trial Balance summaries', to: '/app/reports/financial', icon: PiggyBank, color: 'bg-indigo-500' },
    { label: 'Customer Reports', desc: 'Loyalty point registry and overdue statement lists', to: '/app/reports/customers', icon: Users, color: 'bg-amber-500' },
    { label: 'Employee Reports', desc: 'Payroll deduction statements and attendance logs summaries', to: '/app/reports/employees', icon: UserCheck, color: 'bg-teal-500' }
  ]

  return (
    <>
      <Helmet><title>Reports Hub — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a category to view detailed reports and export statements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r, i) => {
            const Icon = r.icon
            return (
              <Card key={i} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className={`p-3 rounded-full w-12 h-12 flex items-center justify-center text-white ${r.color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold mb-2">{r.label}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-6">{r.desc}</p>
                  </div>
                  <Link to={r.to} className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    Generate Report <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
