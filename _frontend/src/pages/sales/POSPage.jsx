import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, CreditCard, DollarSign, User } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { productService, salesService, customerService } from '@/services'
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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products or scan barcode..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => onAdd(product)}
                className="p-3 border rounded-lg text-left hover:border-primary hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <div className="aspect-square mb-2 bg-muted rounded flex items-center justify-center text-2xl">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover rounded" />
                  ) : '📦'}
                </div>
                <p className="text-xs font-medium leading-tight line-clamp-2">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
                <p className="text-sm font-bold text-primary mt-1">{formatCurrency(product.sellingPrice)}</p>
                <p className={`text-xs ${product.currentStock <= product.reorderPoint ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Stock: {product.currentStock}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CartPanel({ onCheckout }) {
  const { items, customer, discount, discountType, addItem, removeItem, updateItem, setCustomer, setDiscount, clearCart, getSubtotal, getTotal } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountTendered, setAmountTendered] = useState('')
  const subtotal = getSubtotal()
  const total = getTotal()
  const change = amountTendered ? Math.max(0, Number(amountTendered) - total) : 0

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Cart ({items.length})</h2>
        {items.length > 0 && <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-7 px-2"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>

      {/* Customer */}
      <div className="p-3 border-b">
        <button className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-2 rounded border border-dashed hover:border-primary transition-colors">
          <User className="h-4 w-4" />
          {customer ? customer.name : 'Walk-in customer (click to assign)'}
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            items.map(item => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-muted/30 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1 leading-tight">{item.name}</p>
                  <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => updateItem(item.productId, { quantity: Math.max(0.5, item.quantity - 1) })} className="px-2 py-1 hover:bg-muted rounded-l-md">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">{item.quantity}</span>
                    <button onClick={() => updateItem(item.productId, { quantity: item.quantity + 1 })} className="px-2 py-1 hover:bg-muted rounded-r-md">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Discount */}
      {items.length > 0 && (
        <div className="p-3 border-t border-b">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Discount"
              value={discount || ''}
              onChange={e => setDiscount(Number(e.target.value), discountType)}
              className="flex-1 h-8 text-sm"
            />
            <select
              value={discountType}
              onChange={e => setDiscount(discount, e.target.value)}
              className="border rounded-md px-2 text-sm bg-background h-8"
            >
              <option value="amount">KSh</option>
              <option value="percent">%</option>
            </select>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 border-t space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span>-{formatCurrency(discountType === 'percent' ? subtotal * (discount / 100) : discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-1">
          {['cash', 'card', 'mobile_money'].map(m => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`py-2 text-xs rounded-md border transition-colors ${paymentMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
            >
              {m === 'cash' ? '💵 Cash' : m === 'card' ? '💳 Card' : '📱 Mobile'}
            </button>
          ))}
        </div>
        {paymentMethod === 'cash' && (
          <div>
            <Input
              type="number"
              placeholder="Amount tendered"
              value={amountTendered}
              onChange={e => setAmountTendered(e.target.value)}
              className="text-sm"
            />
            {amountTendered && <p className="text-sm mt-1 text-green-600 font-medium">Change: {formatCurrency(change)}</p>}
          </div>
        )}
        <Button
          className="w-full"
          disabled={items.length === 0}
          onClick={() => onCheckout({ paymentMethod, amountTendered: Number(amountTendered), change })}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Charge {formatCurrency(total)}
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
      toast.success('Sale completed!')
    },
    onError: (err) => toast.error(err.message)
  })

  return (
    <>
      <Helmet><title>Point of Sale — MSME BMS</title></Helmet>
      <div className="fixed inset-0 top-16 flex bg-background">
        {/* Products */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ProductGrid onAdd={addItem} />
        </div>
        {/* Cart */}
        <div className="w-80 xl:w-96 flex-shrink-0">
          <CartPanel onCheckout={checkoutMutation.mutate} />
        </div>
      </div>
    </>
  )
}
