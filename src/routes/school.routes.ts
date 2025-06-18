import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createSchool, addCoursePriceForSchool, deleteCoursePriceForSchool, getSchools } from '../controllers/school.controller';
import { UserRoles } from '../schemas';

const schoolRouter = express.Router();

schoolRouter.use(authenticate, authorize([UserRoles[2], UserRoles[3]]));

schoolRouter.post(
  '/',
  createSchool
);

schoolRouter.get('/', getSchools);

schoolRouter.delete('/:schoolId', getSchools);

schoolRouter.post(
  '/:schoolId/course-price',
  addCoursePriceForSchool
);

schoolRouter.delete(
    '/:schoolId/course-price/:courseId',
    deleteCoursePriceForSchool
  );

export default schoolRouter;
