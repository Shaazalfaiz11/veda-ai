import Redis from "ioredis"
import { getRedisConnection } from "../config/redis"

export const pub = new Redis(getRedisConnection())
export const sub = new Redis(getRedisConnection())