// server/src/jobs/certificate.job.ts

import { Queue } from 'bullmq';
import { redisOptions } from '../config/redis.config';

const certificateQueue = new Queue('certificate-generation', {
  connection: redisOptions,
});

export const addCertificateJob = async (userId: string, courseId: string) => {
  await certificateQueue.add(
    'generate-certificate',
    { userId, courseId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
