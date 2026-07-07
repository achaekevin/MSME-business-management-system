import { useState, useRef } from 'react'
import { Search, X, Upload, Calendar, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/utils'
import { useOutsideClick, useDebounce } from '@/hooks'

// Search Input
export function SearchInput({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// Multi Select
export function MultiSelect({ options, value = [], onChange, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOutsideClick(() => setIsOpen(false))

  const toggle = (val) => {
    if (value.includes(val)) onChange(value.filter(v => v !== val))
    else onChange([...value, val])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-background"
      >
        <span className="truncate text-left">
          {value.length === 0 ? <span className="text-muted-foreground">{placeholder}</span> : `${value.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <div className={cn('h-4 w-4 rounded border flex items-center justify-center flex-shrink-0', value.includes(opt.value) ? 'bg-primary border-primary' : 'border-input')}>
                {value.includes(opt.value) && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// File Upload
export function FileUpload({ onUpload, accept, multiple = false, maxSizeMB = 10, className }) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(f => f.size <= maxSizeMB * 1024 * 1024)
    setFiles(multiple ? [...files, ...validFiles] : validFiles.slice(0, 1))
    onUpload?.(multiple ? validFiles : validFiles[0])
  }

  return (
    <div className={className}>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground mt-1">Max file size: {maxSizeMB}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
              <span className="truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Date Picker (simple native fallback styled)
export function DatePicker({ value, onChange, placeholder, className }) {
  return (
    <div className={cn('relative', className)}>
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
