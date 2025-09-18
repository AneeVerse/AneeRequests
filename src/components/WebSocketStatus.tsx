"use client"
import { useWebSocket } from '@/lib/hooks/useWebSocket'

interface WebSocketStatusProps {
  requestId: string
}

export default function WebSocketStatus({ requestId }: WebSocketStatusProps) {
  const { isConnected } = useWebSocket(requestId)

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm text-gray-500">
        {isConnected ? 'Live Chat' : 'Offline'}
      </span>
    </div>
  )
}
