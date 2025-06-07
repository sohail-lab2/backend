import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IModule extends Document {
  name: string;
  description: string;
  videoId: string;
  chapterId: Types.ObjectId;
  order: number;
  pdfs?: string[];
}

export const moduleSchema = new Schema<IModule>(
  {
    name: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      minlength: [3, 'Module name must be at least 3 characters long'],
      maxlength: [100, 'Module name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Module description is required'],
      trim: true,
      minlength: [10, 'Module description must be at least 10 characters long'],
      maxlength: [1000, 'Module description cannot exceed 1000 characters'],
    },
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      trim: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter reference is required'],
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [1, 'Order must be at least 1'],
    },
    pdfs: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
moduleSchema.index({ chapterId: 1, order: 1 }, { unique: true }); // Ensure unique order within chapter
moduleSchema.index({ chapterId: 1 }); // For chapter-based queries
moduleSchema.index({ order: 1 }); // For order-based sorting
moduleSchema.index({ name: 'text', description: 'text' }); // For text search
moduleSchema.index({ createdAt: -1 }); // For time-based sorting

export const Module = mongoose.model<IModule>('Module', moduleSchema);
