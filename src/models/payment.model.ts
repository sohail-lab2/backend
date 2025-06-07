import mongoose, { Document, Schema, Types } from 'mongoose';
import { paymentMethod, PaymentMethod } from '../schemas';
export interface IPayment extends Document{
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  paymentId?: string;
}

// Mongoose schema
export const paymentSchema = new Schema<IPayment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Course ID is required'],
      ref: 'Course',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      enum: paymentMethod,
      required: [true, 'Define how\'s payment is done']
    },
    paymentId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
paymentSchema.index({ userId: 1, courseId: 1 }); // For user-course payment history
paymentSchema.index({ status: 1, amount: 1 }); // For payment status and amount queries
paymentSchema.index({ createdAt: -1 }); // For time-based queries
paymentSchema.index({ paymentId: 1 }); // For payment ID lookups

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);