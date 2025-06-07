import {z} from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Quiz, Question } from '../models';

export const quizAttemptValidationSchema = z.object({
    quizId: objectIdValidator(Quiz, 'Quiz ID'),
    answers: z.array(z.object({
      questionId: objectIdValidator(Question, "Question Id"),
      selectedOption: z.number().int().min(0),
    })).min(1, 'At least one answer is required'),
  });
  
  export type QuizAttemptInput = z.infer<typeof quizAttemptValidationSchema>;
  