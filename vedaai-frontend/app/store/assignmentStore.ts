import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { v4 as uuidv4 } from "uuid"

import { API_URL } from "@/lib/api"

export type QuestionType =
  | "Multiple Choice Questions"
  | "Short Questions"
  | "Long Questions"
  | "Diagram/Graph-Based Questions"
  | "Numerical Problems"
  | "True/False"
  | "Fill in the Blanks"

export type Difficulty = "easy" | "medium" | "hard"
export type GenerationStatus = "idle" | "generating" | "completed" | "failed"

export interface QuestionTypeRow {
  id: string
  type: QuestionType
  count: number
  marks: number
}

export interface AssignmentForm {
  file: File | null
  dueDate: string
  questionTypes: QuestionTypeRow[]
  additionalInfo: string
  subject: string
  topic: string
}

export interface Question {
  text: string
  difficulty: Difficulty
  marks: number
  type: string
  options?: string[]
}

export interface Section {
  title: string
  instruction: string
  questions: Question[]
}

export interface Assignment {
  _id: string
  subject: string
  topic: string
  totalMarks: number
  questionTypes: string[]
  instructions: string
  status: GenerationStatus
  result: Section[] | null
  error: string | null
  retryCount?: number
  createdAt: string
  dueDate?: string
}

interface FormErrors {
  subject?: string
  topic?: string
  dueDate?: string
  questionTypes?: string
}

interface AssignmentState {
  form: AssignmentForm
  formErrors: FormErrors
  assignments: Assignment[]
  loadingList: boolean
  currentAssignment: Assignment | null
  currentId: string | null
  status: GenerationStatus
  progress: number
  error: string | null
  retryCount: number
  retryMessage: string | null
  regeneratingQuestionId: string | null
  wsConnected: boolean

  setFormField: <K extends keyof AssignmentForm>(k: K, v: AssignmentForm[K]) => void
  addQuestionType: () => void
  removeQuestionType: (id: string) => void
  updateQuestionType: (id: string, field: keyof QuestionTypeRow, value: any) => void
  validateForm: () => boolean
  resetForm: () => void
  submitAssignment: () => Promise<string | null>
  fetchAssignments: () => Promise<void>
  fetchAssignment: (id: string) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  setCurrentAssignment: (a: Assignment) => void
  setStatus: (s: GenerationStatus) => void
  setProgress: (p: number) => void
  setError: (e: string | null) => void
  setRetryMessage: (m: string | null) => void
  setRegeneratingQuestionId: (id: string | null) => void
  updateQuestion: (sectionIndex: number, questionIndex: number, newQuestion: Question) => void
  setWsConnected: (c: boolean) => void
  setCurrentId: (id: string) => void
  reset: () => void
}

const makeRow = (): QuestionTypeRow => ({
  id: Math.random().toString(36).slice(2),
  type: "Multiple Choice Questions",
  count: 4,
  marks: 1,
})

const defaultForm: AssignmentForm = {
  file: null,
  dueDate: "",
  questionTypes: [
    { id: "1", type: "Multiple Choice Questions", count: 4, marks: 1 },
    { id: "2", type: "Short Questions", count: 3, marks: 2 },
  ],
  additionalInfo: "",
  subject: "",
  topic: "",
}

