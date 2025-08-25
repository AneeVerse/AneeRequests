"use client"
import { useState } from "react"

export default function TestLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleInputChange = (field: string, value: string) => {
    addLog(`Input change - ${field}: ${value}`)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    addLog(`Form submission - formData: ${JSON.stringify(formData)}`)
    
    if (!formData.email || !formData.password) {
      addLog("Error: Please fill in all fields")
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      addLog(`API Response: ${JSON.stringify(data)}`)

      if (!response.ok) {
        addLog(`Login failed: ${data.error}`)
      } else {
        addLog("Login successful!")
        // Clear form
        setFormData({ email: "", password: "" })
        const form = e.target as HTMLFormElement
        form.reset()
      }
    } catch (error) {
      addLog(`Network error: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login Test Page (Edge Debug)</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Login Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter password"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
              >
                Test Login
              </button>
            </form>
            
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">
                <strong>Current form data:</strong><br />
                Email: {formData.email || '(empty)'}<br />
                Password: {formData.password ? '***' : '(empty)'}
              </p>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Debug Logs</h2>
              <button
                onClick={clearLogs}
                className="text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-100 p-3 rounded h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs yet. Try interacting with the form.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Browser Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Browser Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong><br />
              <span className="text-gray-600">{navigator.userAgent}</span>
            </div>
            <div>
              <strong>Platform:</strong><br />
              <span className="text-gray-600">{navigator.platform}</span>
            </div>
            <div>
              <strong>Cookies Enabled:</strong><br />
              <span className="text-gray-600">{navigator.cookieEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <strong>Local Storage:</strong><br />
              <span className="text-gray-600">
                {typeof window !== 'undefined' && window.localStorage ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
