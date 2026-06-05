import "dotenv/config";
import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis";

export const pdfQueue = new Queue("pdf-processing", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
