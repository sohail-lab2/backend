import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Course, User } from '../models';

export const reviewQuerySchema = z.object({
  courseId: objectIdValidator(Course, 'Course id').optional(), 
  studentId: objectIdValidator(User, 'User Id').optional(),  
  rating: z
    .preprocess((val) => (val ? Number(val) : undefined), z
      .number()
      .int()
      .min(1)
      .max(5))
    .optional(),
  comment: z.string().trim().min(1).optional(),
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1))
    .optional(),
  limit: z
    .preprocess((val) => (val ? Number(val) : 10), z.number().int().min(1))
    .optional(),
  sort: z.string().optional(),
});


export const reviewValidationSchema = z.object({
  courseId: objectIdValidator(Course, 'Course id'),
  rating: z
      .preprocess((val) => parseFloat(val as string), z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5')),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must not exceed 1000 characters')
    .trim(),
});

export type ReviewInput = z.infer<typeof reviewValidationSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;