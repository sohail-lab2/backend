import { Document, Types } from 'mongoose';
import { Schema } from 'mongoose';
import mongoose from 'mongoose';
export interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  instrID: Types.ObjectId;
  aggregateRating: number;
  buysCnt: number;
  bannerUrl: string;
  isPublished: boolean;
  chapters: Types.ObjectId[];
  reviews: Types.ObjectId[];
}

export const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      minlength: [3, 'Course name must be at least 3 characters long'],
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Course description must be at least 10 characters long'],
      maxlength: [2000, 'Course description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
      set: (v: number) => Math.round(v*100)/100,
      validate: {
        validator: function (v) {
          return /^\d+(\.\d{1,2})?$/.test(v.toString());
        },
        message: 'Price can have at most two decimal places'
      }
  },
    instrID: {
      type: Schema.Types.ObjectId,
      required: [true, 'Instructor ID is required'],
      ref: 'User',
    },
    bannerUrl: {
      type: String,
      required: [true, 'Course banner is required'],
      trim: true,
    },
    aggregateRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    buysCnt: {
      type: Number,
      default: 0,
      min: [0, 'Buy count cannot be negative'],
    },
    chapters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
courseSchema.index({ instrID: 1 }); // For instructor-based queries
courseSchema.index({ name: 'text', description: 'text' }); // For text search
courseSchema.index({ price: 1 }); // For price-based sorting and filtering
courseSchema.index({ aggregateRating: -1 }); // For rating-based sorting
courseSchema.index({ buysCnt: -1 }); // For popularity-based sorting
courseSchema.index({ createdAt: -1 }); // For time-based sorting 

export const Course = mongoose.model<ICourse>('Course', courseSchema);