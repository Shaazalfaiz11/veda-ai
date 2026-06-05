"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAssignmentStore } from "@/store/assignmentStore"
import { API_URL, WS_URL } from "@/lib/api"

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const {
    currentId,
    setStatus,
    setProgress,
    setError,
    setCurrentAssignment,
    setWsConnected,
  } = useAssignmentStore()

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        // Removed early return so we can process list updates

        switch (data.type) {
          case "CONNECTED":
            setWsConnected(true)
            break
          case "ASSIGNMENT_GENERATING":
            if (data.assignmentId === currentId) {
              setStatus("generating")
              if (data.progress !== undefined) setProgress(data.progress)
            }
            // Also fetch to update the list status
            useAssignmentStore.getState().fetchAssignments()
            break
          case "ASSIGNMENT_RETRYING":
            if (data.assignmentId === currentId) {
              setStatus("generating")
              useAssignmentStore.getState().setRetryMessage(data.message)
            }
            useAssignmentStore.getState().fetchAssignments()
            break
          case "ASSIGNMENT_COMPLETED":
            if (data.assignmentId === currentId) {
              setProgress(100)
              fetch(`${API_URL}/api/assignments/${data.assignmentId}`)
                .then((r) => r.json())
                .then((a) => {
                  setCurrentAssignment(a)
                  setStatus("completed")
                })
            }
            // Always refresh the assignments list so cards update
            useAssignmentStore.getState().fetchAssignments()
            break
          case "ASSIGNMENT_FAILED":
            if (data.assignmentId === currentId) {
              setStatus("failed")
              setError(data.error || "Generation failed")
            }
            useAssignmentStore.getState().fetchAssignments()
            break
          case "ASSIGNMENT_QUESTION_REGENERATED":
            if (data.assignmentId === currentId) {
              useAssignmentStore.getState().updateQuestion(data.sectionIndex, data.questionIndex, data.newQuestion)
              useAssignmentStore.getState().setRegeneratingQuestionId(null)
            }
            break
          case "ASSIGNMENT_QUESTION_REGEN_FAILED":
            if (data.assignmentId === currentId) {
              useAssignmentStore.getState().setRegeneratingQuestionId(null)
            }
            break
        }
      } catch {}
    },
    [currentId, setStatus, setProgress, setError, setCurrentAssignment, setWsConnected]
  )

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      retriesRef.current = 0
      setWsConnected(true)
    }
    ws.onmessage = handleMessage
    ws.onclose = () => {
      setWsConnected(false)
      if (retriesRef.current < 5) {
        timerRef.current = setTimeout(() => {
          retriesRef.current++
          connect()
        }, 2000 * Math.pow(2, retriesRef.current))
      }
    }
    ws.onerror = () => ws.close()
  }, [handleMessage, setWsConnected])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}