import { Quiz } from '../models';
import {z} from 'zod';
import { objectIdValidator } from './objectID.validator';

export const questionValidationSchema = z.object({
    quizId: objectIdValidator(Quiz, 'Quiz Id').optional(),
    question: z.string().min(1, 'Question is required'),
    options: z.array(z.string().min(1)).min(2, 'At least two options are required'),
    correctAnswer: z.number().int(),
    points: z.number().int().min(1).default(1),
  }).refine((data) => {
    return data.correctAnswer >= 0 && data.correctAnswer < data.options.length;
  }, {
    message: 'Correct answer index must match one of the options',
    path: ['correctAnswer'],
  });
  
 export type QuestionInput = z.infer<typeof questionValidationSchema>;