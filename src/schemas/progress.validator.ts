import { z } from 'zod';
import mongoose from 'mongoose';

export const ProgressStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type ProgressStatus = (typeof ProgressStatuses)[number];

export const progressValidationSchema = z.object({
  studentId: z.string().refine(id => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid StudentId'}),
  courseId: z.string().refine(id => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid courseId'}),
  chapterId: z.string().refine(id => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid chapterId'}),
  moduleId: z.string().refine(id => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid moduleId'}),
  status: z.enum(ProgressStatuses, {
      required_error: 'Progress Status is required',
      invalid_type_error: 'Invalid Progress Status',
    })
    .default(ProgressStatuses[0]),
  completedAt: z.date()
    .optional(),
  timeSpent: z.number()
    .int()
    .min(0, 'Time spent must be a non-negative integer')
    .default(0),
});

export type ProgressInput = z.infer<typeof progressValidationSchema>;
