import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui'

export default function BranchManagement() {
  return (
    <>
      <Helmet><title>BranchManagement — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">BranchManagement</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Full implementation connects to backend API via service layer.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
