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

<<<<<<< HEAD
schoolRouter.delete('/:schoolId', getSchools);

=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
schoolRouter.post(
  '/:schoolId/course-price',
  addCoursePriceForSchool
);

schoolRouter.delete(
    '/:schoolId/course-price/:courseId',
    deleteCoursePriceForSchool
  );

export default schoolRouter;
