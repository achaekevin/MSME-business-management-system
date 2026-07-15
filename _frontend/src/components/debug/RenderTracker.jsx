import { useEffect, useRef } from 'react'

export function RenderTracker({ name = 'Component' }) {
  const renderCount = useRef(0)
  const lastRender = useRef(Date.now())
  
  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - lastRender.current
    lastRender.current = now
    
    if (renderCount.current > 10) {
      console.warn(`⚠️ ${name} rendered ${renderCount.current} times (${timeSinceLastRender}ms since last)`)
    } else {
      console.log(`🔄 ${name} rendered ${renderCount.current} times (${timeSinceLastRender}ms since last)`)
    }
  })
  
  return null
}
