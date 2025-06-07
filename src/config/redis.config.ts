import { RedisOptions } from "ioredis";
import { config } from "./variables.config";

export const redisOptions: RedisOptions = {
    host: config.redisHost,
    port: config.redisPort,
}