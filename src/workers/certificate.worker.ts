import { Worker } from 'bullmq';
import { redisOptions } from '../config/redis.config';
import { generateCertificate } from '../services/certificate.service';

export const worker = new Worker(
  'certificateQueue',
  async job => {
    const {
      studentName,
      courseName,
      completionDate,
      instructorName,
      path,
     } = job.data;
    console.log(`🎓 Generating certificate for user ${studentName} - course ${courseName}`);
    await generateCertificate(studentName, courseName, instructorName , completionDate, path);
    console.log(`✅ Certificate generation complete for user ${studentName}`);
  },
  { connection: redisOptions }
);

worker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});