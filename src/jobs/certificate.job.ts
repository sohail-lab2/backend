import { certificateQueue } from "../queues/certificate.queue";

export const enqueueCertificateJob = async (
  studentId: string,
  studentName: string,
  courseId: string,
  courseName: string,
) => {
    const now = new Date();
  await certificateQueue.add('generateCertificate', {
    studentName,
    courseName,
    courseId,
    studentId,
    completionDate: now.toISOString().split('T')[0],
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
};