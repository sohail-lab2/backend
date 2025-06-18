import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import {Chapter, Payment, Question, Quiz, QuizAttempt, User} from '../models';
import { cleanMongoData } from '../services';
import { questionValidationSchema, quizAttemptValidationSchema, quizValidationSchema, UserRoles } from '../schemas';
import { Types } from 'mongoose';
import { evaluateCourseCompletion } from '../services/certificateTrigger.service';

export const getQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId)
      .populate('questions')
      .lean();

    if (!quiz) {
      return next(new NotFoundError('Quiz not found'));
    }

    res.status(200).json(cleanMongoData(quiz));
  } catch (error) {
    next(error);
  }
};


export const createQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await quizValidationSchema.parseAsync(req.body);

    const chapter = await Chapter.findById(validatedData.chapterId).populate('courseId', 'instrID').lean();
    if(!chapter) throw new NotFoundError('Chapter not found');
    if(req.user?.role! === UserRoles[1]){
      const mUser = await User.findOne({uid: req.user?.uid!});
      if(!mUser) throw new AuthenticationError(); 
      if((chapter.courseId as any).instrID.toString() !== (mUser._id as any).toString()) throw new AuthorizationError('You can not add quiz to other\'s course.');
    }

    // Check if chapter already has a quiz
    if (chapter.quiz) {
      throw new ConflictError('This chapter already has a quiz');
    }

    const quiz = await Quiz.create(validatedData);
    
    // Update chapter with the new quiz
    await Chapter.findByIdAndUpdate(validatedData.chapterId, { quiz: quiz._id });
    
    res.status(201).json(cleanMongoData(quiz.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) throw new NotFoundError('Quiz not found');

    if (req.user?.role! === UserRoles[1]) {
      const chapter = await Chapter.findById(quiz.chapterId).populate('courseId', 'instrID').lean();
      if (!chapter) throw new NotFoundError('Chapter not found');
      const mUser = await User.findOne({ uid: req.user?.uid! });
      if (!mUser) throw new AuthenticationError();
      if (!(chapter.courseId as any).instrID.equals(mUser._id)) {
        throw new AuthorizationError('You do not have permission to delete this quiz');
      }
    }

    // Delete all questions associated with the quiz
    await Question.deleteMany({ quizId });

    // Delete all quiz attempts
    await QuizAttempt.deleteMany({ quizId });

    // Remove quiz reference from chapter
    await Chapter.findByIdAndUpdate(quiz.chapterId, { $unset: { quiz: 1 } });

    // Delete the quiz
    await Quiz.findByIdAndDelete(quizId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addQuestionToQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mUser = await User.findOne({uid: req.user?.uid});
    if (!mUser) {
      throw new AuthorizationError();
    }
    const quizId = req.params.quizId;
    let validateData = await questionValidationSchema.parseAsync(req.body);
    validateData.quizId = quizId;
    // Validate Quiz Exists
    const quiz = await Quiz.findById(validateData.quizId).lean();
    if (!quiz) throw new NotFoundError('Quiz not found');

    if (req.user?.role! === UserRoles[1]) {
      // Ensure the courseId in Chapter matches the instructor's courseId
      const chapter = await Chapter.findOne({ quiz: validateData.quizId }).populate('courseId', 'instrID').lean();
      if (!chapter) throw new NotFoundError('Chapter not found');
      if (!(chapter.courseId as any).instrID.equals(mUser._id)) {
        throw new AuthorizationError('You do not have permission to modify this quiz');
      }
    }

    // Create and add the validated questions to the quiz
    const newQuestion = await Question.create(validateData);

    // Update the quiz with new questions
    await Quiz.findByIdAndUpdate(validateData.quizId, {
      $push: { questions: newQuestion._id} },
    );

    res.status(201).json({
      message: 'Questions added successfully',
      questions: cleanMongoData(newQuestion.toJSON()),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteQuestionFromQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mUser = await User.findOne({uid: req.user?.uid});
    if (!mUser) {
      throw new AuthorizationError();
    }
    const {quizId, questionId} = req.params;
    // Validate Quiz Exists
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) throw new NotFoundError('Quiz not found');

    if (req.user?.role! === UserRoles[1]) {
      // Ensure the courseId in Chapter matches the instructor's courseId
      const chapter = await Chapter.findOne({ quiz: quizId }).populate('courseId', 'instrID').lean();
      if (!chapter) throw new NotFoundError('Chapter not found');
      if (!(chapter.courseId as any).instrID.equals(mUser._id)) {
        throw new AuthorizationError('You do not have permission to modify this quiz');
      }
    }

    // delete the question from the quiz
    await Question.findByIdAndDelete(questionId);

    // Update the quiz
    await Quiz.findByIdAndUpdate(quizId, {
      $pull: { questions: questionId }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const submitQuizAttempt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quizId } = req.params;
    const mUser = await User.findOne({uid: req.user?.uid}).lean();
    if(!mUser) throw new AuthenticationError();

    const validatedData = await quizAttemptValidationSchema.parseAsync(req.body);

    const quiz = await Quiz.findById(quizId).populate('questions').lean();
    if (!quiz) return next(new NotFoundError('Quiz not found'));

    const chapter = await Chapter.findById(quiz.chapterId).populate('courseId', 'name').lean();
    if (!chapter) return next(new NotFoundError('Chapter not found'));

    const payment = await Payment.findOne({ courseId: chapter.courseId, userId: mUser._id });
    if (!payment) return next(new AuthorizationError('You have not purchased this course'));

    const existingAttempt = await QuizAttempt.findOne({ quizId, userId: mUser._id });
    if (!existingAttempt) return next(new AuthorizationError('You must start the quiz first'));

    if (existingAttempt.completedAt) {
      return next(new AuthorizationError('This quiz has already been completed.'));
    }

    const now = new Date();
    const elapsedMinutes = (now.getTime() - existingAttempt.startedAt.getTime()) / 60000;
    if (elapsedMinutes > quiz.timeLimit) {
      return next(new AuthorizationError(`Time limit of ${quiz.timeLimit} minutes exceeded.`));
    }

    let score = 0;
    const gradedAnswers = validatedData.answers.map((answer) => {
      const question = quiz.questions.find(q =>
        q._id.toString() === answer.questionId.toString()
      );
      if (!question) return null;

      const isCorrect = answer.selectedOption === (question as any).correctAnswer;
      if (isCorrect) score += (question as any).points;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
      };
    }).filter(Boolean);

    const totalPoints = quiz.questions.reduce((acc, q) => acc + (q as any).points, 0);
    const percentageScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    // Finalize the attempt
    existingAttempt.answers = validatedData.answers.map((a) => ({
      questionId: new Types.ObjectId(a.questionId),
      selectedOption: a.selectedOption,
    }));
        existingAttempt.score = percentageScore;
    existingAttempt.completedAt = now;
    await existingAttempt.save();

    await evaluateCourseCompletion(
      mUser._id.toString(),
      mUser.name || mUser._id.toString(),
      (chapter.courseId as any)._id.toString(),
      (chapter.courseId as any).name
    );
    res.status(200).json({
      score: percentageScore,
      passed: percentageScore >= quiz.passingPercentage,
      answers: gradedAnswers,
    });
  } catch (error) {
    next(error);
  }
};

export const startQuizAttempt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quizId } = req.params;
    const mUser = await User.findOne({uid: req.user?.uid}).lean();
    if(!mUser) throw new AuthenticationError();
    const userId = mUser._id;

    const quiz = await Quiz.findById(quizId).populate('questions', '-correctAnswer').lean();
    if (!quiz) throw new NotFoundError('Quiz not found');

    const chapter = await Chapter.findById(quiz.chapterId).lean();
    if (!chapter) throw new NotFoundError('Chapter not found');

    const payment = await Payment.findOne({
      courseId: chapter.courseId,
      userId,
    });

    if (!payment) throw new AuthorizationError('You have not purchased this course');

    let attempt = await QuizAttempt.findOne({ quizId, userId });

    if (!attempt) {
      attempt = await QuizAttempt.create({
        quizId,
        userId,
        startedAt: new Date(),
      });
    } else if (attempt.completedAt) {
      return next(new AuthorizationError('You have already completed this quiz.'));
    }

    res.status(200).json({
      quizId: quiz._id,
      name: quiz.name,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      startedAt: attempt.startedAt,
      questions: quiz.questions.map((q: any) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points,
      })),
    });
  } catch (error) {
    next(error);
  }
};
export const getQuizResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;

    const mUser = await User.findOne({ uid: req.user?.uid }).lean();
    if (!mUser) throw new AuthenticationError();

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) throw new NotFoundError('Quiz not found');

    const attempt = await QuizAttempt.findOne({
      quizId,
      userId: mUser._id,
    }).lean();

    if (!attempt) {
      return next(new NotFoundError('No attempt found for this quiz'));
    }

    const passed = attempt.score >= quiz.passingPercentage;

    return res.status(200).json({
      score: attempt.score,
      passed,
      answers: attempt.answers,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quizId } = req.params;
    const updateData = await quizValidationSchema.partial().parseAsync(req.body);

    const quiz = await Quiz.findById(quizId).populate('chapterId', 'courseId');
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    // Check authorization
    if (req.user?.role === UserRoles[1]) {
      const chapter = await Chapter.findById(quiz.chapterId).populate('courseId', 'instrID').lean();
      if (!chapter) throw new NotFoundError('Chapter not found');

      const mUser = await User.findOne({ uid: req.user.uid });
      if (!mUser) throw new AuthenticationError();

      if ((chapter.courseId as any).instrID.toString() !== (mUser._id as any).toString()) {
        throw new AuthorizationError('You cannot modify quizzes in other instructors\' courses');
      }
    }

    // Update allowed fields
    if (updateData.name !== undefined) quiz.name = updateData.name;
    if (updateData.description !== undefined) quiz.description = updateData.description;
    if (updateData.passingPercentage !== undefined) quiz.passingPercentage = updateData.passingPercentage;
    if (updateData.timeLimit !== undefined) quiz.timeLimit = updateData.timeLimit;
    if (updateData.isPublished !== undefined) quiz.isPublished = updateData.isPublished;

    await quiz.save();
    res.json(cleanMongoData(quiz.toJSON()));
  } catch (error) {
    next(error);
  }
};
