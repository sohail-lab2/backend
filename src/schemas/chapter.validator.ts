import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Course, Module, Quiz } from '../models';

export const chapterValidationSchema = z.object({
  name: z.string().min(1, 'Title is required').trim(),
  order: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1, 'Starting from 1')),
  courseId: objectIdValidator(Course, "Course id"),
  modules: z.array(objectIdValidator(Module, "Modules")).optional().default([]),
  quiz: objectIdValidator(Quiz, 'Quiz').optional(),
});

export type ChapterInput = z.infer<typeof chapterValidationSchema>;
