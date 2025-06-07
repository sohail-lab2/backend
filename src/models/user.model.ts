import mongoose, { Types } from 'mongoose';
import { Document, Schema } from 'mongoose';
import { UserRole, UserRoles } from '../schemas/user.validator';

export interface IUser extends Document {
  uid: string;
  name?: string; 
  photoUrl?: string;
  role: UserRole;
  contactNumber?: string;
  schoolName?: string;  
  studentClass?: string;
  coursesCreated?: Types.ObjectId[];
}

// Mongoose schema
export const mongooseUserSchema = new Schema<IUser>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: false,
    },
    photoUrl: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: UserRoles,
      required: true,
    },
    contactNumber: {
      type: String,
      required: false,
      validate: {
        validator: (value: string) => /^\+?[1-9]\d{1,14}$/.test(value),
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    schoolName: {
      type: String,
      required: false,
    },
    studentClass: {
      type: String,
      required: false,
    },
    coursesCreated: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
mongooseUserSchema.index({ role: 1 });
mongooseUserSchema.index({ name: 'text' });

;
export const User = mongoose.model<IUser>('User', mongooseUserSchema);