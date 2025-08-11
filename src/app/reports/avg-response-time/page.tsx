export default function AvgResponseTimeReportPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Avg Response Time</h1>
      </div>
      <div className="p-6">
        <div className="h-64 border rounded flex items-center justify-center text-gray-400">
          Chart placeholder: Average response time
        </div>
      </div>
    </div>
  )
}
