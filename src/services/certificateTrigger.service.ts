import { certificateQueue } from '../queues/certificate.queue';
import { Chapter, Quiz, QuizAttempt } from '../models';

const enqueueCertificateJob = async (
  userId: string,
  studentName: string,
  courseId: string,
  courseName: string,
  avgScore: number,
) => {
    const now = new Date();
  await certificateQueue.add('generateCertificate', {
    studentName,
    courseName,
    instructorName,
    path,
    completionDate: now,
  });
};

export const evaluateCourseCompletion = async (userId: string, studentName: string, courseId: string, courseName: string) => {
    const chapters = await Chapter.find({ courseId }).select('_id').lean();
    const chapterIds = chapters.map(c => c._id);
  
    const quizzes = await Quiz.find({ chapterId: { $in: chapterIds } }).select('_id passingPercentage').lean();
    if (quizzes.length === 0) return; // No quizzes, nothing to evaluate
  
    const quizIds = quizzes.map(q => q._id);
  
    const attempts = await QuizAttempt.find({
      userId,
      quizId: { $in: quizIds },
      completedAt: { $ne: null },
    }).lean();
  
    if (attempts.length !== quizzes.length) return; // Incomplete attempts
  
    const totalPercentage = attempts.reduce((sum, att) => sum + att.score, 0);
    const avgPercentage = totalPercentage / attempts.length;
  
      // 🎉 All completed and >= 80% score
    if (avgPercentage >= 80) {
      await enqueueCertificateJob(userId, studentName, courseId, courseName, avgPercentage);
    }
  };
  