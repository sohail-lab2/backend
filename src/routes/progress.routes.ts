import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  updateProgress,
  getModuleProgress,
  getChapterProgress,
  getCourseProgress,
} from '../controllers/progress.controller';
import { UserRoles } from '../schemas';

const progressRouter = express.Router();

progressRouter.use(authenticate, authorize([UserRoles[0]]));
progressRouter.put('/', updateProgress);
progressRouter.get('/modules/:moduleId', getModuleProgress);
progressRouter.get('/chapters/:chapterId', getChapterProgress);
progressRouter.get('/courses/:courseId', getCourseProgress);
export default progressRouter;
