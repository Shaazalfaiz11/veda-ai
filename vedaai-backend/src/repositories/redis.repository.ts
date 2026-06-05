import Redis from "ioredis";
import { getRedisConnection } from "../config/redis";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

export const getClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(getRedisConnection());
    redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
  }
  return redisClient;
};

export const setIfNotExist = async (key: string, value: string, ttl: number): Promise<boolean> => {
  try {
    const result = await getClient().set(key, value, "EX", ttl, "NX");
    return result === "OK";
  } catch (err) {
    logger.error({ key, err }, "Redis setIfNotExist error");
    return true; // Fallback gracefully if Redis is down
  }
};

export const get = async (key: string): Promise<string | null> => {
  try {
    return await getClient().get(key);
  } catch (err) {
    logger.error({ key, err }, "Redis get error");
    return null;
  }
};

export const set = async (key: string, value: string, ttl: number): Promise<void> => {
  try {
    await getClient().set(key, value, "EX", ttl);
  } catch (err) {
    logger.error({ key, err }, "Redis set error");
  }
};
