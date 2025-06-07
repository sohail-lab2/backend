import mongoose, { Document, Schema, Types } from 'mongoose';
import { ProgressStatus, ProgressStatuses } from '../schemas/progress.validator';
export interface IProgress extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  chapterId: Types.ObjectId;
  moduleId: Types.ObjectId;
  status: ProgressStatus;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

// Mongoose Schema
const progressSchema = new Schema<IProgress>(
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
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    status: {
      type: String,
      enum: ProgressStatuses,
      default: ProgressStatuses[0],
    },
    completedAt: {
      type: Date,
      default: null
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
progressSchema.index({ studentId: 1, courseId: 1, moduleId: 1 });
progressSchema.index({ studentId: 1, moduleId: 1 }, { unique: true });
progressSchema.index({ status: 1 });
progressSchema.index({ updatedAt: -1 }); // For sorting by last accessed

export const Progress = mongoose.model<IProgress>('Progress', progressSchema); 