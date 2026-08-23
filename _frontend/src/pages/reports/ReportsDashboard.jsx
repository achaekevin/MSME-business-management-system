import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { BarChart3, Package, PiggyBank, Users, UserCheck, ArrowRight, Download, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

export default function ReportsDashboard() {
  const reports = [
    { 
      label: 'Sales Analysis Reports', 
      desc: 'Monthly revenue performance, order volume metrics, and sales trend breakdowns.', 
      to: '/app/reports/sales', 
      icon: BarChart3, 
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20'
    },
    { 
      label: 'Inventory Status Reports', 
      desc: 'On-hand stock valuation, SKU breakdown, and critical low-stock thresholds.', 
      to: '/app/reports/inventory', 
      icon: Package, 
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    { 
      label: 'Financial & VAT Reports', 
      desc: 'Input/Output tax calculations, net tax liability, and recorded disbursements.', 
      to: '/app/reports/financial', 
      icon: PiggyBank, 
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    { 
      label: 'Customer Account Reports', 
      desc: 'Active customer registry, accounts receivable balances, and loyalty balances.', 
      to: '/app/reports/customers', 
      icon: Users, 
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    { 
      label: 'Employee & Payroll Reports', 
      desc: 'Workforce records, attendance tracking logs, and monthly payroll summaries.', 
      to: '/app/reports/employees', 
      icon: UserCheck, 
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20'
    },
    { 
      label: 'Enterprise Data Export', 
      desc: 'Download CSV and Excel exports of complete database collections for reporting.', 
      to: '/app/export', 
      icon: Download, 
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20'
    }
  ]

  return (
    <>
      <Helmet><title>Reports Hub — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Business Intelligence & Analytics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reporting Center & Statements</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Generate PDF summaries, spreadsheets, and audit statements across business operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((r, i) => {
            const Icon = r.icon
            return (
              <Card 
                key={i} 
                className="rounded-2xl border-border/80 shadow-xs hover:border-border hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${r.iconBg} ${r.iconColor} mb-3.5`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground mb-1.5">{r.label}</CardTitle>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{r.desc}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className="w-full text-xs h-9 rounded-xl border-border/80 justify-between group-hover:border-primary/40 group-hover:text-primary transition-colors"
                  >
                    <Link to={r.to}>
                      <span>Open Report</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
