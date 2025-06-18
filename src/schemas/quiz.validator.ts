import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Chapter, Question } from '../models';

export const quizValidationSchema = z.object({
  chapterId: objectIdValidator(Chapter, "Chapter id"),
  name: z.string()
    .min(1, 'Title is required'),
  description: z.string()
    .optional(),
<<<<<<< HEAD
  passingPercentage: z.preprocess(
    (val) => {
      if (typeof val === 'string') return parseInt(val);
      return val;
    },
    z.number()
      .int()
      .min(0)
      .max(100)
  ).default(80),
  timeLimit: z.preprocess(
    (val) => {
      if (typeof val === 'string') return parseInt(val);
      return val;
    },
    z.number()
      .int()
      .positive('Time limit must be positive')
  ).default(30),
  isPublished: z.boolean()
    .default(false),
  questions: objectIdValidator(Question, "questions Id").optional()
=======
  passingPercentage: z.number()
    .int()
    .min(0)
    .max(100)
    .default(80),
  timeLimit: z.number()
    .int()
    .positive('Time limit must be positive')
    .default(30),
  isPublished: z.boolean()
    .default(false),
    questions: objectIdValidator(Question, "questions Id").optional()
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
});

export type QuizInput = z.infer<typeof quizValidationSchema>;
