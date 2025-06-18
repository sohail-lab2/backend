import mongoose, { Types } from 'mongoose';
import { Schema } from 'mongoose';
import { Document } from 'mongoose';
export interface IReview extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  rating: number;
  comment: string;
}

export const reviewSchema = new Schema<IReview>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index to ensure one review per student per course
reviewSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
reviewSchema.index({courseId:1, rating: 1});
// Add text index for comment search
reviewSchema.index({ comment: 'text' });

<<<<<<< HEAD
=======
;
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
export const Review = mongoose.model<IReview>('Review', reviewSchema);