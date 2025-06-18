import mongoose, { Types, Document, Schema } from 'mongoose';
import { UserRole, UserRoles } from '../schemas/user.validator';
import { auth } from '../config/firebase.config';

export type IUser = Document & {
  uid: string;
  name?: string;
  photoUrl?: string;
  role: UserRole;
  contactNumber?: string;
  schoolName?: string;
  studentClass?: string;
  coursesCreated?: Types.ObjectId[];
};

export const mongooseUserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    name: { type: String, trim: false },
    photoUrl: { type: String },
    role: { type: String, enum: UserRoles, required: true },
    contactNumber: {
      type: String,
      validate: {
        validator: (value: string) => /^\+?[1-9]\d{1,14}$/.test(value),
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    schoolName: { type: String },
    studentClass: { type: String },
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
  }
);

mongooseUserSchema.index({ role: 1 });
mongooseUserSchema.index({ name: 'text' });

mongooseUserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const user = this as IUser;
  try {
    if (user.uid) {
      try {
        await auth.deleteUser(user.uid);
      } catch (firebaseError: any) {
        if (firebaseError.code !== 'auth/user-not-found') {
          return next(firebaseError);
        }
      }
    }
    const Payment = mongoose.model('Payment');
    const Progress = mongoose.model('Progress');
    const QuizAttempt = mongoose.model('QuizAttempt');
    const Review = mongoose.model('Review');
    const Certificate = mongoose.model('Certificate');
    const Course = mongoose.model('Course');
    if (user.role === 'INSTRUCTOR' && user.coursesCreated && user.coursesCreated.length > 0) {
      const activeCourses = await Course.countDocuments({ _id: { $in: user.coursesCreated } });
      if (activeCourses > 0) {
        const error = new Error(
          `Cannot delete instructor user '${user.name}' (${user._id}) as they are an instructor for ${activeCourses} active courses. Please delete their courses first.`
        );
        return next(error);
      }
    }
    await Promise.all([
      Payment.deleteMany({ userId: user._id }),
      Progress.deleteMany({ studentId: user._id }),
      QuizAttempt.deleteMany({ userId: user._id }),
      Review.deleteMany({ studentId: user._id }),
      Certificate.deleteMany({ user: user._id }),
    ]);
    next();
  } catch (error) {
    next(error);
  }
});

export const User = mongoose.model<IUser>('User', mongooseUserSchema);