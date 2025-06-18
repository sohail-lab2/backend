import { Router } from 'express';
import { authorize, authenticate } from '../middleware/auth';
import {
  addQuestionToQuiz,
  createQuiz,
  deleteQuestionFromQuiz,
  deleteQuiz,
  getQuiz,
  getQuizResult,
  startQuizAttempt,
  submitQuizAttempt,
  updateQuiz,
} from '../controllers/quiz.controller';
import { UserRoles } from '../schemas';

const quizRouter = Router();

quizRouter.use(authenticate);
quizRouter.post(
  '/',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  createQuiz,
);

quizRouter.get(
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  getQuiz
)

quizRouter.patch(
  '/:quizId',
  authorize([UserRoles[2], UserRoles[3], UserRoles[1]]),
  updateQuiz
)
quizRouter.post(
  '/:quizId/questions',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  addQuestionToQuiz,
);

quizRouter.delete(
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuiz,
);

quizRouter.delete(
  '/:quizId/questions/:questionId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuestionFromQuiz,
);

quizRouter.post(
  '/:quizId/attempt/start',
  authorize([UserRoles[0]]),
  startQuizAttempt,
);

quizRouter.post(
  '/:quizId/attempt/submit',
  authorize([UserRoles[0]]),
  submitQuizAttempt,
);

quizRouter.get(
  '/:quizId/result',
  authorize([UserRoles[0]]),
  getQuizResult
);

export default quizRouter;
