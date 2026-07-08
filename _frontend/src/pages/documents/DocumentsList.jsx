import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { FileText, PlusCircle, Trash2, RefreshCw, UploadCloud, Eye } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, Badge
} from '@/components/ui'
import { documentService } from '@/services'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DataTable } from '@/components/tables/DataTable'

const columns = (onView, onDelete) => [
  { accessorKey: 'fileName', header: 'Document Name', cell: ({ row }) => (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <FileText className="h-4 w-4 text-blue-600" />
      </div>
      <span className="font-semibold">{row.original.fileName}</span>
    </div>
  )},
  { accessorKey: 'category', header: 'Category', cell: ({ row }) => (
    <Badge variant="outline" className="capitalize">{row.original.category}</Badge>
  )},
  { accessorKey: 'fileSize', header: 'Size', cell: ({ row }) => {
    const size = row.original.fileSize || 0
    if (size === 0) return '—'
    return `${(size / 1024).toFixed(1)} KB`
  }},
  { accessorKey: 'createdAt', header: 'Uploaded', cell: ({ row }) => {
    try { return format(new Date(row.original.createdAt), 'MMM dd, yyyy') } catch { return '—' }
  }},
  { id: 'actions', header: 'Actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => onView(row.original.id)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(row.original.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )}
]

export default function DocumentsList() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('receipt')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents', { page }],
    queryFn: () => documentService.list({ page, limit: 25 }).then(r => r.data),
    keepPreviousData: true
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, category }) => documentService.upload(file, category),
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      qc.invalidateQueries({ queryKey: ['documents'] })
      setFile(null)
      setOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload document')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => documentService.delete(id),
    onSuccess: () => {
      toast.success('Document deleted successfully')
      qc.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete document')
  })

  const handleView = async (id) => {
    try {
      const res = await documentService.getSignedUrl(id)
      window.open(res.data.data.url, '_blank')
    } catch {
      toast.error('Failed to get document view URL')
    }
  }

  const docs = data?.data || []
  const total = data?.total || 0

  return (
    <>
      <Helmet><title>Document Library — MSME BMS</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Document Library</h1>
            <p className="text-muted-foreground text-sm mt-1">Upload and store sales receipts, supplier invoices, contracts, and files</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Stored Documents</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns(
                id => handleView(id),
                id => { if (confirm('Delete this document permanently?')) deleteMutation.mutate(id) }
              )}
              data={docs}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={25}
              onPageChange={setPage}
              emptyMessage="No documents uploaded yet"
            />
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (file) uploadMutation.mutate({ file, category }) }} className="space-y-4">
              <div className="space-y-2">
                <Label>Document Category *</Label>
                <Select defaultValue="receipt" onValueChange={v => setCategory(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Sales Receipt</SelectItem>
                    <SelectItem value="bill">Supplier Bill</SelectItem>
                    <SelectItem value="contract">Employee Contract</SelectItem>
                    <SelectItem value="other">Other Attachment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select File *</Label>
                <Input type="file" onChange={e => setFile(e.target.files[0])} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={uploadMutation.isPending || !file}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
