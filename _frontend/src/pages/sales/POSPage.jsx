import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  X, 
  CreditCard, 
  Banknote, 
  User, 
  Smartphone, 
  Barcode, 
  CheckCircle2, 
  Package, 
  RotateCcw 
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { productService, salesService } from '@/services'
import { useCartStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input, Badge, Spinner } from '@/components/ui'
import { formatCurrency } from '@/utils'
import { useSearch } from '@/hooks'

function ProductGrid({ onAdd }) {
  const { search, setSearch, debouncedSearch } = useSearch()
  const { data, isLoading } = useQuery({
    queryKey: ['products-pos', debouncedSearch],
    queryFn: () => productService.list({ search: debouncedSearch, limit: 50 })
  })
  const products = data?.data?.data || []

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Scan barcode or search catalog items..." 
            className="pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground h-10 rounded-xl" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-10 w-10 mb-2 opacity-30 text-muted-foreground" />
            <p className="text-sm">No catalog products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => onAdd(product)}
                className="p-3.5 border border-border rounded-xl bg-card text-left hover:border-primary/50 hover:bg-accent/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video mb-2.5 bg-muted/60 border border-border rounded-lg flex items-center justify-center text-muted-foreground overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                </div>
                
                <div className="mt-3 pt-2 border-t border-border/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{formatCurrency(product.sellingPrice)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${product.currentStock <= product.reorderPoint ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {product.currentStock} in stock
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CartPanel({ onCheckout, isSubmitting }) {
  const { items, customer, discount, discountType, addItem, removeItem, updateItem, setDiscount, clearCart, getSubtotal, getTotal } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [customerPhone, setCustomerPhone] = useState('')
  const [amountTendered, setAmountTendered] = useState('')

  const subtotal = getSubtotal()
  const vat = Math.round(subtotal * 0.16)
  const total = getTotal()
  const change = amountTendered ? Math.max(0, Number(amountTendered) - total) : 0

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Current Order (ODR-4519)</h2>
            <p className="text-[11px] text-muted-foreground">{items.length} items in cart</p>
          </div>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive h-8 px-2">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Click products from the catalog to add them</p>
            </div>
          ) : (
            items.map(item => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{item.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.sku}</p>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="flex items-center border border-border bg-background rounded-lg">
                    <button onClick={() => updateItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2.5 py-0.5 text-xs font-bold text-foreground min-w-[28px] text-center">{item.quantity}</span>
                    <button onClick={() => updateItem(item.productId, { quantity: item.quantity + 1 })} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground font-mono">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Order Summary & Totals */}
      <div className="p-4 border-t border-border bg-muted/20 space-y-2 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono text-foreground">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>VAT (16.00%)</span>
          <span className="font-mono text-foreground">{formatCurrency(vat)}</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between text-sm font-bold text-foreground">
          <span>Total Amount</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Selection & Pay Button */}
      <div className="p-4 border-t border-border bg-muted/30 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground mb-1">Payment Method:</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setPaymentMethod('mpesa')}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
              paymentMethod === 'mpesa' 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' 
                : 'bg-background border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>M-PESA</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
              paymentMethod === 'card' 
                ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                : 'bg-background border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
              paymentMethod === 'cash' 
                ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                : 'bg-background border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash</span>
          </button>
        </div>

        {paymentMethod === 'mpesa' && (
          <Input
            placeholder="Customer Phone / M-Pesa ID (e.g. 0712345678)"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="text-xs bg-background border-input text-foreground placeholder:text-muted-foreground h-9 rounded-xl"
          />
        )}

        {paymentMethod === 'cash' && (
          <div className="space-y-1">
            <Input
              type="number"
              placeholder="Amount tendered"
              value={amountTendered}
              onChange={e => setAmountTendered(e.target.value)}
              className="text-xs bg-background border-input text-foreground placeholder:text-muted-foreground h-9 rounded-xl"
            />
            {amountTendered && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Change: {formatCurrency(change)}</p>}
          </div>
        )}

        <Button
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20"
          disabled={items.length === 0 || isSubmitting}
          onClick={() => onCheckout({ paymentMethod, customerPhone, amountTendered: Number(amountTendered) || total, change })}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Pay {formatCurrency(total)}
        </Button>
      </div>
    </div>
  )
}

export default function POSPage() {
  const { addItem, items, clearCart, customer, getTotal } = useCartStore()

  const checkoutMutation = useMutation({
    mutationFn: (paymentData) => salesService.create({
      customerId: customer?.id,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, tax: i.tax })),
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.amountTendered || getTotal()
    }),
    onSuccess: () => {
      clearCart()
      toast.success('Sale processed & receipt generated!')
    },
    onError: (err) => toast.error(err.message || 'Sale processing failed')
  })

  return (
    <>
      <Helmet><title>Point of Sale — MSME BMS</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Point of Sale Terminal</h1>
            <p className="text-xs text-muted-foreground">Cashier Till Session #01 · Fast Checkout & Barcode Scanner</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-190px)] min-h-[600px]">
          {/* Products Grid */}
          <div className="lg:col-span-7 xl:col-span-8 h-full">
            <ProductGrid onAdd={addItem} />
          </div>

          {/* Checkout Cart */}
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <CartPanel onCheckout={checkoutMutation.mutate} isSubmitting={checkoutMutation.isPending} />
          </div>
        </div>
      </div>
    </>
  )
}
