import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Course, User } from '../models';

export const paymentMethod = ['ONLINE', 'OFFLINE'] as const;
export type PaymentMethod = (typeof paymentMethod)[number];

export const paymentValidationSchema = z.object({
  courseId: objectIdValidator(Course, "Course Id"),
  userId: objectIdValidator(User, 'User id'),
  amount: z.number()
    .min(0, 'Amount cannot be negative'),
  method: z.enum(paymentMethod, {
      required_error: 'Payment method is required',
      invalid_type_error: 'Invalid Payment method',
    }),
  paymentId: z.string()
    .trim()
    .optional(),
});

export type PaymentInput = z.infer<typeof paymentValidationSchema>;
