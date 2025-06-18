import { Router } from 'express';
import { authorize, authenticate } from '../middleware/auth';
import {
  addQuestionToQuiz,
  createQuiz,
  deleteQuestionFromQuiz,
  deleteQuiz,
<<<<<<< HEAD
  getQuiz,
  getQuizResult,
  startQuizAttempt,
  submitQuizAttempt,
  updateQuiz,
=======
  getQuizResult,
  startQuizAttempt,
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
} from '../controllers/quiz.controller';
import { UserRoles } from '../schemas';

const quizRouter = Router();

quizRouter.use(authenticate);
quizRouter.post(
  '/',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  createQuiz,
);
<<<<<<< HEAD

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
=======
quizRouter.post( // add question
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  addQuestionToQuiz,
);

quizRouter.delete( // remove the quiz
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  '/:quizId',
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuiz,
);

<<<<<<< HEAD
quizRouter.delete(
  '/:quizId/questions/:questionId',
=======
quizRouter.delete( //delete the question
  '/:quizId/:questionId',
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  deleteQuestionFromQuiz,
);

<<<<<<< HEAD
quizRouter.post(
  '/:quizId/attempt/start',
=======

quizRouter.use(authorize([UserRoles[0]]));
quizRouter.get(
  '/:quizId/start',
  authorize([UserRoles[0]]),
  startQuizAttempt,
);
quizRouter.get(
  '/:quizId/attempt',
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  authorize([UserRoles[0]]),
  startQuizAttempt,
);

<<<<<<< HEAD
quizRouter.post(
  '/:quizId/attempt/submit',
  authorize([UserRoles[0]]),
  submitQuizAttempt,
);

quizRouter.get(
  '/:quizId/result',
  authorize([UserRoles[0]]),
=======
quizRouter.get(
  '/:quizId/result',
  authorize([UserRoles[0]]), // assuming role 0 is student
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  getQuizResult
);

export default quizRouter;
