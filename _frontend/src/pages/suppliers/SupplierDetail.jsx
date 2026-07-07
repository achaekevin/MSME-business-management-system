import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui'

export default function SupplierDetail() {
  return (
    <>
      <Helmet><title>SupplierDetail — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">SupplierDetail</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Full implementation connects to backend API via service layer.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
