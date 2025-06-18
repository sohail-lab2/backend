import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createModule,
  deleteModule,
  getPublicModuleById,
  getModuleById,
  updateModule,
  deleteModulePdfs
} from '../controllers/module.controller';
import { UserRoles } from '../schemas';
import { uploadCoursePdfs } from '../middleware/upload';

const moduleRouter = express.Router();

moduleRouter.get('/public/:id', getPublicModuleById);

moduleRouter.use(authenticate)

moduleRouter.get('/:id',
  authorize([...UserRoles]),
  getModuleById);

moduleRouter.use(authorize([UserRoles[1], UserRoles[2], UserRoles[3]]));

moduleRouter.post('/', uploadCoursePdfs('pdfs', 5), createModule);

moduleRouter.route('/:id')
  .patch(uploadCoursePdfs('pdfs', 5), updateModule).
  delete(deleteModule);

moduleRouter.delete('/:id/pdfs', deleteModulePdfs);

export default moduleRouter;
