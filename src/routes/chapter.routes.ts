import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createChapter,
  updateChapter,
  deleteChapter,
  getPublicChapterById,
  getChapterById,
} from '../controllers/chapter.controller';
import { UserRoles } from '../schemas';

const chapterRoutes = express.Router();

chapterRoutes.get("/public/:id", getPublicChapterById);

chapterRoutes.use(authenticate);

chapterRoutes.get('/:id', 
  authorize([...UserRoles]), 
  getChapterById);

chapterRoutes.use(authorize([UserRoles[1], UserRoles[2], UserRoles[3]]));

chapterRoutes.post('/', createChapter);

chapterRoutes.route('/:id')
  .patch(updateChapter)
  .delete(deleteChapter);

export default chapterRoutes;
