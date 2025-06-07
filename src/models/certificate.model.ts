import mongoose, { Schema, Document, Types } from 'mongoose';
export interface ICertificate extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  filePath: string;
  issuedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    filePath: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Add indexes for common query patterns
certificateSchema.index({ user: 1, course: 1 });
certificateSchema.index({ course: 1 }); 
certificateSchema.index({ issuedAt: -1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
