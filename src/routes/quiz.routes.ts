import { Router } from 'express';
import { authorize, authenticate } from '../middleware/auth';
import {
  addQuestionToQuiz,
  createQuiz,
  deleteQuestionFromQuiz,
  deleteQuiz,
  getQuizResult,
  startQuizAttempt,
} from '../controllers/quiz.controller';
import { UserRoles } from '../schemas';

const quizRouter = Router();

quizRouter.use(authenticate);
quizRouter.post(
  '/',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  createQuiz,
);
quizRouter.post( // add question
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  addQuestionToQuiz,
);

quizRouter.delete( // remove the quiz
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuiz,
);

quizRouter.delete( //delete the question
  '/:quizId/:questionId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuestionFromQuiz,
);


quizRouter.use(authorize([UserRoles[0]]));
quizRouter.get(
  '/:quizId/start',
  authorize([UserRoles[0]]),
  startQuizAttempt,
);
quizRouter.get(
  '/:quizId/attempt',
  authorize([UserRoles[0]]),
  startQuizAttempt,
);

quizRouter.get(
  '/:quizId/result',
  authorize([UserRoles[0]]), // assuming role 0 is student
  getQuizResult
);

export default quizRouter;
