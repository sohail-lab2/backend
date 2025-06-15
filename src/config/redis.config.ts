import Redis, { RedisOptions } from "ioredis";
import { config } from "./variables.config";

export const redisOptions: RedisOptions = {
    host: config.redisHost,
    port: config.redisPort,
    retryStrategy: times => Math.min(times * 50, 2000),
};

export const redisClient = new Redis(redisOptions);