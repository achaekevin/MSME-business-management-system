import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { customerService } from '@/services'
import { customerSchema } from '@/validations'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui'

export default function CreateCustomer() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const queryClient = useQueryClient()

  const { data: customerData, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.get(id),
    enabled: isEdit
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { type: 'individual', creditLimit: 0 }
  })

  useEffect(() => {
    if (customerData?.data) reset(customerData.data)
  }, [customerData, reset])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? customerService.update(id, data) : customerService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(isEdit ? 'Customer updated' : 'Customer created')
      navigate(`/customers/${isEdit ? id : res.data.id}`)
    },
    onError: (err) => toast.error(err.message)
  })

  if (isEdit && loadingCustomer) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Customer' : 'New Customer'} — MSME BMS</title></Helmet>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/customers"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit customer' : 'Add customer'}</h1>
            <p className="text-muted-foreground text-sm">{isEdit ? 'Update customer details' : 'Create a new customer profile'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Customer name *</Label>
                  <Input placeholder="Full name or business name" className="mt-1" {...register('name')} />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>Email address</Label>
                  <Input type="email" placeholder="customer@email.com" className="mt-1" {...register('email')} />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input type="tel" placeholder="+1 555 000 0000" className="mt-1" {...register('phone')} />
                </div>
                <div>
                  <Label>Customer type *</Label>
                  <select className="mt-1 w-full border rounded-md h-10 px-3 text-sm bg-background" {...register('type')}>
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <Label>Credit limit</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" className="mt-1" {...register('creditLimit', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street address</Label>
                <Input placeholder="123 Main Street" className="mt-1" {...register('address.street')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input placeholder="Nairobi" className="mt-1" {...register('address.city')} />
                </div>
                <div>
                  <Label>State / Province</Label>
                  <Input placeholder="Nairobi County" className="mt-1" {...register('address.state')} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input placeholder="Kenya" className="mt-1" {...register('address.country')} />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input placeholder="00100" className="mt-1" {...register('address.postalCode')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Any additional notes about this customer..." rows={3} {...register('notes')} />
              {errors.notes && <p className="text-destructive text-xs mt-1">{errors.notes.message}</p>}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" asChild><Link to="/customers">Cancel</Link></Button>
            <Button type="submit" isLoading={isSubmitting} leftIcon={!isSubmitting && <Save className="h-4 w-4" />}>
              {isEdit ? 'Save changes' : 'Create customer'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
