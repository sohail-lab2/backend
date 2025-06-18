import {z} from 'zod';
import { objectIdValidator } from './objectID.validator';
<<<<<<< HEAD
import { Question } from '../models';

export const quizAttemptValidationSchema = z.object({
=======
import { Quiz, Question } from '../models';

export const quizAttemptValidationSchema = z.object({
    quizId: objectIdValidator(Quiz, 'Quiz ID'),
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    answers: z.array(z.object({
      questionId: objectIdValidator(Question, "Question Id"),
      selectedOption: z.number().int().min(0),
    })).min(1, 'At least one answer is required'),
  });
  
  export type QuizAttemptInput = z.infer<typeof quizAttemptValidationSchema>;
  