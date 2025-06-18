<<<<<<< HEAD
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chapterValidationSchema, UserRoles } from '../schemas';
import { Chapter, Course, Payment, User } from '../models';
import mongoose from 'mongoose';
import { NotFoundError, AuthorizationError, AppError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';
=======
import { Request, NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chapterValidationSchema } from '../schemas';
import { Chapter, Course, Module, Payment, User } from '../models';
import { NotFoundError, AuthorizationError, AppError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';
import { UserRoles } from '../schemas';
import { Types } from 'mongoose';
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

export const getChapterById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userByUid = await User.findOne({ uid: req.user?.uid }).select('_id').lean();
<<<<<<< HEAD
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
=======
    if (!userByUid) {
      throw new NotFoundError("User not found");
    }
    const chapter = await Chapter.findById(id)
      .populate({
        path: 'courseId',
        select: 'name description price instrID aggregateRating buysCnt',
        populate: {
          path: 'instrID',
          select: 'name uid'
        }
      })
      .populate({
        path: 'modules',
        select: 'name order description videoId pdfs',
        options: { sort: { order: 1 } }
      })
      .lean();

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    // Check if user has access to this chapter
    const course = await Course.findById(chapter.courseId._id)
      .populate('instrID', 'uid')
      .lean();

    if (!course) {
      await Module.deleteMany({ chapterId: id }); // remove all modules of current chapter
      await Chapter.findByIdAndDelete(id); // remove if chapter if course parent found
      throw new NotFoundError("Associated course not found");
    }

    // Allow access if user is instructor of the course or coursemanager/admin
    if ((req.user?.role! === UserRoles[1] &&
      req.user?.uid !== (course.instrID as any).uid) ||
      req.user?.role! === UserRoles[2] ||
      req.user?.role! === UserRoles[3]) {
      res.status(200).json(cleanMongoData(chapter));
      return;
    }
    // Check if user has purchased the course
    const hasPurchased = await Payment.findOne({
      _id: userByUid._id,
      courseId: course._id
    }).lean();

    if (!hasPurchased) {
      throw new AuthorizationError("You don't have access to this chapter");
    }
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

    res.status(200).json(cleanMongoData(chapter));
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
=======
export const getPublicChapterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id)
      .populate({
        path: 'courseId',
        select: 'name description price instrID aggregateRating buysCnt',
        populate: {
          path: 'instrID',
          select: 'name uid'
        }
      })
      .populate({
        path: 'modules',
        select: 'name order description',
        options: { sort: { order: 1 } }
      })
      .lean();

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    res.status(200).json(cleanMongoData(chapter));
  } catch (error) {
    next(error);
  }
};


>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
export const updateChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const chapterUpdateDetail = await chapterValidationSchema.partial().parseAsync(req.body);
<<<<<<< HEAD
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

=======
    // ensure no forcefully access
    delete (chapterUpdateDetail as any)._id;

    // Find chapter and check ownership
    const chapter = await Chapter.findById(id).populate({
      path: 'courseId',
      populate: {
        path: 'instrID',
        select: 'uid'
      }
    }).lean();

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    // Verify instructor ownership or course manager/admin
    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== (chapter.courseId as any).instrID.uid
    ){
      throw new AuthorizationError("Not authorized to update this chapter");
    }

    // Update chapter
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      { $set: chapterUpdateDetail },
      { new: true, runValidators: true }
    );

<<<<<<< HEAD
    if (!updatedChapter)
      throw new AppError("Failed to update chapter after checks", 500, true);

    res.status(200).json(cleanMongoData(updatedChapter.toJSON()));
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Chapter order must be unique within a course', 400, true));
=======
    res.status(200).json(cleanMongoData(updatedChapter!.toJSON()));
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Module order must be unique within a chapter', 400, true));
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    }
    next(error);
  }
};

<<<<<<< HEAD
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
=======

export const createChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {   
    if (!req.user?.uid) throw new AuthorizationError();
    const mUser = await User.findOne({ uid: req.user.uid }).lean();
    if (!mUser) throw new AuthorizationError();

    const chapterData = await chapterValidationSchema.parseAsync(req.body);
    let mongoQuery:any = {
      _id: chapterData.courseId,
    };

    if(mUser.role === UserRoles[1]){
      mongoQuery.instrID = mUser._id;
    }
    
    // Verify course exists and authorized
    const course = await Course.findOne(mongoQuery);
    if (!course) {
      throw new NotFoundError("Course not found or unauthorized");
    }

    const chapter = await Chapter.create(chapterData);
    // Update course with new chapter
    course.chapters.push(chapter._id as unknown as Types.ObjectId);
    await course.save();
    res.status(201).json(cleanMongoData(chapter.toJSON()));
  } catch (error) {
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    if (error.code === 11000) {
      return next(new AppError('Chapter order must be unique within a course', 400, true));
    }
    next(error);
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
<<<<<<< HEAD

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
=======
   
    // Find chapter and check ownership
    const chapter = await Chapter.findById(id).populate({
      path: 'courseId',
      populate: {
        path: 'instrID',
        select: 'uid'
      }
    }).lean();

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    // Verify instructor ownership or course manager/admin
    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== (chapter.courseId as any).instrID.uid
    ){
      throw new AuthorizationError("Not authorized to delete this chapter");
    }

    // Remove chapter from course
    await Course.findByIdAndUpdate(
      (chapter.courseId as any)._id,
      { $pull: { chapters: id } }
    );

    // Delete chapter and its modules
    await Module.deleteMany({ _id: { $in: chapter.modules } });
    await Chapter.findByIdAndDelete(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
