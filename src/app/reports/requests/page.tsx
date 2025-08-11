"use client"
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Aggregates {
  byStatus: { label: string; value: number }[]
  byService: { label: string; value: number }[]
  dailyCounts: { date: string; value: number }[]
}

export default function RequestsReportPage() {
  const [data, setData] = useState<Aggregates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reports/requests')
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Requests Report</h1>
        <div className="relative">
          <button className="px-3 py-2 text-sm border rounded text-gray-600 bg-white">09 Jul - 09 Aug</button>
          <ChevronDown size={14} className="absolute right-2 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Line Chart Placeholder */}
        <div className="h-64 border rounded flex items-center justify-center text-gray-400">
          {loading ? 'Loading chart...' : 'Requests over time (chart placeholder)'}
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 border rounded flex items-center justify-center text-gray-400">
            {loading ? 'Loading...' : 'Requests per status (donut placeholder)'}
          </div>
          <div className="h-80 border rounded flex items-center justify-center text-gray-400">
            {loading ? 'Loading...' : 'Requests per service (donut placeholder)'}
          </div>
        </div>
      </div>
    </div>
  )
}
