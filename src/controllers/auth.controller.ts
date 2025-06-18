import { Response, NextFunction } from 'express';
import { auth } from '../config/firebase.config';
import { AuthRequest } from '../middleware/auth';
<<<<<<< HEAD
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
=======
import { baseUserValidationSchema, createStudentValidationSchema, createUserValidationSchema, UserRoles, CreateUserInput, updateStudentValidationSchema, deleteStudentValidationSchema, DeleteStudent } from '../schemas';
import { User } from '../models';
import { AppError, AuthenticationError, AuthorizationError, ConflictError, NotFoundError } from '../middleware/errorHandler';
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
    const { displayName, photoURL, phoneNumber } = user;

    const mUser = await User.findOne({ uid: req.user.uid }).lean();
    if (mUser) {
      throw new ConflictError('User already registered');
=======
    const { displayName, photoURL, phoneNumber} = user;

    const mUser = await User.findOne({uid: req.user.uid}).lean();
    if(mUser){
      throw new ConflictError("User already registered");
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
    let values: any = await baseUserValidationSchema.partial().parseAsync(req.body);

=======
    let values:any = await baseUserValidationSchema.partial().parseAsync(req.body);
    
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    const file = req.file as Express.Multer.File;
    if (file) {
      values.photoUrl = `/profiles/${req.user?.role!}/${file.filename}`;
    }
    const oldUser = await User.findOne({ uid: req.user.uid }).lean();
<<<<<<< HEAD
    if (!oldUser) throw new AuthenticationError();
    if (file && oldUser.photoUrl) {
      try {
        fs.unlinkSync(path.resolve(config.storagePath + oldUser.photoUrl));
      } catch (err) {
=======
    if(!oldUser) throw new AuthenticationError();
    if(file && oldUser.photoUrl){
      try{
        fs.unlinkSync(path.resolve(config.storagePath + oldUser.photoUrl));
      }catch(err){
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
=======
    // 🧹 Clean up uploaded profile photo on error
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
    let userDetail: CreateUserInput = await createUserValidationSchema.parseAsync(req.body);

    if (
      (userDetail.role === UserRoles[3] || userDetail.role == UserRoles[2]) &&
      req.user?.role !== UserRoles[3]
    ) {
      throw new AuthorizationError();
    }

    if (userDetail.role === UserRoles[0]) {
=======
    let userDetail:CreateUserInput = await createUserValidationSchema.parseAsync(req.body);
    
    // only Admin can create admin or course manager
    if((userDetail.role === UserRoles[3] || userDetail.role == UserRoles[2]) && req.user?.role !== UserRoles[3]){
      throw new AuthorizationError();
    }

    // parse User data if student is to create
    if(userDetail.role === UserRoles[0]){
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
      uid: userCredential.uid,
    };
    await auth.setCustomUserClaims(finalUserData.uid, { role: finalUserData.role });
    await auth.updateUser(finalUserData.uid, { emailVerified: true });
=======
      uid: userCredential.uid
    };
    await auth.setCustomUserClaims(finalUserData.uid, { role: finalUserData.role });
    await auth.updateUser(finalUserData.uid, { emailVerified: true}); // marking all admin created mail as verified
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
      { new: true, lean: true }
=======
      { new: true, lean:true }
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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

<<<<<<< HEAD
    const requesterRole = req.user?.role;

    const allowedRolesForManager = [UserRoles[0], UserRoles[1]];
=======
    // If the requesting user is a COURSE-MANAGER, restrict viewable roles
    const requesterRole = req.user?.role;

    const allowedRolesForManager = [UserRoles[0], UserRoles[1]]; // STUDENT, INSTRUCTOR
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

    const filteredFirebaseUsers = listUsersResult.users.filter(user => {
      const userRole = user.customClaims?.role;

<<<<<<< HEAD
=======
      // Enforce course manager role restriction
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
      if (
        requesterRole === UserRoles[2] &&
        userRole &&
        !allowedRolesForManager.includes(userRole)
      ) {
        return false;
      }

<<<<<<< HEAD
      const matchesEmail =
        email && typeof email === 'string'
          ? user.email?.toLowerCase().includes(email.toLowerCase())
          : true;

      const matchesRole =
        role && typeof role === 'string'
          ? userRole?.toLowerCase() === role.toLowerCase()
          : true;
=======
      const matchesEmail = email && typeof email === 'string'
        ? user.email?.toLowerCase().includes(email.toLowerCase())
        : true;

      const matchesRole = role && typeof role === 'string'
        ? userRole?.toLowerCase() === role.toLowerCase()
        : true;
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

      return matchesEmail && matchesRole;
    });

    const filteredUids = filteredFirebaseUsers.map(user => user.uid);

    let mongoUsers = await User.find({ uid: { $in: filteredUids } }).lean();
    mongoUsers = cleanMongoData(mongoUsers!);

<<<<<<< HEAD
    const firebaseUsersMap = new Map(filteredFirebaseUsers.map(user => [user.uid, user]));
=======
    const firebaseUsersMap = new Map(
      filteredFirebaseUsers.map(user => [user.uid, user])
    );
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

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

<<<<<<< HEAD
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
=======

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const details:DeleteStudent = await deleteStudentValidationSchema.parseAsync(req.body);
    const userToDelete = await auth.getUser(details.profileUID);
    const userRole = userToDelete.customClaims?.role;

    const allowedRolesForManager = [UserRoles[0], UserRoles[1]]; // STUDENT, INSTRUCTOR

    // Check if course manager is trying to delete unauthorized role
    if (req.user?.role! === UserRoles[2] && userRole && !allowedRolesForManager.includes(userRole)) {
      throw new AuthorizationError('Course managers can only delete students and instructors');
    }

    // Delete from Firebase
    await auth.deleteUser(details.profileUID);

    // Delete from MongoDB
    await User.deleteOne({uid: details.profileUID});
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
