"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { label: "Home", href: "/home", icon: HomeIcon },
  { label: "My Groups", href: "/groups", icon: GroupsIcon },
  { label: "Assignments", href: "/assignments", icon: AssignmentsIcon },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: ToolkitIcon },
  { label: "My Library", href: "/library", icon: LibraryIcon },
  { label: "English Tutor", href: "/tutor", icon: TutorIcon },
]

const MOBILE_NAV = [
  { label: "Home", href: "/assignments", icon: HomeIcon },
  { label: "My Groups", href: "/groups", icon: GroupsIcon },
  { label: "Library", href: "/library", icon: LibraryIcon },
  { label: "AI Toolkit", href: "/toolkit", icon: ToolkitIcon },
]

export default function Sidebar() {
  const path = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [path])

  return (
    <>
      {/* -- DESKTOP SIDEBAR -- */}
      <aside
        className="hidden md:flex flex-col fixed top-6 bottom-6 left-6 w-[304px] rounded-2xl p-6 z-40"
        style={{
          backgroundColor: "#F8F8F8",
          boxShadow: "0 32px 48px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8 pl-2">
          <VedaAILogo />
        </div>

        {/* Create Button — Figma: #101010 bg, pill shape, no border/glow */}
        <div className="px-2 mb-10">
          <Link
            href="/assignments/create"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#101010" }}
          >
            {/* Sparkle icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
            </svg>
            Create Assignment
          </Link>
        </div>

        {/* Nav */}
        <div className="relative flex-1 overflow-hidden">
          <nav className="space-y-1 h-full overflow-y-auto">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = path.startsWith(href)
              const count = label === "Assignments" ? 10 : null
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium
                    transition-all duration-200
                    ${active ? "bg-[#EEEEEE] text-[#1C1C1E] font-semibold" : "text-[#6B7280] hover:bg-[#F0F0F0] hover:text-[#1C1C1E]"}`}
                >
                  <Icon active={active} />
                  <span>{label}</span>
                  {count !== null && (
                    <span className="ml-auto bg-[#E4703D] text-white text-[11px] font-bold
                      px-2.5 py-0.5 rounded-full min-w-[24px] text-center">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          {/* Bottom fade overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(to top, #F8F8F8 0%, transparent 100%)" }}
          />
        </div>

        {/* Bottom */}
        <div className="pb-2 mt-auto space-y-2">
          <Link href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium
              text-[#6B7280] hover:bg-[#F0F0F0] transition-colors">
            <SettingsIcon />
            <span>Settings</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EEEEEE] mt-2">
            <div className="w-9 h-9 rounded-full bg-[#FFE5D9] border-2 border-white flex items-center
              justify-center overflow-hidden flex-shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=School&backgroundColor=FFE5D9`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#1C1C1E] truncate">Delhi Public School</p>
              <p className="text-[11px] text-[#9CA3AF] truncate font-medium">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </aside>

      {/* -- MOBILE HEADER (Hidden on desktop) -- */}
      <header className="md:hidden fixed top-0 left-0 right-0 px-4 py-3 bg-[#CECECE] z-30">
        <div className="flex items-center justify-between bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] px-4 py-2.5">
          {/* Logo */}
          <VedaAILogo darkIcon />

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* Bell with red dot */}
            <div className="relative w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute top-1 right-1.5 w-2 h-2 bg-[#FF3B30] rounded-full border border-white" />
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=School&backgroundColor=b6e3f4" alt="User" className="w-full h-full object-cover" />
            </div>
            {/* Hamburger */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -mr-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1C1C1E" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* -- MOBILE SLIDE-OUT MENU -- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-[#F8F8F8] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <VedaAILogo />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV.map(({ label, href, icon: Icon }) => {
                const active = path.startsWith(href)
                const count = label === "Assignments" ? 10 : null
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium
                      transition-all duration-200
                      ${active ? "bg-[#EEEEEE] text-[#1C1C1E] font-semibold" : "text-[#6B7280]"}`}
                  >
                    <Icon active={active} />
                    <span>{label}</span>
                    {count !== null && (
                      <span className="ml-auto bg-[#E4703D] text-white text-[11px] font-bold
                        px-2.5 py-0.5 rounded-full min-w-[24px] text-center">
                        {count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 rounded-full bg-[#FFE5D9] border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=School&backgroundColor=FFE5D9" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#1C1C1E] truncate">Delhi Public School</p>
                  <p className="text-[12px] text-[#9CA3AF] truncate font-medium">Bokaro Steel City</p>
                </div>
              </div>
              <Link href="/settings" className="flex items-center justify-center gap-2 mt-4 py-2.5 w-full rounded-xl bg-gray-100 text-sm font-medium text-gray-700">
                <SettingsIcon /> Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* -- Mobile Bottom Nav (floating dark pill) — hidden when drawer is open -- */}
      {!isMobileMenuOpen && <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-[#1C1C1E] rounded-[28px] px-4 py-2 flex items-center justify-around"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
          {MOBILE_NAV.map(({ label, href, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5"
              >
                <div className={`p-1.5 rounded-2xl transition-all ${active ? "bg-white/15" : ""}`}>
                  <Icon active={active} darkBg />
                </div>
                <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-white/45"}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>}
    </>
  )
}

/* -- Icons -- */
function HomeIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const c = darkBg ? (active ? "white" : "rgba(255,255,255,0.4)") : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  )
}
function GroupsIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const opacity = darkBg ? (active ? 1 : 0.4) : (active ? 1 : 0.45)
  const fillColor = darkBg ? `rgba(255,255,255,${opacity})` : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M6.66675 1.66663C7.12699 1.66663 7.50008 2.03972 7.50008 2.49996H12.5001C12.5001 2.03972 12.8732 1.66663 13.3334 1.66663C13.7937 1.66663 14.1667 2.03972 14.1667 2.49996C16.4679 2.49996 18.3334 4.36544 18.3334 6.66663V14.1666C18.3334 16.4678 16.4679 18.3333 14.1667 18.3333H5.83341C3.53223 18.3333 1.66675 16.4678 1.66675 14.1666V6.66663C1.66675 4.36544 3.53223 2.49996 5.83341 2.49996C5.83341 2.03972 6.20651 1.66663 6.66675 1.66663ZM5.00008 8.33329C5.00008 7.87306 5.37318 7.49996 5.83341 7.49996H14.1667C14.627 7.49996 15.0001 7.87306 15.0001 8.33329C15.0001 8.79353 14.627 9.16663 14.1667 9.16663H5.83341C5.37318 9.16663 5.00008 8.79353 5.00008 8.33329ZM12.5001 14.1666C12.5001 13.7064 12.8732 13.3333 13.3334 13.3333H14.1667C14.627 13.3333 15.0001 13.7064 15.0001 14.1666C15.0001 14.6269 14.627 15 14.1667 15H13.3334C12.8732 15 12.5001 14.6269 12.5001 14.1666Z"
        fill={fillColor}
      />
    </svg>
  )
}
function AssignmentsIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const c = darkBg ? (active ? "white" : "rgba(255,255,255,0.4)") : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth={active ? "2.5" : "2"}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function ToolkitIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const baseOpacity = active ? 1 : 0.25
  const fillColor = darkBg ? "white" : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M4.63783 8.63783L6.18377 4H7.13246L8.6784 8.63783L13.3162 10.1838V11.1325L8.6784 12.6784L7.13246 17.3162H6.18377L4.63783 12.6784L0 11.1325V10.1838L4.63783 8.63783Z"
        fill={fillColor} fillOpacity={darkBg ? baseOpacity : 1}
      />
      <path fillRule="evenodd" clipRule="evenodd"
        d="M13.3878 2.38783L14.1838 0H15.1325L15.9284 2.38783L18.3162 3.18377V4.13246L15.9284 4.9284L15.1325 7.31623H14.1838L13.3878 4.9284L11 4.13246V3.18377L13.3878 2.38783Z"
        fill={fillColor} fillOpacity={darkBg ? baseOpacity : 1}
      />
    </svg>
  )
}
function LibraryIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const c = darkBg ? (active ? "white" : "rgba(255,255,255,0.4)") : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? "2.2" : "1.8"}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6M9 14h6" />
    </svg>
  )
}
function TutorIcon({ active, darkBg }: { active: boolean; darkBg?: boolean }) {
  const c = darkBg ? (active ? "white" : "rgba(255,255,255,0.4)") : (active ? "#1C1C1E" : "#9CA3AF")
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? "2.2" : "1.8"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4M8 23h8" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/* -- Exact Figma VedaAI Logo -- */
function VedaAILogo({ darkIcon }: { darkIcon?: boolean }) {
  return (
    <div
      className="flex items-center"
      style={{ gap: 12 }}
    >
      {/* Icon */}
      {darkIcon ? (
        <div
          className="rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, background: "#303030" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M13.5 16.5C13.5 16.5 13.9 17.5 14.3 17.6H9.8C8.9 17.6 8.1 17.1 7.8 16.1L5.2 8.3C5.2 8.3 5 7.4 4.6 7.2H9.3C10.2 7.2 10.8 7.5 11.2 8.8L13.5 16.5Z"
              fill="white"
            />
            <path fillRule="evenodd" clipRule="evenodd"
              d="M10.5 16.5C10.5 16.5 10.1 17.5 9.7 17.6H14.2C15.1 17.6 15.9 17.1 16.2 16.1L18.8 8.3C18.8 8.3 19 7.4 19.4 7.2H14.7C13.8 7.2 13.2 7.5 12.8 8.8L10.5 16.5Z"
              fill="white"
            />
          </svg>
        </div>
      ) : (
        /* Desktop: orange/red gradient rounded rect with white V */
        <svg width="36" height="36" viewBox="12 -2 56 56" fill="none">
          <defs>
            <linearGradient id="vedaGradD" x1="39.7144" y1="1.85519" x2="39.7144" y2="41.8552" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E56820" />
              <stop offset="1" stopColor="#D45E3E" />
            </linearGradient>
          </defs>
          <rect x="19.7144" y="1.85519" width="40" height="40" rx="10" fill="url(#vedaGradD)" />
          <path fillRule="evenodd" clipRule="evenodd"
            d="M42.4414 30.2153C42.4414 30.2153 43.1689 32.1573 43.8356 32.2789H35.4113C33.7142 32.2789 32.1994 31.3079 31.7141 29.487L26.8051 14.9207C26.8051 14.9207 26.381 13.1606 25.7144 12.8571H34.3205C36.0176 12.9179 37.1691 13.5247 37.8358 15.7706L42.4414 30.2153Z"
            fill="white" />
          <path fillRule="evenodd" clipRule="evenodd"
            d="M37.0472 30.2149C37.0472 30.2149 36.3198 32.1569 35.6531 32.2784H44.0774C45.7745 32.2784 47.2893 31.3074 47.7745 29.4865L52.6232 14.9207C52.6232 14.9207 53.0473 13.1606 53.714 12.8571H45.1681C43.471 12.8571 42.3803 13.464 41.7136 15.7098L37.0472 30.2149Z"
            fill="white" />
        </svg>
      )}

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "var(--font-jakarta), Plus Jakarta Sans, sans-serif",
          fontSize: darkIcon ? 18 : 20,
          fontWeight: 700,
          lineHeight: "25px",
          letterSpacing: darkIcon ? "-0.5px" : "-0.4px",
          color: "#1C1C1E",
          whiteSpace: "nowrap",
        }}
      >
        VedaAI
      </span>
    </div>
  )
}