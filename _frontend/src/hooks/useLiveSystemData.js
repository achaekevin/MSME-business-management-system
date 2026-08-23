import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { 
  dashboardService, 
  salesService, 
  inventoryService, 
  productService,
  accountingService,
  purchaseService,
  employeeService,
  businessService
} from '@/services'
import { initSocket, subscribeToSales, subscribeToInventory } from '@/services/socket'

export function useLiveSystemData() {
  const { isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  // Default baseline data
  const [stats, setStats] = useState({
    todayRevenue: 248500,
    revenueGrowth: '+14.2%',
    activeTills: '4 / 4 Online',
    lowStockCount: 3,
    netMargin: '28.4%',
    mtdGross: 842000,
    dailyBars: [
      { day: 'Mon', h1: '55%', h2: '35%' },
      { day: 'Tue', h1: '70%', h2: '50%' },
      { day: 'Wed', h1: '60%', h2: '45%' },
      { day: 'Thu', h1: '85%', h2: '65%' },
      { day: 'Fri', h1: '95%', h2: '80%' },
      { day: 'Sat', h1: '100%', h2: '90%' },
      { day: 'Sun', h1: '75%', h2: '60%' }
    ],
    recentTransactions: [
      { id: 'TX-9042', text: 'POS Till 01 Checkout (M-Pesa)', amount: '+KES 4,200', time: 'Just now', type: 'sale' },
      { id: 'GRN-108', text: 'Stock Bin Transfer (Main → Branch A)', amount: '120 Units', time: '2m ago', type: 'stock' },
      { id: 'INV-482', text: 'Corporate Tax Invoice Generated', amount: '+KES 48,000', time: '8m ago', type: 'sale' },
      { id: 'PAY-033', text: 'Supplier Bill Cleared (KCB Bank)', amount: '-KES 65,000', time: '14m ago', type: 'exp' }
    ],
    posProducts: [
      { name: 'Samsung 4K Smart Monitor 27"', qty: 1, price: '38,500', total: '38,500' },
      { name: 'Logitech MX Master 3S Wireless', qty: 2, price: '14,200', total: '28,400' },
      { name: 'USB-C Heavy Duty Braided Cable', qty: 3, price: '1,500', total: '4,500' }
    ],
    inventoryItems: [
      { sku: 'SKU-0914', name: 'Commercial Grade Cables 100m', stock: '48 Rolls', status: 'Healthy', val: 'KES 240,000' },
      { sku: 'SKU-2051', name: 'Industrial Breaker Switch 3-Phase', stock: '8 Units', status: 'Low Stock', val: 'KES 72,000' },
      { sku: 'SKU-8820', name: 'Copper Busbar Connectors (Pack)', stock: '350 Pcs', status: 'Healthy', val: 'KES 105,000' },
      { sku: 'SKU-3119', name: 'Digital Multi-Meter Pro Clamp', stock: '2 Units', status: 'Reorder Triggered', val: 'KES 18,000' }
    ],
    ledgerAccounts: [
      { acc: '1010 - Cash on Hand / Tills', dr: '348,000', cr: '—' },
      { acc: '1020 - KCB Commercial Operating A/C', dr: '1,450,000', cr: '—' },
      { acc: '1200 - Inventory Asset', dr: '2,890,000', cr: '—' },
      { acc: '2010 - Accounts Payable (Suppliers)', dr: '—', cr: '620,000' },
      { acc: '4010 - Sales Revenue (Commercial)', dr: '—', cr: '4,068,000' }
    ],
    purchaseOrders: [
      { id: 'PO-2026-089', vendor: 'East Africa Cables Ltd', status: 'GRN Received', items: '24 Items', total: 'KES 485,000' },
      { id: 'PO-2026-090', vendor: 'Simba Hardware Wholesale', status: 'Awaiting Delivery', items: '150 Items', total: 'KES 192,000' },
      { id: 'PO-2026-091', vendor: 'Crown Paints Kenya PLC', status: 'Approved', items: '80 Tins', total: 'KES 310,000' }
    ],
    employees: [
      { name: 'John Omwenga', role: 'Head Cashier', gross: '45,000', paye: '4,850', nssf: '2,160', net: '36,490' },
      { name: 'Faith Kemunto', role: 'Warehouse Supervisor', gross: '55,000', paye: '7,400', nssf: '2,160', net: '43,840' },
      { name: 'David Ochieng', role: 'Senior Accountant', gross: '70,000', paye: '11,750', nssf: '2,160', net: '54,290' }
    ]
  })

  const fetchLiveMetrics = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      
      // Fetch concurrently to gather system status
      const [
        dashboardRes,
        salesRes,
        lowStockRes,
        productsRes,
        purchasesRes,
        employeesRes,
        branchesRes
      ] = await Promise.allSettled([
        dashboardService.getRoleDashboard().catch(() => null),
        salesService.list({ limit: 5 }).catch(() => null),
        inventoryService.getLowStock().catch(() => null),
        productService.list({ limit: 5 }).catch(() => null),
        purchaseService.list({ limit: 4 }).catch(() => null),
        employeeService.list({ limit: 4 }).catch(() => null),
        businessService.getBranches().catch(() => null)
      ])

      const dData = dashboardRes.status === 'fulfilled' && dashboardRes.value?.data ? dashboardRes.value.data : null
      const sData = salesRes.status === 'fulfilled' && salesRes.value?.data ? salesRes.value.data : null
      const lsData = lowStockRes.status === 'fulfilled' && lowStockRes.value?.data ? lowStockRes.value.data : null
      const pData = productsRes.status === 'fulfilled' && productsRes.value?.data ? productsRes.value.data : null
      const poData = purchasesRes.status === 'fulfilled' && purchasesRes.value?.data ? purchasesRes.value.data : null
      const empData = employeesRes.status === 'fulfilled' && employeesRes.value?.data ? employeesRes.value.data : null
      const brData = branchesRes.status === 'fulfilled' && branchesRes.value?.data ? branchesRes.value.data : null

      setStats((prev) => {
        const next = { ...prev }

        // Live Revenue Calculation
        if (dData?.summary?.todaySales != null) {
          next.todayRevenue = Number(dData.summary.todaySales)
        } else if (sData?.data && Array.isArray(sData.data)) {
          const sumToday = sData.data.reduce((acc, s) => acc + Number(s.totalAmount || s.grandTotal || s.total || 0), 0)
          if (sumToday > 0) next.todayRevenue = sumToday
        }

        // Live Active Tills / Branches
        if (brData?.data && Array.isArray(brData.data) && brData.data.length > 0) {
          next.activeTills = `${brData.data.length} Branches Active`
        }

        // Low stock count
        if (lsData?.data) {
          next.lowStockCount = Array.isArray(lsData.data) ? lsData.data.length : (lsData.data.count || 0)
        }

        // Live Recent Transactions
        if (sData?.data && Array.isArray(sData.data) && sData.data.length > 0) {
          next.recentTransactions = sData.data.slice(0, 4).map((sale, idx) => ({
            id: sale.invoiceNumber || sale.receiptNumber || sale.saleNumber || `TX-${sale.id || idx}`,
            text: `POS Sale · ${sale.customer?.name || sale.customerName || 'Walk-in Customer'}`,
            amount: `+KES ${Number(sale.totalAmount || sale.grandTotal || sale.total || 0).toLocaleString()}`,
            time: 'Just now',
            type: 'sale'
          }))
        }

        // Live Products for POS mockup
        if (pData?.data && Array.isArray(pData.data) && pData.data.length > 0) {
          next.posProducts = pData.data.slice(0, 3).map((prod) => {
            const price = Number(prod.price || prod.sellingPrice || 1000)
            return {
              name: prod.name || 'Stock Product',
              qty: 1,
              price: price.toLocaleString(),
              total: price.toLocaleString()
            }
          })

          next.inventoryItems = pData.data.slice(0, 4).map((prod) => ({
            sku: prod.sku || prod.barcode || `SKU-${prod.id}`,
            name: prod.name || 'Warehouse Asset',
            stock: `${prod.stockQuantity || prod.quantity || 10} Units`,
            status: (prod.stockQuantity || 10) < 5 ? 'Low Stock' : 'Healthy',
            val: `KES ${(Number(prod.price || 1000) * Number(prod.stockQuantity || 10)).toLocaleString()}`
          }))
        }

        // Live Purchase Orders
        if (poData?.data && Array.isArray(poData.data) && poData.data.length > 0) {
          next.purchaseOrders = poData.data.slice(0, 3).map((po) => ({
            id: po.orderNumber || po.poNumber || `PO-${po.id}`,
            vendor: po.supplier?.name || po.supplierName || 'Primary Supplier',
            status: po.status || 'Approved',
            items: `${po.items?.length || 1} Items`,
            total: `KES ${Number(po.totalAmount || po.total || 0).toLocaleString()}`
          }))
        }

        // Live Employees
        if (empData?.data && Array.isArray(empData.data) && empData.data.length > 0) {
          next.employees = empData.data.slice(0, 3).map((emp) => {
            const gross = Number(emp.salary || emp.basicSalary || 45000)
            const paye = Math.round(gross * 0.12)
            const nssf = 2160
            const net = gross - paye - nssf
            return {
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Team Member',
              role: emp.position || emp.designation || emp.role || 'Staff',
              gross: gross.toLocaleString(),
              paye: paye.toLocaleString(),
              nssf: nssf.toLocaleString(),
              net: net.toLocaleString()
            }
          })
        }

        return next
      })
    } catch (err) {
      console.warn('Live data fetch fallback:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchLiveMetrics()

    // Real-time socket integration
    if (isAuthenticated) {
      initSocket()
      const unsubSales = subscribeToSales(() => {
        fetchLiveMetrics()
      })
      const unsubInv = subscribeToInventory(() => {
        fetchLiveMetrics()
      })

      // Periodic refresh every 15s to keep live data synced
      const interval = setInterval(fetchLiveMetrics, 15000)

      return () => {
        unsubSales?.()
        unsubInv?.()
        clearInterval(interval)
      }
    }
  }, [fetchLiveMetrics, isAuthenticated])

  return {
    stats,
    isLoading,
    refreshData: fetchLiveMetrics
  }
}
