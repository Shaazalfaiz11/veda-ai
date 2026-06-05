import dotenv from "dotenv"
dotenv.config()

import { Worker }           from "bullmq"
import { connectDb }        from "../config/db"
import { getRedisConnection }  from "../config/redis"
import { Assignment }       from "../models/assignment.model"
import { pub }              from "../events/eventBus"
import { buildPrompt, generateWithAI } from "../services/ai.service"
import { logger }           from "../utils/logger"
import { LLMTimeoutError }  from "../utils/errors"

const publish = (payload: object) =>
  pub.publish("ASSIGNMENT_EVENTS", JSON.stringify(payload))

const startWorker = async () => {
  await connectDb()
  logger.info("✅ DB Connected in Worker")

  new Worker(
    "assignment-generation",
    async (job) => {
      const { assignmentId } = job.data
      logger.info({ assignmentId, attempt: job.attemptsMade }, "📋 Processing assignment")
      const startTime = Date.now()

      try {
        await publish({ type: "ASSIGNMENT_GENERATING", assignmentId, progress: 10 })

        const assignment = await Assignment.findById(assignmentId)
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

        const prompt = buildPrompt(assignment)

        await publish({ type: "ASSIGNMENT_GENERATING", assignmentId, progress: 40 })
        logger.info({ assignmentId }, "🤖 Calling AI...")

        const result = await generateWithAI(prompt)

        await publish({ type: "ASSIGNMENT_GENERATING", assignmentId, progress: 80 })

        await Assignment.findByIdAndUpdate(assignmentId, {
          status: "completed",
          result,
          error:  null,
        })

        await publish({ type: "ASSIGNMENT_COMPLETED", assignmentId })
        const duration = Date.now() - startTime
        logger.info({ assignmentId, duration }, "✅ Assignment completed")

      } catch (error: any) {
        const duration = Date.now() - startTime
        logger.error({ error: error.message, assignmentId, duration, name: error.name }, "❌ Worker Error")

        const attemptsMade = job.attemptsMade
        const maxAttempts = job.opts.attempts || 4

        if (attemptsMade < maxAttempts) {
          logger.info({ assignmentId, attemptsMade, maxAttempts }, "Job failed, retrying...")
          
          await Assignment.findByIdAndUpdate(assignmentId, {
            retryCount: attemptsMade,
          })

          await publish({
            type: "ASSIGNMENT_RETRYING",
            assignmentId,
            message: `Generation timed out. Retrying (${attemptsMade}/${maxAttempts - 1})...`,
          })

          throw error // Let BullMQ apply backoff and retry
        }

        await Assignment.findByIdAndUpdate(assignmentId, {
          status: "failed",
          error:  error.message,
          retryCount: attemptsMade,
        })

        await publish({
          type: "ASSIGNMENT_FAILED",
          assignmentId,
          error: error.message,
        })
      }
    },
    {
      connection:  getRedisConnection(),
      concurrency: 1,
      lockDuration: 60000,
      stalledInterval: 30000,
      drainDelay: 240,
      skipDelayCheck: false,
    } as any
  )

  logger.info("🚀 Worker Started")
}

startWorker()