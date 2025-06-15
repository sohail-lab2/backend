import { redisClient } from '../config/redis.config';

export const cacheData = async (key: string, fetchFunction: () => Promise<any>, expiration: number = 3600) => {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const freshData = await fetchFunction();
    await redisClient.set(key, JSON.stringify(freshData), 'EX', expiration);
    return freshData;
};
