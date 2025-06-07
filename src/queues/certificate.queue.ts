import { Queue } from 'bullmq';
import { redisOptions } from '../config/redis.config';

export const certificateQueue = new Queue('certificateQueue', {
  connection: redisOptions,
});
