"use client"

import { useRouter } from "next/navigation"

interface HeaderProps {
  title?: string
  showBack?: boolean
}

export default function Header({ title = "Assignment", showBack = false }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="h-[72px] bg-transparent flex items-center px-8 sticky top-0 z-30 justify-between">
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        
        {!showBack && (
          <div className="flex items-center gap-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
              <rect x="4" y="4" width="6" height="6" rx="1.5" />
              <rect x="14" y="4" width="6" height="6" rx="1.5" />
              <rect x="4" y="14" width="6" height="6" rx="1.5" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" />
            </svg>
            <span className="text-[16px] font-semibold text-gray-400">{title}</span>
          </div>
        )}
        
        {showBack && (
          <span className="text-[16px] font-bold text-gray-900 ml-2">{title}</span>
        )}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <button className="relative p-2 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"/>
        </button>
        
        <div className="flex items-center gap-3 bg-white pl-1.5 pr-4 py-1.5 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#FFE5D9] flex items-center justify-center overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Ashish&backgroundColor=FFE5D9`} alt="Avatar" className="w-full h-full object-cover"/>
          </div>
          <span className="text-[14px] font-bold text-gray-800">Shaaz Alfaiz</span>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
    </header>
  )
}