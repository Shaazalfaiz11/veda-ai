import "dotenv/config"
import { Queue } from "bullmq"
import { getRedisConnection } from "../config/redis"

export const generationQueue = new Queue("assignment-generation", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 4,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail:     50,
  },
})