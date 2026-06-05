"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAssignmentStore, Assignment } from "@/store/assignmentStore"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function AssignmentsPage() {
  const router = useRouter()
  useWebSocket()
  const { assignments, loadingList, fetchAssignments, deleteAssignment } =
    useAssignmentStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpenMenu(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = assignments.filter((a) => {
    const matchesSearch = `${a.subject} ${a.topic}`.toLowerCase().includes(search.toLowerCase())
    if (statusFilter === "All") return matchesSearch
    const s = a.status || "completed"
    return matchesSearch && s === statusFilter.toLowerCase()
  })

  const fmtDate = (d?: string) =>
    d
      ? new Date(d)
          .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
          .replace(/\//g, "-")
      : "—"

  return (
    <div
      className="bg-[#CECECE] md:bg-transparent min-h-screen"
      style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif" }}
    >

      {/* ── Mobile sub-header (back + title) ── */}
      <div className="md:hidden flex items-center px-5 py-4 bg-[#CECECE]">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#E3E3E3] flex items-center justify-center flex-shrink-0"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1C1C1E" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M4 12L10 6M4 12L10 18"/>
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[17px] font-[800] text-[#1C1C1E] mr-10 tracking-tight"
          style={{ fontFamily: "var(--font-jakarta), Plus Jakarta Sans, sans-serif" }}>
          Assignments
        </h1>
      </div>

      {/* ── Desktop breadcrumb: ← 🏠 Assignment ── */}
      <div className="hidden md:flex items-center justify-between px-8 pt-6 pb-1 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center hover:bg-white/40 transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          {/* Grid/Home icon */}
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
          </svg>
          <span className="text-[14px] font-medium text-[#6B7280]">Assignment</span>
        </div>

        {/* Bell + John Doe — Figma top right */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-white/50 transition-colors">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"/>
          </button>
          <div className="flex items-center gap-2.5 bg-white pl-1.5 pr-4 py-1.5 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#FFE5D9] flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ashish&backgroundColor=FFE5D9" alt="Avatar" className="w-full h-full object-cover"/>
            </div>
            <span className="text-[14px] font-bold text-[#1C1C1E]">Shaaz Alfaiz</span>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Desktop header with green dot + title + subtitle ── */}
      <div className="hidden md:block px-8 pt-4 pb-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
          <h1 className="text-[28px] font-extrabold text-[#1C1C1E] tracking-tight">Assignments</h1>
        </div>
        <p className="text-[14px] text-[#9CA3AF] font-medium ml-[18px]">
          Manage and create assignments for your classes.
        </p>
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto pb-36">

        {/* ── Filter + Search row ── */}
        {assignments.length > 0 && (
          <div className="flex items-center bg-white rounded-2xl p-2 mb-6 mt-3 shadow-sm">
            {/* Filter pill — natural look from screenshot */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              >
                <option value="All">All statuses</option>
                <option value="Completed">Completed</option>
                <option value="Generating">Generating</option>
                <option value="Failed">Failed</option>
              </select>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-transparent
                text-[15px] font-medium text-[#9CA3AF] flex-shrink-0 transition-colors hover:text-gray-600">
                {/* Funnel icon exact from screenshot (hollow outline) */}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                {statusFilter === "All" ? "Filter" : statusFilter}
              </button>
            </div>

            {/* Search bar — wrapped in pill border */}
            <div className="flex-1 relative ml-2">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
              </svg>
              <input
                className="w-full pl-[42px] pr-5 py-2.5 bg-white rounded-full
                  text-[15px] font-medium text-gray-700 outline-none border border-gray-200
                  focus:border-gray-300 focus:ring-1 focus:ring-gray-200 placeholder-[#9CA3AF] transition-all"
                placeholder="Search Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {assignments.length === 0 && !loadingList ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[55vh]">
            <svg width="300" height="285" viewBox="0 0 220 210" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background circle */}
              <circle cx="105" cy="110" r="85" fill="#EFEFEF"/>
              {/* Document */}
              <rect x="68" y="42" width="74" height="96" rx="8" fill="white" filter="url(#shadow)"/>
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08"/>
                </filter>
              </defs>
              {/* Document lines */}
              <rect x="80" y="60" width="50" height="7" rx="3.5" fill="#1C1C2E"/>
              <rect x="80" y="78" width="50" height="5" rx="2.5" fill="#D1D5DB"/>
              <rect x="80" y="90" width="50" height="5" rx="2.5" fill="#D1D5DB"/>
              <rect x="80" y="102" width="50" height="5" rx="2.5" fill="#D1D5DB"/>
              <rect x="80" y="114" width="36" height="5" rx="2.5" fill="#D1D5DB"/>
              {/* Magnifying glass circle */}
              <circle cx="122" cy="133" r="30" fill="#E8E8F0" stroke="#C9C9DC" strokeWidth="2"/>
              <circle cx="122" cy="133" r="26" fill="#F4F4FB"/>
              {/* Red X inside magnifier */}
              <path d="M111 122L133 144" stroke="#EF4444" strokeWidth="7" strokeLinecap="round"/>
              <path d="M133 122L111 144" stroke="#EF4444" strokeWidth="7" strokeLinecap="round"/>
              {/* Magnifier handle */}
              <path d="M144 155L158 169" stroke="#9CA3AF" strokeWidth="8" strokeLinecap="round"/>
              {/* Decorative: curved line left */}
              <path d="M30 75 Q20 95 35 115" stroke="#1C2B4B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* Decorative: sparkle bottom-left */}
              <path d="M42 162 L44 155 L46 162 L53 164 L46 166 L44 173 L42 166 L35 164 Z" fill="#1C6B8A"/>
              {/* Decorative: pill tags top-right */}
              <rect x="162" y="48" width="8" height="8" rx="4" fill="#9CA3AF"/>
              <rect x="174" y="48" width="28" height="8" rx="4" fill="#D1D5DB"/>
              {/* Decorative: blue dot right */}
              <circle cx="192" cy="130" r="6" fill="#1C6B8A"/>
            </svg>
            <h2 className="text-[18px] font-extrabold text-gray-900 mt-2 mb-2">No assignments yet</h2>
            <p className="text-[13px] text-gray-400 text-center max-w-xs leading-relaxed mb-8">
              Create your first assignment to start collecting and grading student submissions.
            </p>
          </div>
        ) : (
          /* ── Assignment cards — 2-col grid on desktop ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" ref={menuRef}>
            {filtered.map((a) => (
              <AssignmentCard
                key={a._id}
                assignment={a}
                isOpen={openMenu === a._id}
                onToggleMenu={() => setOpenMenu(openMenu === a._id ? null : a._id)}
                onView={() => { setOpenMenu(null); router.push(`/assignments/${a._id}`) }}
                onDelete={() => { setOpenMenu(null); deleteAssignment(a._id) }}
                fmtDate={fmtDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile bottom blur fade overlay ── */}
      <div
        className="md:hidden fixed bottom-[68px] left-0 right-0 h-24 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(206,206,206,0.95) 0%, rgba(206,206,206,0) 100%)",
        }}
      />

      {/* ── Mobile FAB: white circle with orange + ── */}
      <Link
        href="/assignments/create"
        className="md:hidden fixed z-[60] w-12 h-12 rounded-full bg-white
          flex items-center justify-center active:scale-95 transition-all"
        style={{ bottom: "105px", right: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M12 4v16M4 12h16" stroke="#E4703D" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </Link>

      {/* ── Desktop bottom blur fade overlay ── */}
      <div
        className="hidden md:block fixed bottom-0 left-[350px] right-0 h-32 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(240,240,240,1) 0%, rgba(240,240,240,0) 100%)",
        }}
      />

      {/* ── Desktop FAB: "Create Assignment" dark pill — centered in content area ── */}
      <div className="hidden md:flex fixed bottom-10 left-[350px] right-0 z-30 justify-center pointer-events-none">
        <Link
          href="/assignments/create"
          className="pointer-events-auto flex items-center gap-2.5 px-6 py-3 bg-[#1A1A1A] text-white rounded-full
            text-[14px] font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.15)]
            hover:bg-[#000000] active:scale-95 transition-all"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16"/>
          </svg>
          Create Assignment
        </Link>
      </div>
    </div>
  )
}

function AssignmentCard({
  assignment: a, isOpen, onToggleMenu, onView, onDelete, fmtDate,
}: {
  assignment: Assignment
  isOpen: boolean
  onToggleMenu: () => void
  onView: () => void
  onDelete: () => void
  fmtDate: (d?: string) => string
}) {
  return (
    <div 
      onClick={onView}
      className="bg-white rounded-[24px] px-6 py-5 relative shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow group"
    >
      {/* Top row: title + 3-dot */}
      <div className="flex items-start justify-between mb-6">
        <h3
          className="text-[18px] font-[800] text-[#1C1C1E] tracking-tight pr-6 group-hover:text-[#E4703D] transition-colors"
          style={{ fontFamily: "var(--font-jakarta), Plus Jakarta Sans, sans-serif" }}
        >
          {a.subject ? `${a.subject} on ${a.topic}` : a.topic || "Quiz on Electricity"}
        </h3>
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
            className="p-1 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {/* Vertical 3-dot */}
            <svg width="24" height="24" fill="#1C1C1E" viewBox="0 0 24 24">
              <circle cx="12" cy="5"  r="1.8"/>
              <circle cx="12" cy="12" r="1.8"/>
              <circle cx="12" cy="19" r="1.8"/>
            </svg>
          </button>
          {isOpen && (
            <div 
              className="absolute right-0 top-10 bg-white border border-gray-100
                rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 py-1.5 min-w-[160px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={(e) => { e.stopPropagation(); onView(); }}
                className="w-full text-left px-4 py-2 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">
                View Assignment
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-full text-left px-4 py-2 text-[14px] font-semibold text-[#EF4444] hover:bg-red-50">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status badge if pending */}
      {a.status && a.status !== "completed" && (
        <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3
          ${a.status === "failed" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
          {a.status === "failed" ? "Failed" : "Generating..."}
        </span>
      )}

      {/* Bottom: Assigned on + Due — Figma exact spacing */}
      <div className="flex items-center justify-between text-[13px] text-[#9CA3AF] font-medium">
        <span>
          <span className="font-bold text-[#1C1C1E]">Assigned on</span>
          <span> : {fmtDate(a.createdAt)}</span>
        </span>
        {a.dueDate && (
          <span>
            <span className="font-bold text-[#1C1C1E]">Due</span>
            <span> : {fmtDate(a.dueDate)}</span>
          </span>
        )}
      </div>
    </div>
  )
}