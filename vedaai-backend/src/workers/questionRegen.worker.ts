import dotenv from "dotenv"
dotenv.config()

import { Worker }           from "bullmq"
import { connectDb }        from "../config/db"
import { getRedisConnection }  from "../config/redis"
import { Assignment }       from "../models/assignment.model"
import { pub }              from "../events/eventBus"
import { generateSingleQuestionWithAI } from "../services/ai.service"
import { logger }           from "../utils/logger"

const publish = (payload: object) =>
  pub.publish("ASSIGNMENT_EVENTS", JSON.stringify(payload))

const startWorker = async () => {
  await connectDb()
  logger.info("✅ DB Connected in Question Regen Worker")

  new Worker(
    "question-regeneration",
    async (job) => {
      const { assignmentId, questionId, sectionIndex, questionIndex } = job.data
      logger.info({ assignmentId, questionId }, "📋 Processing question regeneration")

      try {
        const assignment = await Assignment.findById(assignmentId)
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

        if (!assignment.result || !assignment.result[sectionIndex]) {
          throw new Error("Section not found in assignment result");
        }

        const section = assignment.result[sectionIndex]
        const oldQuestion = section.questions[questionIndex]

        if (!oldQuestion || (oldQuestion as any)._id?.toString() !== questionId) {
          throw new Error("Question index mismatch or question not found");
        }

        logger.info({ questionId }, "🤖 Calling AI for single question...")

        const newQuestion = await generateSingleQuestionWithAI(assignment, oldQuestion)

        // Keep the old question's ID for smooth replacement
        newQuestion._id = (oldQuestion as any)._id

        // Nested update
        await Assignment.updateOne(
          { _id: assignmentId },
          {
            $set: {
              [`result.${sectionIndex}.questions.${questionIndex}`]: newQuestion
            }
          }
        )

        logger.info({ questionId }, "✅ Question regeneration completed")

        await publish({
          type: "ASSIGNMENT_QUESTION_REGENERATED",
          assignmentId,
          questionId,
          newQuestion,
          sectionIndex,
          questionIndex
        })

      } catch (error: any) {
        logger.error({ error: error.message, assignmentId, questionId }, "❌ Question Regen Worker Error")

        await publish({
          type: "ASSIGNMENT_QUESTION_REGEN_FAILED",
          assignmentId,
          questionId,
          error: error.message,
        })
        throw error
      }
    },
    {
      connection:  getRedisConnection(),
      concurrency: 5,
      lockDuration: 60000,
      stalledInterval: 30000,
    } as any
  )

  logger.info("🚀 Question Regen Worker Started")
}

startWorker()
