<<<<<<< HEAD
import mongoose, { Schema, Types, Document } from 'mongoose';

=======
import mongoose, { Document, Schema, Types } from 'mongoose';
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
export interface IChapter extends Document {
  name: string;
  order: number;
  courseId: Types.ObjectId;
  modules?: Types.ObjectId[];
  quiz?: Types.ObjectId;
}

<<<<<<< HEAD
const chapterSchema = new Schema<IChapter>(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz' },
=======
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
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

<<<<<<< HEAD
chapterSchema.index({ courseId: 1, order: 1 }, { unique: true });
chapterSchema.index({ courseId: 1 });
chapterSchema.index({ modules: 1})
chapterSchema.index({ createdAt: -1 });
chapterSchema.index({ name: 'text' });

chapterSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const chapter = this as IChapter;
  try {
    const Course = mongoose.model('Course');
    const Module = mongoose.model('Module');
    const Quiz = mongoose.model('Quiz');
    const Progress = mongoose.model('Progress');

    await Course.findByIdAndUpdate(
      chapter.courseId,
      { $pull: { chapters: chapter._id } }
    );

    const modulesToDelete = await Module.find({ chapterId: chapter._id });
    await Promise.all(modulesToDelete.map(module => module.deleteOne()));

    if (chapter.quiz) {
      const quizToDelete = await Quiz.findById(chapter.quiz);
      if (quizToDelete) {
        await quizToDelete.deleteOne();
      }
    }

    await Progress.deleteMany({ chapterId: chapter._id });

    next();
  } catch (error) {
    next(error);
  }
});
=======
// Indexes for optimized querying
chapterSchema.index({ courseId: 1, order: 1 }, { unique: true }); // Compound index for unique order within course
chapterSchema.index({ courseId: 1 }); // Single field index for course lookups
chapterSchema.index({ createdAt: -1 }); // Index for sorting by creation date
chapterSchema.index({ name: 'text'}); // Text index for search functionality
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);