import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getPublicCourse,
  getPublicCourseById,
  createCourse,
  getCourseById,
  getCourses,
  updateCourse,
  deleteCourse,
  grantCourseToStudent
} from '../controllers/course.controller';
import { UserRoles } from '../schemas';
import { uploadCourseBanner } from '../middleware/upload';

const courseRoutes = express.Router();

courseRoutes.get("/public", getPublicCourse);
courseRoutes.get("/public/:id", getPublicCourseById);

courseRoutes.use(authenticate);

// Grant course access - only for admins and course managers
courseRoutes.post('/grant', 
  authorize([UserRoles[2], UserRoles[3]]), 
  grantCourseToStudent
);

// Get courses - accessible to all authenticated users
courseRoutes.get('/', 
  authorize([...UserRoles]), 
  getCourses
);
courseRoutes.get('/:id', 
  authorize([...UserRoles]), 
  getCourseById
);

// Create course - only for instructors
courseRoutes.post('/', 
  authorize([UserRoles[1]]), 
  uploadCourseBanner('banner'),
  createCourse
);

// Update/Delete course - for instructors, admins and course managers
courseRoutes.patch('/:id', 
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]),
  uploadCourseBanner('banner'),
  updateCourse
);
courseRoutes.delete('/:id', 
  authorize([UserRoles[1], UserRoles[2], UserRoles[3]]), 
  deleteCourse
);

// courseRoutes.post(
//   '/:id/purchase',
//   authenticate,
//   authorize(['student']),
//   incrementPurchaseCount,
// );

export default courseRoutes;
