import { Review, Course } from '../models';
import { Types } from 'mongoose';

export const updateCourseRating = async (courseId: Types.ObjectId | string) => {
  const stats = await Review.aggregate([
    { $match: { courseId: new Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating || 0;
  await Course.findByIdAndUpdate(courseId, { aggregateRating: averageRating });
};
