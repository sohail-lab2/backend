import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Chapter } from '../models';

export const moduleValidationSchema = z.object({
  name: z.string()
    .min(3, 'Module name must be at least 3 characters long')
    .max(100, 'Module name cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Module description must be at least 10 characters long')
    .max(1000, 'Module description cannot exceed 1000 characters')
    .trim(),
  videoId: z.string()
    .min(1, 'Video ID is required')
    .trim(),
  chapterId: objectIdValidator(Chapter, "Chapter"),
  order: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1, 'Starting from 1')),
  pdfs: z.array(z.string()).optional(),
});

export type ModuleInput = z.infer<typeof moduleValidationSchema>;
