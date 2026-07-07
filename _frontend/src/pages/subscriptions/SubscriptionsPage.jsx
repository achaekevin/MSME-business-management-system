import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Check, Zap, Crown, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SUBSCRIPTION_PLANS } from '@/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { cn } from '@/utils'

export default function SubscriptionsPage() {
  const [billing, setBilling] = useState('month')
  const currentPlan = 'growth'
  const planIcons = { starter: Zap, growth: Crown, enterprise: Building2 }

  return (
    <>
      <Helmet><title>Subscription — MSME BMS</title></Helmet>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
          <p className="text-muted-foreground">Scale as you grow. Upgrade or downgrade anytime.</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setBilling('month')} className={cn('px-4 py-1.5 rounded-full text-sm', billing === 'month' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>Monthly</button>
            <button onClick={() => setBilling('year')} className={cn('flex items-center gap-1 px-4 py-1.5 rounded-full text-sm', billing === 'year' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
              Yearly <Badge variant="success" className="text-[10px] py-0 px-1.5">20% off</Badge>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan, i) => {
            const Icon = planIcons[plan.id] || Zap
            const isCurrentPlan = plan.id === currentPlan
            const price = billing === 'year' ? Math.round(plan.price * 0.8) : plan.price
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className={cn('relative h-full flex flex-col', plan.popular && 'border-primary border-2', isCurrentPlan && 'ring-2 ring-green-500')}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-primary px-3">Most popular</Badge></div>}
                  {isCurrentPlan && <div className="absolute -top-3 right-4"><Badge variant="success" className="px-3">Current plan</Badge></div>}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-3">
                      <span className="text-4xl font-black">${price}</span>
                      <span className="text-muted-foreground text-sm">/{billing === 'year' ? 'mo, billed yearly' : 'month'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      {isCurrentPlan
                        ? <Button variant="outline" className="w-full" disabled>Current plan</Button>
                        : <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>Upgrade to {plan.name}</Button>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </>
  )
}
