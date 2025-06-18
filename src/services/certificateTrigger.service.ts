import { Chapter, Quiz, QuizAttempt } from '../models';
import { enqueueCertificateJob } from '../jobs/certificate.job';

export const evaluateCourseCompletion = async (userId: string, studentName: string, courseId: string, courseName: string) => {
    const chapters = await Chapter.find({ courseId }).select('_id').lean();
    const chapterIds = chapters.map(c => c._id);

    const quizzes = await Quiz.find({ chapterId: { $in: chapterIds }, isPublished: true }).select('_id passingPercentage').lean();
    if (quizzes.length === 0) {
      return; 
    }

    const quizIds = quizzes.map(q => q._id);

    const attempts = await QuizAttempt.find({
      userId,
      quizId: { $in: quizIds },
      completedAt: { $ne: null },
    }).lean();

    if (attempts.length !== quizzes.length) {
      return; 
    }

    const totalPercentage = attempts.reduce((sum, att) => sum + att.score, 0);
    const avgPercentage = totalPercentage / attempts.length;

    if (avgPercentage >= 80) {
      await enqueueCertificateJob(userId, studentName, courseId, courseName);
    }
  };