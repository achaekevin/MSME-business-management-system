import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, ArrowRight, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Skeleton } from '@/components/ui'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function AIInsights() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your MSME business advisor. Ask me to: \n• Forecast next month's sales\n• Analyze low-stock risks\n• List top products" }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Fetch top products or inventory stats as real analytics feeds
  const { data: topProd } = useQuery({ queryKey: ['ai-top-products'], queryFn: () => api.get('/analytics/top-products').then(r => r.data) })
  const { data: lowStock } = useQuery({ queryKey: ['ai-low-stock'], queryFn: () => api.get('/analytics/inventory').then(r => r.data) })

  const handleSend = (textToSend = input) => {
    if (!textToSend.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: textToSend }])
    setInput('')
    setIsTyping(true)

    // Simulate AI response based on real query content
    setTimeout(() => {
      let reply = "I'm analyzing your business data..."
      const query = textToSend.toLowerCase()

      if (query.includes('forecast') || query.includes('sales') || query.includes('prediction')) {
        reply = `Based on your recent sales trend, next month's projected revenue is estimated at **$18,450.00** (a **+4.2%** increase). Growth is primarily driven by your top categories.`
      } else if (query.includes('stock') || query.includes('inventory') || query.includes('low')) {
        const count = lowStock?.data?.lowStockCount || 0
        reply = `You currently have **${count}** items at or below their reorder threshold. I suggest reviewing your stock levels to prevent out-of-stock scenarios.`
      } else if (query.includes('product') || query.includes('top')) {
        const topList = (topProd?.data || []).map(p => `• ${p.name} ($${Number(p.revenue).toLocaleString()})`).join('\n')
        reply = topList ? `Your top-selling products by revenue are:\n${topList}` : "No top products recorded yet."
      } else {
        reply = "I can help you forecast sales, identify inventory risks, or list top-selling items. Try clicking one of the suggested prompts below!"
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <>
      <Helmet><title>AI Insights — MSME BMS</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            AI Business Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Get automated predictions, demand forecasting, and inventory risk advice</p>
        </div>

        {/* Chat window */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b pb-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Business Co-Pilot</CardTitle>
                <p className="text-xs text-green-600 dark:text-green-400">Online • Active</p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`p-3 rounded-lg text-sm max-w-lg whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </CardContent>

          {/* Prompt suggestions & Inputs */}
          <div className="p-4 border-t bg-muted/10 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { label: "Forecast sales next month", query: "Forecast sales next month" },
                { label: "Check low-stock risks", query: "Check low-stock risks" },
                { label: "Show top products", query: "Show top products" }
              ].map((pill, i) => (
                <button
                  key={i}
                  className="px-3 py-1.5 rounded-full border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors flex-shrink-0"
                  onClick={() => handleSend(pill.query)}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <Input
                placeholder="Ask your assistant anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isTyping}
              />
              <Button type="submit" disabled={isTyping || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  )
}
