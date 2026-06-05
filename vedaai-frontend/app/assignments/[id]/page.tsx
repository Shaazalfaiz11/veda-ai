"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAssignmentStore } from "@/store/assignmentStore"
import { useWebSocket } from "@/hooks/useWebSocket"
import Header from "@/components/Header"
import ExamPaper from "@/components/ExamPaper"

export default function AssignmentResultPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useWebSocket()

  const { status, progress, error, retryMessage, currentAssignment, setCurrentId, fetchAssignment, reset } =
    useAssignmentStore()

  useEffect(() => {
    if (!id) return
    setCurrentId(id)
    fetchAssignment(id)
  }, [id, setCurrentId, fetchAssignment])

  // Fallback polling in case WebSocket drops in production
  useEffect(() => {
    if (status !== "generating" || !id) return
    const interval = setInterval(() => {
      fetchAssignment(id)
    }, 5000)
    return () => clearInterval(interval)
  }, [id, status, fetchAssignment])

  if (status === "completed" && currentAssignment?.result) {
    return (
      <div className="min-h-screen bg-[#CECECE] md:bg-transparent pb-24 md:pb-8">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header title="Assignment" showBack />
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-5 py-4 bg-[#CECECE] sticky top-0 z-30">
          <button
            onClick={() => router.push("/assignments")}
            className="w-10 h-10 rounded-full bg-[#E3E3E3] flex items-center justify-center mr-3 flex-shrink-0"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1C1C1E" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M4 12L10 6M4 12L10 18" />
            </svg>
          </button>
          <h1
            className="flex-1 text-center text-[17px] font-[800] text-[#1C1C1E] mr-10 tracking-tight"
            style={{ fontFamily: "var(--font-jakarta), Plus Jakarta Sans, sans-serif" }}
          >
            Assignment
          </h1>
        </div>

        <ExamPaper
          assignment={currentAssignment}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#CECECE] md:bg-transparent">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header title="Assignment" showBack />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center px-5 py-4 bg-[#CECECE] sticky top-0 z-30">
        <button
          onClick={() => router.push("/assignments")}
          className="w-10 h-10 rounded-full bg-[#E3E3E3] flex items-center justify-center mr-3 flex-shrink-0"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1C1C1E" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M4 12L10 6M4 12L10 18" />
          </svg>
        </button>
        <h1
          className="flex-1 text-center text-[17px] font-[800] text-[#1C1C1E] mr-10 tracking-tight"
          style={{ fontFamily: "var(--font-jakarta), Plus Jakarta Sans, sans-serif" }}
        >
          {status === "failed" ? "Failed" : "Generating..."}
        </h1>
      </div>

      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-sm w-full px-6">
          {status === "failed" ? (
            <FailedState error={error} onBack={() => router.push("/assignments")} />
          ) : (
            <GeneratingState progress={progress} retryMessage={retryMessage} />
          )}
        </div>
      </div>
    </div>
  )
}

function GeneratingState({ progress, retryMessage }: { progress: number, retryMessage: string | null }) {
  const steps = [
    { label: "Connecting to AI",       threshold: 10 },
    { label: "Analysing requirements", threshold: 30 },
    { label: "Structuring sections",   threshold: 40 },
    { label: "Generating questions",   threshold: 70 },
    { label: "Validating output",      threshold: 80 },
    { label: "Finalising paper",       threshold: 100 },
  ]
  const step = steps.filter((s) => progress >= s.threshold).pop()

  return (
    <div className="space-y-8">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gray-900 animate-spin" />
        <div className="absolute inset-3 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-600 text-xl">✦</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[12px] text-gray-400">
          <span>{step?.label ?? "Starting..."}</span>
          <span>{progress}%</span>
        </div>
      </div>

      <div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-2 font-['Plus_Jakarta_Sans']">
          Generating your paper
        </h2>
        {retryMessage ? (
          <p className="text-[13px] text-orange-600 font-medium">
            {retryMessage}
          </p>
        ) : (
          <p className="text-[13px] text-gray-500">
            Groq AI is crafting your questions. Usually takes 5–15 seconds.
          </p>
        )}
      </div>
    </div>
  )
}

function FailedState({ error, onBack }: { error: string | null; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-100
        flex items-center justify-center">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </div>
      <div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">Generation Failed</h2>
        {error && (
          <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl p-3 font-mono">
            {error}
          </p>
        )}
      </div>
      <button
        onClick={onBack}
        className="px-6 py-2.5 bg-gray-900 text-white text-[13px] font-semibold
          rounded-xl hover:bg-gray-800 transition-colors"
      >
        ← Back to Assignments
      </button>
    </div>
  )
}