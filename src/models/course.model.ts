<<<<<<< HEAD
import { Document, Types, Schema } from 'mongoose';
import mongoose from 'mongoose';
import { deleteFile } from '../services';
import path from 'path';
import { config } from '../config/variables.config';

export type ICourse = Document & {
=======
import { Document, Types } from 'mongoose';
import { Schema } from 'mongoose';
import mongoose from 'mongoose';
export interface ICourse extends Document {
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
};
=======
}
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

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
<<<<<<< HEAD
      set: (v: number) => Math.round(v * 100) / 100,
      validate: {
        validator: function (v: number) {
=======
      set: (v: number) => Math.round(v*100)/100,
      validate: {
        validator: function (v) {
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
          return /^\d+(\.\d{1,2})?$/.test(v.toString());
        },
        message: 'Price can have at most two decimal places'
      }
<<<<<<< HEAD
    },
=======
  },
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
      type: Boolean,
      default: false
=======
        type: Boolean,
        default: false
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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

<<<<<<< HEAD
courseSchema.index({ instrID: 1 });
courseSchema.index({ name: 'text', description: 'text' });
courseSchema.index({ price: 1 });
courseSchema.index({ aggregateRating: -1 });
courseSchema.index({ buysCnt: -1 });
courseSchema.index({ createdAt: -1 });

courseSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const course = this as ICourse;
  try {
    const Chapter = mongoose.model('Chapter');
    const Review = mongoose.model('Review');
    const Payment = mongoose.model('Payment');
    const Progress = mongoose.model('Progress');
    const Certificate = mongoose.model('Certificate');
    const User = mongoose.model('User');
    const Module = mongoose.model('Module');

    if (course.bannerUrl) {
      const bannerFilePath = path.resolve(config.storagePath + course.bannerUrl);
      deleteFile(bannerFilePath);
    }

    const chapters = await Chapter.find({ courseId: course._id });
    for (const chapter of chapters) {
      const modules = await Module.find({ chapterId: chapter._id });
      for (const module of modules) {
        if (module.pdfs && module.pdfs.length > 0) {
          module.pdfs.forEach((pdfUrl: string) => {
            const pdfFilePath = path.resolve(config.storagePath + pdfUrl);
            deleteFile(pdfFilePath);
          });
        }
      }
    }
    const chaptersToDelete = await Chapter.find({ courseId: course._id });
    await Promise.all(chaptersToDelete.map((chapter: any) => chapter.deleteOne()));

    await Promise.all([
      Review.deleteMany({ courseId: course._id }),
      Payment.deleteMany({ courseId: course._id }),
      Progress.deleteMany({ courseId: course._id }),
      Certificate.deleteMany({ course: course._id }),
    ]);

    await User.updateOne(
      { _id: course.instrID },
      { $pull: { coursesCreated: course._id } }
    );

    next();
  } catch (error) {
    next(error);
  }
});
=======
// Indexes for better query performance
courseSchema.index({ instrID: 1 }); // For instructor-based queries
courseSchema.index({ name: 'text', description: 'text' }); // For text search
courseSchema.index({ price: 1 }); // For price-based sorting and filtering
courseSchema.index({ aggregateRating: -1 }); // For rating-based sorting
courseSchema.index({ buysCnt: -1 }); // For popularity-based sorting
courseSchema.index({ createdAt: -1 }); // For time-based sorting 
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

export const Course = mongoose.model<ICourse>('Course', courseSchema);