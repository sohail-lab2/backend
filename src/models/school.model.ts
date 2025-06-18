import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  coursesPricing: {
    courseId: Types.ObjectId;
    price: number;
  }[];
}

const schoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    coursesPricing: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

schoolSchema.index({ 'coursesPricing.courseId': 1 });

export const School = mongoose.model<ISchool>('School', schoolSchema);
