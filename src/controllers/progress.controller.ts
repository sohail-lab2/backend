import { NextFunction, Response } from 'express';
import { User, Progress, Payment, Chapter } from '../models';
import { AuthRequest } from '../middleware/auth';
import { ProgressStatuses, progressValidationSchema} from '../schemas';
import { Types } from 'mongoose';
import { cleanMongoData } from '../services/dataCleaner.service';
import { AuthenticationError, NotFoundError } from '../middleware/errorHandler';

export const updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validation of input
    let progressUpdate = await progressValidationSchema.parseAsync(req.body); 
    delete progressUpdate.completedAt;
    
    const hasPaid = await Payment.findOne({
      courseId: progressUpdate.courseId,
      userId: progressUpdate.studentId,
    });

    if(!hasPaid) throw new AuthenticationError('You must purchase the course before tracking progress');

    // Verify module exists in the chapter
    const chapter = await Chapter.findOne({
      courseId: progressUpdate.courseId,
      modules: progressUpdate.moduleId,
    }).lean();

    if(!chapter) throw new NotFoundError('Module does not exist in the chapter');

    const now = new Date();
    // find exisiting progres
    const exisitingProgress = await Progress.findOne({
      studentId: progressUpdate.studentId,
      courseId: progressUpdate.courseId,
      moduleId: progressUpdate.moduleId,
    });

    // Create if not exisit
    if(!exisitingProgress){
      const progress = await Progress.create({
        ...progressUpdate,
        completedAt: progressUpdate.status === ProgressStatuses[2] ? now: undefined,
      });
      return res.status(201).json(cleanMongoData(progress.toJSON()));
    }
    exisitingProgress.status = progressUpdate.status;
    exisitingProgress.timeSpent = progressUpdate.timeSpent;
    if(progressUpdate.status === ProgressStatuses[2] && !exisitingProgress.completedAt){
      exisitingProgress.completedAt = now;
    }
    await exisitingProgress.save();
    return res.json(cleanMongoData(exisitingProgress.toJSON()));
  } catch (error) {
    return next(error);
  }
};

export const getModuleProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { moduleId } = req.params;
    const mUser = await User.findOne({ uid: req.user?.uid! }).lean();

    if (!mUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progress = await Progress.findOne({
      moduleId,
      studentId: mUser._id
    }).lean();

    if (!progress) {
      return res.json({
        status: ProgressStatuses[0], // 'not_started'
        timeSpent: 0,
        completedAt: null
      });
    }

    return res.json(cleanMongoData(progress));
  } catch (error) {
    return next(error);
  }
};

export const getCourseProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const mUser = await User.findOne({ uid: req.user?.uid! }).lean();

    const progressRecords = await Progress.find({
      courseId,
      studentId: mUser?._id!
    }).lean();

    if (progressRecords.length === 0) {
      return res.json({ status: 'not_started' });
    }

    const chapterProgressMap = new Map<string, { completed: number; total: number; timeSpent: number }>();

    // Group progress by chapter
    for (const record of progressRecords) {
      const chapterId = record.chapterId.toString();
      if (!chapterProgressMap.has(chapterId)) {
        chapterProgressMap.set(chapterId, { completed: 0, total: 0, timeSpent: 0 });
      }

      const chapter = chapterProgressMap.get(chapterId)!;
      chapter.total += 1;
      chapter.timeSpent += record.timeSpent || 0;

      if (record.status === ProgressStatuses[2]) {
        chapter.completed += 1;
      }
    }

    // Build chapter list with computed stats
    const chapters = Array.from(chapterProgressMap.entries()).map(([chapterId, data]) => {
      const percentCompleted = Math.round((data.completed / data.total) * 100);
      return {
        chapterId,
        timeSpent: data.timeSpent,
        percentCompleted
      };
    });

    const completedChapters = chapters.filter(ch => ch.percentCompleted === 100).length;
    const totalChapters = chapters.length;
    const totalTime = chapters.reduce((acc, cur) => acc + cur.timeSpent, 0);
    const overallPercent = Math.round((completedChapters / totalChapters) * 100);

    return res.json({
      courseId,
      completedChapters,
      totalChapters,
      percentCompleted: overallPercent,
      timeSpentTotal: totalTime,
      chapterWise: chapters
    });
  } catch (error) {
    return next(error);
  }
};


export const getChapterProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chapterId } = req.params;
    const mUser = await User.findOne({ uid: req.user?.uid! }).lean();

    if (!mUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const chapter = await Chapter.findById(chapterId).lean();

    if (!chapter || !Array.isArray(chapter.modules) || chapter.modules.length === 0) {
      return res.status(404).json({ error: 'Chapter or modules not found' });
    }

    const progressRecords = await Progress.find({
      studentId: mUser._id,
      chapterId: chapter._id
    }).lean();

    // Map progress by moduleId for easy lookup
    const progressMap = new Map(
      progressRecords.map(p => [p.moduleId.toString(), p])
    );

    const modulesProgress = chapter.modules.map((modId: Types.ObjectId) => {
      const progress = progressMap.get(modId.toString());
      return {
        moduleId: modId,
        status: progress?.status || ProgressStatuses[0], // 'not_started'
        timeSpent: progress?.timeSpent || 0,
        completedAt: progress?.completedAt || null
      };
    });

    const completedModules = modulesProgress.filter(m => m.status === ProgressStatuses[2]).length;
    const totalModules = modulesProgress.length;
    const percentCompleted = Math.round((completedModules / totalModules) * 100);
    const timeSpentTotal = modulesProgress.reduce((acc, cur) => acc + cur.timeSpent, 0);

    return res.json({
      chapterId,
      totalModules,
      completedModules,
      percentCompleted,
      timeSpentTotal,
      modulesWise: modulesProgress
    });
  } catch (error) {
    return next(error);
  }
};
