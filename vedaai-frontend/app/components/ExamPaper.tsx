"use client"

import { useRef, useState } from "react"
import { Assignment, Section, Question, useAssignmentStore } from "@/store/assignmentStore"
import { API_URL } from "@/lib/api"

interface Props {
  assignment: Assignment
}

export default function ExamPaper({ assignment }: Props) {
  const paperRef = useRef<HTMLDivElement>(null)
  const [printing, setPrinting] = useState(false)
  const { regeneratingQuestionId, setRegeneratingQuestionId } = useAssignmentStore()

  const sections: Section[] = assignment.result ?? []
  const totalQ = sections.reduce((a, s) => a + s.questions.length, 0)

  const handlePDF = async () => {
    setPrinting(true)
    try {
      const html2pdf = (await import("html2pdf.js" as any)).default
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${assignment.subject}-${assignment.topic}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css"] },
        })
        .from(paperRef.current)
        .save()
    } catch (e) {
      console.error(e)
    }
    setPrinting(false)
  }

  const getDifficultyString = (diff?: string) => {
    const d = diff || "medium";
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const handleRegenerate = async (questionId: string) => {
    if (!assignment._id) return;
    setRegeneratingQuestionId(questionId);
    try {
      const response = await fetch(`${API_URL}/api/assignments/${assignment._id}/questions/${questionId}/regenerate`, {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Failed to queue regeneration");
      }
    } catch (e) {
      console.error(e);
      setRegeneratingQuestionId(null);
      alert("Failed to regenerate question. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-[calc(100vh-64px)]">
      <div className="bg-[#444444] rounded-[24px] p-6 sm:p-8 w-full max-w-[1100px] mx-auto shadow-sm">
        {/* Header Text */}
        <p className="text-white text-[15px] sm:text-[16px] font-bold mb-6 font-['Plus_Jakarta_Sans'] leading-relaxed">
          Certainly, Lakshya! Here are customized Question Paper for your {assignment.subject} classes on the {assignment.topic} chapters:
        </p>

        {/* Action Button */}
        <button
          onClick={handlePDF}
          disabled={printing}
          className="flex items-center gap-2 mb-8 bg-white text-[#111] px-5 py-2.5 rounded-full text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70"
        >
          {printing ? (
            <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          )}
          Download as PDF
        </button>

        {/* Paper Container */}
        <div 
          ref={paperRef}
          className="bg-white rounded-[32px] p-8 sm:p-14 text-black shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          {/* Paper Header */}
          <div className="text-center mb-10">
            <h1 className="text-[22px] sm:text-[26px] font-extrabold text-gray-900 tracking-tight mb-1">
              Delhi Public School, Sector-4, Bokaro
            </h1>
            <h2 className="text-[16px] sm:text-[18px] font-bold text-gray-800">
              Subject: {assignment.subject}
            </h2>
            <h3 className="text-[16px] sm:text-[18px] font-bold text-gray-800 mt-0.5">
              Class: 5th
            </h3>
          </div>

          {/* Time & Marks Row */}
          <div className="flex justify-between items-center text-[13px] font-bold text-gray-800 mb-6">
            <span>Time Allowed: 45 minutes</span>
            <span>Maximum Marks: {assignment.totalMarks}</span>
          </div>

          {/* Instructions */}
          <p className="text-[13px] font-bold text-gray-800 mb-8">
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student Info */}
          <div className="space-y-4 mb-10 text-[13px] font-bold text-gray-800">
            <div className="flex gap-4">
              <span className="min-w-[40px]">Name: </span>
              <span className="flex-1 border-b border-gray-400"></span>
            </div>
            <div className="flex gap-4">
              <span className="min-w-[80px]">Roll Number: </span>
              <span className="flex-1 border-b border-gray-400"></span>
            </div>
            <div className="flex gap-4">
              <span className="min-w-[120px]">Class: 5th Section: </span>
              <span className="flex-1 border-b border-gray-400"></span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-[18px] font-extrabold text-gray-900">Section A</h3>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections
              .filter((sec) => sec.title?.toLowerCase() !== "answer key")
              .map((sec, si) => {
                const secMarks = sec.questions.length > 0 ? sec.questions[0].marks : 0;
                return (
                  <div key={si} className="avoid-break mb-8">
                    <div className="mb-6">
                      <h4 className="text-[14px] font-extrabold text-gray-900">{sec.title}</h4>
                      <p className="text-[13px] text-gray-700 italic mt-1">
                        Attempt all questions. Each question carries {secMarks} marks
                      </p>
                    </div>

                    <div className="space-y-4">
                      {sec.questions.map((q, qi) => {
                        const isRegenerating = regeneratingQuestionId === q._id;
                        return (
                        <div key={qi} className="text-[13px] text-gray-800 flex items-start gap-2 avoid-break leading-relaxed relative group">
                          <span className="min-w-[16px]">{qi + 1}.</span>
                          <div className="flex-1">
                            {isRegenerating ? (
                              <div className="flex items-center gap-2 text-gray-500 italic py-1">
                                <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                Regenerating question...
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start gap-4">
                                  <p>
                                    [{getDifficultyString(q.difficulty)}] {q.text || "Question text missing"} [{q.marks || 1} Marks]
                                  </p>
                                  {q._id && !printing && (
                                    <button
                                      onClick={() => handleRegenerate(q._id as string)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
                                      title="Regenerate this question"
                                    >
                                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      <span className="text-[11px] font-bold">Regenerate</span>
                                    </button>
                                  )}
                                </div>
                                {q.type === "mcq" && q.options && q.options.length > 0 && (
                                  <div className="pl-4 mt-2 space-y-1">
                                    {q.options.map((opt, oi) => (
                                      <div key={oi}>
                                        {String.fromCharCode(65 + oi)}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                );
              })}
          </div>

          <p className="text-[13px] font-bold text-gray-900 mt-12 mb-8">
            End of Question Paper
          </p>

          {/* Answer Key */}
          {sections.some((sec) => sec.title?.toLowerCase() === "answer key") && (
            <div className="avoid-break mt-12 pt-8">
              <h4 className="text-[16px] font-extrabold text-gray-900 mb-6">Answer Key:</h4>
              <div className="space-y-4 text-[13px] text-gray-800 leading-relaxed">
                {sections
                  .find((sec) => sec.title?.toLowerCase() === "answer key")
                  ?.questions.map((q, i) => (
                    <div key={i}>
                      {q.text.split("\n").map((line, li) => (
                        <p key={li} className="mb-2">{line}</p>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}