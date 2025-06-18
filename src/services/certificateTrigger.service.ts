import { Chapter, Quiz, QuizAttempt } from '../models';
import { enqueueCertificateJob } from '../jobs/certificate.job';

export const evaluateCourseCompletion = async (userId: string, studentName: string, courseId: string, courseName: string) => {
    const chapters = await Chapter.find({ courseId }).select('_id').lean();
    const chapterIds = chapters.map(c => c._id);
<<<<<<< HEAD

    const quizzes = await Quiz.find({ chapterId: { $in: chapterIds }, isPublished: true }).select('_id passingPercentage').lean();
    if (quizzes.length === 0) {
      return; 
    }

    const quizIds = quizzes.map(q => q._id);

=======
  
    const quizzes = await Quiz.find({ chapterId: { $in: chapterIds } }).select('_id passingPercentage').lean();
    if (quizzes.length === 0) return; // No quizzes, nothing to evaluate
  
    const quizIds = quizzes.map(q => q._id);
  
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    const attempts = await QuizAttempt.find({
      userId,
      quizId: { $in: quizIds },
      completedAt: { $ne: null },
    }).lean();
<<<<<<< HEAD

    if (attempts.length !== quizzes.length) {
      return; 
    }

    const totalPercentage = attempts.reduce((sum, att) => sum + att.score, 0);
    const avgPercentage = totalPercentage / attempts.length;

    if (avgPercentage >= 80) {
      await enqueueCertificateJob(userId, studentName, courseId, courseName);
    }
  };
=======
  
    if (attempts.length !== quizzes.length) return; // Incomplete attempts
  
    const totalPercentage = attempts.reduce((sum, att) => sum + att.score, 0);
    const avgPercentage = totalPercentage / attempts.length;
  
      // 🎉 All completed and >= 80% score
    if (avgPercentage >= 80) {
      await enqueueCertificateJob(userId, studentName, courseId, courseName);
    }
  };
  
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
