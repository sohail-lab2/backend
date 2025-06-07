import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Chapter, Question } from '../models';

export const quizValidationSchema = z.object({
  chapterId: objectIdValidator(Chapter, "Chapter id"),
  name: z.string()
    .min(1, 'Title is required'),
  description: z.string()
    .optional(),
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
});

export type QuizInput = z.infer<typeof quizValidationSchema>;
