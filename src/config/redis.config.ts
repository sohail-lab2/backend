import Redis, { RedisOptions } from "ioredis";
import { config } from "./variables.config";

export const redisOptions: RedisOptions = {
    host: config.redisHost,
    password: "AYq1AAIjcDE1OWVmMTBlZGE4MGI0M2EyOTRlOTlmMmM0ODcyNjhiNXAxMA", //todo temp password only for testing
    port: config.redisPort,
    retryStrategy: times => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

export const redisClient = new Redis(redisOptions);