import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuizAttempt extends Document {
    userId: Types.ObjectId;
    quizId: Types.ObjectId;
    answers: {
      questionId: Types.ObjectId;
      selectedOption: number;
    }[];
    score: number;
    startedAt: Date;
    completedAt?: Date;
}

export const quizAttemptSchema = new Schema<IQuizAttempt>({
    userId: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    answers: [{
        questionId: {
            type: Schema.Types.ObjectId, 
            ref: 'Question',
            required: true 
        },
        selectedOption: { type: Number, required: true },
    }],
    score: { type: Number, default: 0, min: 0},
      startedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
    },
    { timestamps: true }
  );

quizAttemptSchema.index({ quizId: 1, userId: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);