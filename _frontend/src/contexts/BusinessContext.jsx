import { createContext, useContext, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useBusinessStore } from '@/store'
import { businessService } from '@/services'

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
  const { isAuthenticated } = useAuthStore()
  const { business, setBusiness, currentBranch, setCurrentBranch, setBranches, branches } = useBusinessStore()

  useQuery({
    queryKey: ['business'],
    queryFn: async () => {
      const res = await businessService.get()
      setBusiness(res.data)
      return res.data
    },
    enabled: isAuthenticated && !business,
    staleTime: 1000 * 60 * 10
  })

  useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await businessService.getBranches()
      setBranches(res.data)
      if (!currentBranch && res.data?.length > 0) {
        setCurrentBranch(res.data.find(b => b.isHeadquarters) || res.data[0])
      }
      return res.data
    },
    enabled: isAuthenticated && branches.length === 0,
    staleTime: 1000 * 60 * 10
  })

  return (
    <BusinessContext.Provider value={{ business, currentBranch, branches }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider')
  return ctx
}
