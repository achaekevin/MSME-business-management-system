import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', '2xl': 'max-w-4xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className={cn('bg-background rounded-lg shadow-xl w-full pointer-events-auto max-h-[90vh] flex flex-col', sizeClasses[size])}
            >
              {title && (
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h2 className="font-bold text-lg">{title}</h2>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded p-1 hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="p-4 overflow-y-auto flex-1">{children}</div>
              {footer && <div className="p-4 border-t flex-shrink-0">{footer}</div>}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, variant = 'default' }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="text-center py-2">
        {variant === 'destructive' && (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        )}
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  )
}

// Drawer (slide-in panel)
export function Drawer({ isOpen, onClose, title, children, side = 'right', width = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className={cn('fixed top-0 bottom-0 z-50 bg-background shadow-xl w-full flex flex-col', width, side === 'right' ? 'right-0' : 'left-0')}
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <h2 className="font-bold text-lg">{title}</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="p-4 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}
