import { Request, NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { chapterValidationSchema } from '../schemas';
import { Chapter, Course, Module, Payment, User } from '../models';
import { NotFoundError, AuthorizationError, AppError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';
import { UserRoles } from '../schemas';
import { Types } from 'mongoose';

export const getChapterById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userByUid = await User.findOne({ uid: req.user?.uid }).select('_id').lean();
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

    res.status(200).json(cleanMongoData(chapter));
  } catch (error) {
    next(error);
  }
};

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


export const updateChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const chapterUpdateDetail = await chapterValidationSchema.partial().parseAsync(req.body);
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
    const updatedChapter = await Chapter.findByIdAndUpdate(
      id,
      { $set: chapterUpdateDetail },
      { new: true, runValidators: true }
    );

    res.status(200).json(cleanMongoData(updatedChapter!.toJSON()));
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Module order must be unique within a chapter', 400, true));
    }
    next(error);
  }
};


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
    if (error.code === 11000) {
      return next(new AppError('Chapter order must be unique within a course', 400, true));
    }
    next(error);
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
   
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
