import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.config';

export const certificateQueue = new Queue('certificateQueue', {
  connection: redisClient.duplicate(),
});
