import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download } from 'lucide-react'
import { cn } from '@/utils'
import { Button, Input, Skeleton } from '@/components/ui'
import { PAGINATION_LIMITS } from '@/constants'

export function DataTable({
  columns,
  data = [],
  isLoading = false,
  total = 0,
  page = 1,
  limit = 25,
  onPageChange,
  onLimitChange,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  actions,
  emptyMessage = 'No data found',
  className
}) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: onSearch ? undefined : globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: onSearch ? getCoreRowModel() : getFilteredRowModel(),
    manualPagination: !!onPageChange,
    manualFiltering: !!onSearch,
    pageCount: Math.ceil(total / limit)
  })

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (e) => {
    const val = e.target.value
    if (onSearch) {
      onSearch(val)
    } else {
      setGlobalFilter(val)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          {searchable && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9"
                onChange={handleSearch}
              />
            </div>
          )}
          {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left font-medium text-muted-foreground',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(onPageChange || total > limit) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={e => onLimitChange?.(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              {PAGINATION_LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2">
              {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={page === 1}>«</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page === 1}>‹</Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[32px]"
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>›</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={page >= totalPages}>»</Button>
          </div>
        </div>
      )}
    </div>
  )
}
