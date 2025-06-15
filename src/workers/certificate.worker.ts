import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.config';
import { generateCertificate } from '../services/certificate.service';

export const worker = new Worker(
  'certificateQueue',
  async job => {
    const {
      studentId,
      courseId,
      studentName,
      courseName,
      completionDate,
    } = job.data;
    console.log(`🎓 Generating certificate for user ${studentName} - course ${courseName}`);
    await generateCertificate(studentId, courseId, studentName, courseName, completionDate);
    console.log(`✅ Certificate generation complete for user ${studentName}`);
  },
  { connection: redisClient.duplicate() }
);

worker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});