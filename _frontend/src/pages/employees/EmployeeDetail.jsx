import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { UserCheck, RefreshCw, Mail, Phone, Calendar, Briefcase, FileText, UploadCloud, Check, Edit2, Trash2, ArrowLeft, AlertTriangle, Save, X } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Avatar, Skeleton, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui'
import { employeeService } from '@/services'
import { formatCurrency, formatDate } from '@/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('contract')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editData, setEditData] = useState({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.get(id),
    staleTime: 60_000
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }) => employeeService.uploadDocument(id, file, type),
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      qc.invalidateQueries({ queryKey: ['employee', id] })
      setFile(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload document')
  })

  const updateMutation = useMutation({
    mutationFn: (updatePayload) => employeeService.update(id, updatePayload),
    onSuccess: () => {
      toast.success('Employee updated successfully')
      qc.invalidateQueries({ queryKey: ['employee', id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      setIsEditing(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update employee')
  })

  const deleteMutation = useMutation({
    mutationFn: () => employeeService.delete(id),
    onSuccess: () => {
      toast.success('Employee deleted successfully')
      qc.invalidateQueries({ queryKey: ['employees'] })
      navigate('/app/employees')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete employee')
  })

  const emp = (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) 
    ? data.data 
    : (data && typeof data === 'object' && !Array.isArray(data) ? data : {})
  const docs = emp.documents || []

  const handleUpload = (e) => {
    e.preventDefault()
    if (!file) return toast.error('Select a file first')
    uploadMutation.mutate({ file, type: docType })
  }

  const startEditing = () => {
    let joinDateStr = ''
    try {
      joinDateStr = format(new Date(emp.joinDate), 'yyyy-MM-dd')
    } catch {
      joinDateStr = ''
    }
    setEditData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department?.name || '',
      position: emp.position?.title || emp.position?.name || '',
      salary: emp.salary || 0,
      salaryType: emp.salaryType || 'monthly',
      joinDate: joinDateStr
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditData({})
  }

  const saveEditing = () => {
    if (!editData.name || !editData.email) {
      return toast.error('Name and email are required')
    }
    updateMutation.mutate(editData)
  }

  const updateField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <>
      <Helmet><title>{emp.name || 'Employee Detail'} — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/employees">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <Avatar name={emp.name} size="lg" />
            <div>
              <h1 className="text-2xl font-bold">{emp.name}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {emp.position?.title || emp.position?.name || 'Staff'} • {emp.department?.name || 'General'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={saveEditing} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="docs">Documents & Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <Input value={editData.name} onChange={e => updateField('name', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input type="email" value={editData.email} onChange={e => updateField('email', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <Input value={editData.phone} onChange={e => updateField('phone', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <Input value={editData.department} onChange={e => updateField('department', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <Input value={editData.position} onChange={e => updateField('position', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Salary</Label>
                      <Input type="number" value={editData.salary} onChange={e => updateField('salary', Number(e.target.value))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Pay Frequency</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editData.salaryType}
                        onChange={e => updateField('salaryType', e.target.value)}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Join Date</Label>
                      <Input type="date" value={editData.joinDate} onChange={e => updateField('joinDate', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-semibold">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-semibold">{emp.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Join Date</p>
                        <p className="font-semibold">
                          {formatDate(emp.joinDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Salary</p>
                        <p className="font-semibold">
                          {formatCurrency(emp.salary)} / {emp.salaryType}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Upload Document</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="flex gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value="contract">Contract</option>
                      <option value="id_proof">ID Proof</option>
                      <option value="academic">Academic Credentials</option>
                      <option value="tax_form">Tax Forms</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Input type="file" onChange={e => setFile(e.target.files[0])} />
                  </div>
                  <Button type="submit" disabled={uploadMutation.isPending}>
                    <UploadCloud className="h-4 w-4 mr-2" /> Upload
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Employee Documents</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-semibold">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">{doc.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
                {docs.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground py-8">No documents uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Employee
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Are you sure you want to delete <strong>{emp.name}</strong>? This will permanently remove their record, attendance, leave requests, and all associated data.
            </p>
            <p className="text-xs text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
