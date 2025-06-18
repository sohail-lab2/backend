import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chapterValidationSchema, UserRoles } from '../schemas';
import { Chapter, Course, Payment, User } from '../models';
import mongoose from 'mongoose';
import { NotFoundError, AuthorizationError, AppError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';

export const getChapterById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userByUid = await User.findOne({ uid: req.user?.uid }).select('_id').lean();
    if (!userByUid) throw new NotFoundError("User not found");

    const [chapter] = await Chapter.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'courses',
          let: { courseId: '$courseId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$courseId'] } } },
            {
              $lookup: {
                from: 'users',
                let: { instrID: '$instrID' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$instrID'] } } },
                  { $project: { name: 1, uid: 1 } }
                ],
                as: 'instrID'
              }
            },
            { $unwind: '$instrID' },
            { $project: { name: 1, description: 1, price: 1, instrID: 1, aggregateRating: 1, buysCnt: 1 } }
          ],
          as: 'courseId'
        }
      },
      { $unwind: '$courseId' },
      {
        $lookup: {
          from: 'modules',
          let: { chapterId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chapterId', '$$chapterId'] } } },
            { $sort: { order: 1 } },
            { $project: { name: 1, order: 1, description: 1, videoId: 1, pdfs: 1 } }
          ],
          as: 'modules'
        }
      }
    ]);

    if (!chapter) throw new NotFoundError("Chapter not found");
    if (!chapter.courseId || !chapter.courseId.instrID)
      throw new AppError("Associated course or instructor data is incomplete for this chapter.", 500, true);

    const course = chapter.courseId;
    const instructorUid = course.instrID.uid;
    const currentUserRole = req.user?.role!;
    const currentUserUid = req.user?.uid;

    if (
      (currentUserRole === UserRoles[1] && currentUserUid === instructorUid) ||
      currentUserRole === UserRoles[2] ||
      currentUserRole === UserRoles[3]
    ) {
      return res.status(200).json(cleanMongoData(chapter));
    }

    if (currentUserRole === UserRoles[0]) {
      const hasPurchased = await Payment.findOne({
        userId: userByUid._id,
        courseId: course._id
      }).lean();

      if (!hasPurchased)
        throw new AuthorizationError("You don't have access to this chapter as you have not purchased the course.");
      return res.status(200).json(cleanMongoData(chapter));
    }

    throw new AuthorizationError("You are not authorized to view this chapter.");
  } catch (error) {
    return next(error);
  }
};

export const getPublicChapterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [chapter] = await Chapter.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'courses',
          let: { courseId: '$courseId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$courseId'] } } },
            {
              $lookup: {
                from: 'users',
                let: { instrID: '$instrID' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$instrID'] } } },
                  { $project: { name: 1, uid: 1 } }
                ],
                as: 'instrID'
              }
            },
            { $unwind: '$instrID' },
            { $project: { name: 1, description: 1, price: 1, instrID: 1, aggregateRating: 1, buysCnt: 1 } }
          ],
          as: 'courseId'
        }
      },
      { $unwind: '$courseId' },
      {
        $lookup: {
          from: 'modules',
          let: { chapterId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chapterId', '$$chapterId'] } } },
            { $sort: { order: 1 } },
            { $project: { name: 1, order: 1, description: 1 } }
          ],
          as: 'modules'
        }
      }
    ]);

    if (!chapter) throw new NotFoundError("Chapter not found");

    res.status(200).json(cleanMongoData(chapter));
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const chapterUpdateDetail = await chapterValidationSchema.partial().parseAsync(req.body);
    delete (chapterUpdateDetail as any)._id;

    const [chapter] = await Chapter.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'courses',
          let: { courseId: '$courseId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$courseId'] } } },
            {
              $lookup: {
                from: 'users',
                let: { instrID: '$instrID' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$instrID'] } } },
                  { $project: { uid: 1 } }
                ],
                as: 'instrID'
              }
            },
            { $unwind: '$instrID' }
          ],
          as: 'courseId'
        }
      },
      { $unwind: '$courseId' }
    ]);

    if (!chapter) throw new NotFoundError("Chapter not found");

    const courseInstructorUid = chapter.courseId.instrID.uid;
    const currentUserRole = req.user?.role!;
    const currentUserUid = req.user?.uid;

    if (currentUserRole === UserRoles[1] && currentUserUid !== courseInstructorUid)
      throw new AuthorizationError("Not authorized to update this chapter");
    if (
      currentUserRole !== UserRoles[1] &&
      currentUserRole !== UserRoles[2] &&
      currentUserRole !== UserRoles[3]
    ) {
      throw new AuthorizationError("Only authorized instructors, course managers, or administrators can update chapters.");
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      { $set: chapterUpdateDetail },
      { new: true, runValidators: true }
    );

    if (!updatedChapter)
      throw new AppError("Failed to update chapter after checks", 500, true);

    res.status(200).json(cleanMongoData(updatedChapter.toJSON()));
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Chapter order must be unique within a course', 400, true));
    }
    next(error);
  }
};

export const createChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.uid) throw new AuthorizationError("Authentication required.");
    const mUser = await User.findOne({ uid: req.user.uid });
    if (!mUser) throw new NotFoundError("User profile not found.");

    if (
      mUser.role !== UserRoles[1] &&
      mUser.role !== UserRoles[2] &&
      mUser.role !== UserRoles[3]
    ) {
      throw new AuthorizationError("Only instructors, course managers, or administrators can create chapters.");
    }

    const chapterData = await chapterValidationSchema.parseAsync(req.body);

    const course = await Course.findById(chapterData.courseId).populate('instrID', 'uid');
    if (!course) throw new NotFoundError("Course not found.");

    if (mUser.role === UserRoles[1] && (mUser as any)._id.toString() !== (course.instrID as any)._id.toString())
      throw new AuthorizationError("Instructors can only add chapters to their own courses.");

    const chapter = await Chapter.create(chapterData);
    await Course.findByIdAndUpdate(
      chapterData.courseId,
      { $addToSet: { chapters: chapter._id } },
      { new: true }
    );

    res.status(201).json(cleanMongoData(chapter.toJSON()));
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Chapter order must be unique within a course', 400, true));
    }
    next(error);
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const chapterToDelete = await Chapter.findById(id).populate({
      path: 'courseId',
      populate: { path: 'instrID', select: 'uid' }
    });

    if (!chapterToDelete) throw new NotFoundError("Chapter not found");

    const courseInstructorUid = (chapterToDelete.courseId as any).instrID?.uid;
    const currentUserRole = req.user?.role!;
    const currentUserUid = req.user?.uid;

    if (currentUserRole === UserRoles[1] && currentUserUid !== courseInstructorUid)
      throw new AuthorizationError("Not authorized to delete this chapter");
    if (
      currentUserRole !== UserRoles[1] &&
      currentUserRole !== UserRoles[2] &&
      currentUserRole !== UserRoles[3]
    ) {
      throw new AuthorizationError("Only authorized instructors (for their own chapters), course managers, or administrators can delete chapters.");
    }

    await chapterToDelete.deleteOne();

    res.status(204).send();
  } catch (error) {
    return next(error);
  }
};