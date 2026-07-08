import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, UploadCloud, RefreshCw } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Textarea, Skeleton
} from '@/components/ui'
import { businessService } from '@/services'
import { businessSettingsSchema } from '@/validations'
import toast from 'react-hot-toast'

export default function BusinessProfile() {
  const qc = useQueryClient()
  const [logoFile, setLogoFile] = useState(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => businessService.get().then(r => r.data),
    staleTime: 60_000
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(businessSettingsSchema)
  })

  const biz = data?.data || {}

  useEffect(() => {
    if (biz.name) {
      reset({
        name: biz.name,
        email: biz.email || '',
        phone: biz.phone || '',
        currency: biz.currency || 'USD',
        timezone: biz.timezone || 'UTC',
        address: {
          street: biz.address?.street || '',
          city: biz.address?.city || '',
          state: biz.address?.state || '',
          country: biz.address?.country || '',
          postalCode: biz.address?.postalCode || ''
        }
      })
    }
  }, [biz, reset])

  const updateMutation = useMutation({
    mutationFn: (d) => businessService.update(d),
    onSuccess: () => {
      toast.success('Business profile updated successfully')
      qc.invalidateQueries({ queryKey: ['business-profile'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed')
  })

  const uploadLogoMutation = useMutation({
    mutationFn: (file) => businessService.uploadLogo(file),
    onSuccess: () => {
      toast.success('Logo uploaded successfully')
      qc.invalidateQueries({ queryKey: ['business-profile'] })
      setLogoFile(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload logo')
  })

  const handleLogoUpload = (e) => {
    e.preventDefault()
    if (!logoFile) return toast.error('Select a logo file first')
    uploadLogoMutation.mutate(logoFile)
  }

  return (
    <>
      <Helmet><title>Business Profile — MSME BMS</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Business Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage details, location settings, and branding logo</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Card */}
            <Card className="md:col-span-1">
              <CardHeader><CardTitle className="text-base font-semibold">Branding Logo</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {biz.logoUrl ? (
                  <img src={biz.logoUrl} alt="Logo" className="w-32 h-32 object-contain rounded-lg border p-2 bg-white" />
                ) : (
                  <div className="w-32 h-32 border border-dashed rounded-lg flex items-center justify-center bg-muted">
                    <Building2 className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>
                )}
                <form onSubmit={handleLogoUpload} className="w-full space-y-2">
                  <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                  <Button type="submit" size="sm" className="w-full" disabled={uploadLogoMutation.isPending}>
                    <UploadCloud className="h-4 w-4 mr-2" /> Upload Logo
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Profile details */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Details & Config</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input {...register('name')} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Business Email *</Label>
                      <Input type="email" {...register('email')} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input {...register('phone')} />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Currency *</Label>
                      <Input placeholder="e.g. USD, KES" {...register('currency')} />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Address Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Street</Label>
                        <Input {...register('address.street')} />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input {...register('address.city')} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Update Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
