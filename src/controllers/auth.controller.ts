import { Response, NextFunction } from 'express';
import { auth } from '../config/firebase.config';
import { AuthRequest } from '../middleware/auth';
import {
  baseUserValidationSchema,
  createStudentValidationSchema,
  createUserValidationSchema,
  UserRoles,
  CreateUserInput,
  updateStudentValidationSchema,
  deleteStudentValidationSchema,
  DeleteStudent,
} from '../schemas';
import { User } from '../models';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';
import fs from 'fs';
import path from 'path';
import { config } from '../config/variables.config';

export const newStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.uid) {
      throw new AppError('User ID is required', 400, true);
    }

    await auth.setCustomUserClaims(req.user.uid, { role: UserRoles[0] });
    const user = await auth.getUser(req.user.uid);
    const { displayName, photoURL, phoneNumber } = user;

    const mUser = await User.findOne({ uid: req.user.uid }).lean();
    if (mUser) {
      throw new ConflictError('User already registered');
    }

    await User.create({
      uid: req.user.uid,
      name: displayName,
      photoUrl: photoURL,
      contactNumber: phoneNumber,
      role: UserRoles[0],
    });
    res.status(201).json({ message: 'Student role assigned and created' });
  } catch (err) {
    next(err);
  }
};

export const getUserDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.uid) {
      throw new AppError('User ID is required', 400, true);
    }

    const firebaseUser = await auth.getUser(req.user.uid);
    let mongoUser = await User.findOne({ uid: req.user.uid }).lean();
    mongoUser = cleanMongoData(mongoUser!);
    if (!mongoUser) {
      throw new NotFoundError('User not found in database');
    }

    return res.status(200).json({
      ...mongoUser,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      disabled: firebaseUser.disabled,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUserDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.uid) {
      throw new AppError('User ID is required', 400, true);
    }
    let values: any = await baseUserValidationSchema.partial().parseAsync(req.body);

    const file = req.file as Express.Multer.File;
    if (file) {
      values.photoUrl = `/profiles/${req.user?.role!}/${file.filename}`;
    }
    const oldUser = await User.findOne({ uid: req.user.uid }).lean();
    if (!oldUser) throw new AuthenticationError();
    if (file && oldUser.photoUrl) {
      try {
        fs.unlinkSync(path.resolve(config.storagePath + oldUser.photoUrl));
      } catch (err) {
        console.warn(`Failed to delete Profile photo: ${config.storagePath + oldUser.photoUrl}`, err);
      }
    }
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: values },
      { new: true, lean: true }
    );
    return res.status(200).json(cleanMongoData(user!));
  } catch (error) {
    const file = req.file as Express.Multer.File;
    if (file) {
      try {
        fs.unlinkSync(path.resolve(file.path));
      } catch (err) {
        console.warn(`Failed to delete profile photo: ${file.path}`, err);
      }
    }
    return next(error);
  }
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    let userDetail: CreateUserInput = await createUserValidationSchema.parseAsync(req.body);

    if (
      (userDetail.role === UserRoles[3] || userDetail.role == UserRoles[2]) &&
      req.user?.role !== UserRoles[3]
    ) {
      throw new AuthorizationError();
    }

    if (userDetail.role === UserRoles[0]) {
      userDetail = await createStudentValidationSchema.parseAsync(req.body);
    } else {
      delete (userDetail as any).studentClass;
      delete (userDetail as any).schoolName;
    }

    const { email, password, ...userData } = userDetail;
    const userCredential = await auth.createUser({
      email: email,
      password: password,
    });
    const finalUserData = {
      ...userData,
      uid: userCredential.uid,
    };
    await auth.setCustomUserClaims(finalUserData.uid, { role: finalUserData.role });
    await auth.updateUser(finalUserData.uid, { emailVerified: true });
    await User.create(finalUserData);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    next(err);
  }
};

export const updateStudentDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const values = await updateStudentValidationSchema.partial().parseAsync(req.body);
    const user = await User.findOneAndUpdate(
      { uid: values.profileUID },
      { $set: values },
      { new: true, lean: true }
    );
    return res.status(200).json(cleanMongoData(user!));
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { email, role } = req.query;

  try {
    const listUsersResult = await auth.listUsers();

    const requesterRole = req.user?.role;

    const allowedRolesForManager = [UserRoles[0], UserRoles[1]];

    const filteredFirebaseUsers = listUsersResult.users.filter(user => {
      const userRole = user.customClaims?.role;

      if (
        requesterRole === UserRoles[2] &&
        userRole &&
        !allowedRolesForManager.includes(userRole)
      ) {
        return false;
      }

      const matchesEmail =
        email && typeof email === 'string'
          ? user.email?.toLowerCase().includes(email.toLowerCase())
          : true;

      const matchesRole =
        role && typeof role === 'string'
          ? userRole?.toLowerCase() === role.toLowerCase()
          : true;

      return matchesEmail && matchesRole;
    });

    const filteredUids = filteredFirebaseUsers.map(user => user.uid);

    let mongoUsers = await User.find({ uid: { $in: filteredUids } }).lean();
    mongoUsers = cleanMongoData(mongoUsers!);

    const firebaseUsersMap = new Map(filteredFirebaseUsers.map(user => [user.uid, user]));

    const mergedUsers = mongoUsers.map(mongoUser => {
      const firebaseUser = firebaseUsersMap.get(mongoUser.uid);
      return {
        ...mongoUser,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        disabled: firebaseUser?.disabled,
      };
    });

    return res.status(200).json(mergedUsers);
  } catch (error) {
    return next(new AppError(`Fetching all users failed with ${error}`, 500));
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const details: DeleteStudent = await deleteStudentValidationSchema.parseAsync(req.body);
    const userToDelete = await auth.getUser(details.profileUID);
    const userRole = userToDelete.customClaims?.role;

    const allowedRolesForManager = [UserRoles[0], UserRoles[1]];

    if (
      req.user?.role === UserRoles[2] &&
      userRole &&
      !allowedRolesForManager.includes(userRole)
    ) {
      throw new AuthorizationError('Course managers can only delete students and instructors');
    }

    const mongoUserToDelete = await User.findOne({ uid: details.profileUID });

    if (!mongoUserToDelete) {
      await auth.deleteUser(details.profileUID);
      return res.status(204).send();
    }

    await mongoUserToDelete.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
