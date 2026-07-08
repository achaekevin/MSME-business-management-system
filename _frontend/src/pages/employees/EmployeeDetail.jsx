import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { UserCheck, RefreshCw, Mail, Phone, Calendar, Briefcase, FileText, UploadCloud, Check } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Avatar, Skeleton
} from '@/components/ui'
import { employeeService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function EmployeeDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('contract')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.get(id).then(r => r.data),
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

  const emp = data?.data || {}
  const docs = emp.documents || []

  const handleUpload = (e) => {
    e.preventDefault()
    if (!file) return toast.error('Select a file first')
    uploadMutation.mutate({ file, type: docType })
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
            <Avatar name={emp.name} size="lg" />
            <div>
              <h1 className="text-2xl font-bold">{emp.name}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> {emp.position?.name} • {emp.department?.name}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
                      {emp.joinDate ? format(new Date(emp.joinDate), 'MMM dd, yyyy') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Salary</p>
                    <p className="font-semibold">
                      ${emp.salary?.toLocaleString()} / {emp.salaryType}
                    </p>
                  </div>
                </div>
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
    </>
  )
}
