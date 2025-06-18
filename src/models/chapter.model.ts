import mongoose, { Schema, Types, Document } from 'mongoose';

export interface IChapter extends Document {
  name: string;
  order: number;
  courseId: Types.ObjectId;
  modules?: Types.ObjectId[];
  quiz?: Types.ObjectId;
}

const chapterSchema = new Schema<IChapter>(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

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

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);