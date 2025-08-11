"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ReportsIndexPage() {
  const sections = [
    { name: 'Requests', href: '/reports/requests' },
    { name: 'Reviews', href: '/reports/reviews' },
    { name: 'Avg Response Time', href: '/reports/avg-response-time' },
    { name: 'Timesheets', href: '/reports/timesheets' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 max-w-5xl">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="p-6 border rounded hover:bg-gray-50">
            <div className="text-lg font-medium text-gray-900">{s.name}</div>
            <div className="text-sm text-gray-500">View {s.name.toLowerCase()} report</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
