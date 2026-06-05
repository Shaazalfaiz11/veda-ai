import { Queue } from "bullmq"
import { getRedisConnection } from "../config/redis"

export const questionRegenQueue = new Queue("question-regeneration", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail:     50,
  },
})
