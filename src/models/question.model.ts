import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  quizId: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export const questionSchema = new Schema<IQuestion>({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  question: { type: String, required: true, trim: true },
  options: { type: [String], required: true,
    validate: [(val: string[]) => val.length >= 2, 'At least two options is required'],
   },
  correctAnswer: { type: Number, 
    required: true,
    validate: {
      validator: function(val: number) {
        return this.options && val >= 0 && val < this.options.length;
      },
      message: 'Correct answer index must match options length.',
    },
  },
  points: { type: Number, default: 1, min: 1 },
  }, {
    timestamps: true
  }
);

export const Question = mongoose.model<IQuestion>('Question', questionSchema);