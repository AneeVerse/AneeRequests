"use client"
import { useState } from "react"

export default function TestCleanupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const fixPriorities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fix-request-priorities', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">Test Priority Cleanup</h1>
        
        <button
          onClick={fixPriorities}
          disabled={loading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Fixing...' : 'Fix Request Priorities'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

