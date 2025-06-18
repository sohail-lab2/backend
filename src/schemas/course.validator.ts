import { z } from 'zod';
import { objectIdValidator } from './objectID.validator';
import { Chapter, Review } from '../models';

export const courseValidationSchema = z.object({
  name: z.string()
    .min(3, 'Course name must be at least 3 characters long')
    .max(100, 'Course name cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Course description must be at least 10 characters long')
    .max(2000, 'Course description cannot exceed 2000 characters')
    .trim(),
  price: z.preprocess((val) => parseFloat(val as string), z.number().min(0, 'Price cannot be negative')),
<<<<<<< HEAD
=======
  // instrID: objectIdValidator(User, "instrId"), gurentee as internally generated
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  aggregateRating: z.number()
    .min(0, 'Rating cannot be less than 0')
    .max(5, 'Rating cannot be more than 5')
    .optional()
    .default(0),
  buysCnt: z.number()
    .min(0, 'Buy count cannot be negative')
    .optional()
    .default(0),
  bannerUrl: z.string().optional(),
<<<<<<< HEAD
  isPublished: z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true';
    return false;
  }, z.boolean().optional().default(false)),
=======
  isPublished: z.boolean().optional().default(false),
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  chapters: z.array(objectIdValidator(Chapter, 'Chapter id(s)')).optional().default([]),
  reviews: z.array(objectIdValidator(Review, "Review id(s)")).optional().default([]),
});

export type CourseInput = z.infer<typeof courseValidationSchema>;
