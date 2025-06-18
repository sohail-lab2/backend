import { Document, Types, Schema } from 'mongoose';
import mongoose from 'mongoose';
import path from 'path';
import { config } from '../config/variables.config';
import { deleteFile } from '../services';

export type IModule = Document & {
  name: string;
  description: string;
  videoId: string;
  chapterId: Types.ObjectId;
  order: number;
  pdfs?: string[];
};

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

moduleSchema.index({ chapterId: 1, order: 1 }, { unique: true });
moduleSchema.index({ chapterId: 1 });
moduleSchema.index({ order: 1 });
moduleSchema.index({ name: 'text', description: 'text' });
moduleSchema.index({ createdAt: -1 });

moduleSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const module = this as IModule;
  try {
    const Chapter = mongoose.model('Chapter');
    const Progress = mongoose.model('Progress');
    if (module.pdfs && module.pdfs.length > 0) {
      module.pdfs.forEach(pdfUrl => {
        const pdfFilePath = path.resolve(config.storagePath + pdfUrl);
        deleteFile(pdfFilePath);
      });
    }
    await Chapter.updateOne(
      { _id: module.chapterId },
      { $pull: { modules: module._id } }
    );
    await Progress.deleteMany({ moduleId: module._id });
    next();
  } catch (error) {
    next(error);
  }
});

export const Module = mongoose.model<IModule>('Module', moduleSchema);