export const useAssignmentStore = create<AssignmentState>()(
  devtools(
    (set, get) => ({
      form: { ...defaultForm, questionTypes: [...defaultForm.questionTypes] },
      formErrors: {},
      assignments: [],
      loadingList: false,
      currentAssignment: null,
      currentId: null,
      status: "idle",
      progress: 0,
      error: null,
      retryCount: 0,
      retryMessage: null,
      regeneratingQuestionId: null,
      wsConnected: false,

      setFormField: (k, v) =>
        set((s) => ({
          form: { ...s.form, [k]: v },
          formErrors: { ...s.formErrors, [k]: undefined },
        })),

      addQuestionType: () =>
        set((s) => ({
          form: { ...s.form, questionTypes: [...s.form.questionTypes, makeRow()] },
        })),

      removeQuestionType: (id) =>
        set((s) => ({
          form: {
            ...s.form,
            questionTypes: s.form.questionTypes.filter((r) => r.id !== id),
          },
        })),

      updateQuestionType: (id, field, value) =>
        set((s) => ({
          form: {
            ...s.form,
            questionTypes: s.form.questionTypes.map((r) =>
              r.id === id ? { ...r, [field]: value } : r
            ),
          },
        })),

      validateForm: () => {
        const { form } = get()
        const errors: FormErrors = {}
        if (!form.subject.trim()) errors.subject = "Subject is required"
        if (!form.topic.trim()) errors.topic = "Topic is required"
        if (!form.dueDate) errors.dueDate = "Due date is required"
        if (form.questionTypes.length === 0)
          errors.questionTypes = "Add at least one question type"
        for (const row of form.questionTypes) {
          if (row.count <= 0) errors.questionTypes = "Question count must be > 0"
          if (row.marks <= 0) errors.questionTypes = "Marks must be > 0"
        }
        set({ formErrors: errors })
        return Object.keys(errors).length === 0
      },

      resetForm: () =>
        set({
          form: { ...defaultForm, questionTypes: [...defaultForm.questionTypes] },
          formErrors: {},
        }),

      submitAssignment: async () => {
        const { form, validateForm } = get()
        if (!validateForm()) return null

        const totalMarks = form.questionTypes.reduce(
          (sum, r) => sum + r.count * r.marks, 0
        )
        const questionTypes = [
          ...new Set(
            form.questionTypes.map((r) => {
              if (r.type.includes("Multiple")) return "mcq"
              if (r.type.includes("True/False")) return "mcq"
              if (r.type.includes("Fill in")) return "mcq"
              if (r.type.includes("Short")) return "short"
              return "long"
            })
          ),
        ]
        const typeBreakdown = form.questionTypes
          .map((r) => `${r.count} ${r.type} (${r.marks} mark each)`)
          .join(", ")
        const instructions = `${form.additionalInfo || "Attempt all questions"}. Question breakdown: ${typeBreakdown}`

        set({ status: "generating", progress: 0, error: null, retryMessage: null, retryCount: 0 })

        try {
          const idempotencyKey = uuidv4()
          const res = await fetch(
            `${API_URL}/api/assignments`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "X-Idempotency-Key": idempotencyKey
              },
              body: JSON.stringify({
                subject: form.subject.trim(),
                topic: form.topic.trim(),
                totalMarks,
                questionTypes,
                instructions,
                dueDate: form.dueDate,
                questionTypeRows: form.questionTypes,
              }),
            }
          )
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          const id: string = data.data._id
          
          if (res.status === 200 && data.message === "Idempotent request detected") {
            if (data.data.status === "completed") {
              set({ status: "completed" })
            }
          }
          
          set({ currentId: id })
          return id
        } catch (err: any) {
          set({ status: "failed", error: err.message })
          return null
        }
      },

      fetchAssignments: async () => {
        set({ loadingList: true })
        try {
          const res = await fetch(`${API_URL}/api/assignments`)
          const data = await res.json()
          set({ assignments: Array.isArray(data) ? data : [] })
        } catch {
          set({ assignments: [] })
        } finally {
          set({ loadingList: false })
        }
      },

      fetchAssignment: async (id) => {
        try {
          const res = await fetch(
            `${API_URL}/api/assignments/${id}`
          )
          const data = await res.json()
          set({ currentAssignment: data })
          if (data.status === "completed") set({ status: "completed" })
          else if (data.status === "failed") set({ status: "failed", error: data.error })
          else set({ status: "generating" })
        } catch (err: any) {
          set({ status: "failed", error: err.message })
        }
      },

      deleteAssignment: async (id) => {
        try {
          await fetch(`${API_URL}/api/assignments/${id}`, {
            method: "DELETE",
          })
          set((s) => ({
            assignments: s.assignments.filter((a) => a._id !== id),
          }))
        } catch (err) {
          console.error("Delete failed", err)
        }
      },

      setCurrentAssignment: (a) => set({ currentAssignment: a }),
      setStatus: (status) => set({ status }),
      setProgress: (progress) => set({ progress }),
      setError: (error) => set({ error }),
      setRetryMessage: (retryMessage) => set({ retryMessage }),
      setRegeneratingQuestionId: (id) => set({ regeneratingQuestionId: id }),
      updateQuestion: (sectionIndex, questionIndex, newQuestion) => set((state) => {
        if (!state.currentAssignment || !state.currentAssignment.result) return state;
        const newResult = [...state.currentAssignment.result];
        newResult[sectionIndex].questions[questionIndex] = newQuestion;
        return {
          currentAssignment: {
            ...state.currentAssignment,
            result: newResult
          }
        };
      }),
      setWsConnected: (wsConnected) => set({ wsConnected }),
      setCurrentId: (id) => set({ currentId: id }),
      reset: () =>
        set({
          currentAssignment: null,
          currentId: null,
          status: "idle",
          progress: 0,
          error: null,
          retryCount: 0,
          retryMessage: null,
          regeneratingQuestionId: null,
        }),
    }),
    { name: "veda-assignment" }
  )
)