import Redis, { RedisOptions } from "ioredis";
import { config } from "./variables.config";

export const redisOptions: RedisOptions = {
    host: config.redisHost,
<<<<<<< HEAD
    password: "AYq1AAIjcDE1OWVmMTBlZGE4MGI0M2EyOTRlOTlmMmM0ODcyNjhiNXAxMA", //todo temp password only for testing
    port: config.redisPort,
    retryStrategy: times => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
=======
    port: config.redisPort,
    retryStrategy: times => Math.min(times * 50, 2000),
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
};

export const redisClient = new Redis(redisOptions);