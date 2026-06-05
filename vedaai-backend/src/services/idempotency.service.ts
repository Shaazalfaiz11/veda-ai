import * as redisRepo from "../repositories/redis.repository";
import { IdempotencyRecord } from "../types/idempotency";
import { logger } from "../utils/logger";

const TTL = 86400;

export const getRecord = async (key: string): Promise<IdempotencyRecord | null> => {
  const data = await redisRepo.get(`idempotency:${key}`);
  if (!data) return null;
  try {
    return JSON.parse(data) as IdempotencyRecord;
  } catch (err) {
    logger.error({ key, err }, "Failed to parse idempotency record");
    return null;
  }
};

export const lockRequest = async (key: string): Promise<boolean> => {
  const record: IdempotencyRecord = { status: "processing", createdAt: Date.now() };
  return redisRepo.setIfNotExist(`idempotency:${key}`, JSON.stringify(record), TTL);
};

export const updateRecord = async (key: string, record: Partial<IdempotencyRecord>): Promise<void> => {
  const existing = await getRecord(key) || { status: "processing", createdAt: Date.now() };
  const updated: IdempotencyRecord = { ...existing, ...record };
  await redisRepo.set(`idempotency:${key}`, JSON.stringify(updated), TTL);
};
