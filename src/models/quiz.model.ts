import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IQuiz extends Document {
  chapterId: Types.ObjectId;
  name: string;
  description: string;
  passingPercentage: number;
  timeLimit: number;
  isPublished: boolean;
  questions: Types.ObjectId[];
}

export const quizSchema = new Schema<IQuiz>({
  chapterId: { 
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true },
  name: { type: String, required: true, trim: true},
  description: String,
  passingPercentage: { type: Number, default: 80, min:0, max:100 },
  timeLimit: { type: Number, default: 30, min: 1},
  isPublished: { type: Boolean, default: false },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
 });

// Indexes
quizSchema.index({ chapterId: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
