import mongoose, { Document, Schema, Types } from 'mongoose';
export interface IChapter extends Document {
  name: string;
  order: number;
  courseId: Types.ObjectId;
  modules?: Types.ObjectId[];
  quiz?: Types.ObjectId;
}

// Mongoose Schema
const chapterSchema = new Schema<IChapter>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for optimized querying
chapterSchema.index({ courseId: 1, order: 1 }, { unique: true }); // Compound index for unique order within course
chapterSchema.index({ courseId: 1 }); // Single field index for course lookups
chapterSchema.index({ createdAt: -1 }); // Index for sorting by creation date
chapterSchema.index({ name: 'text'}); // Text index for search functionality

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);