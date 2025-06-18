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
  grantCourseToStudent,
  createOrder,
<<<<<<< HEAD
  paymentHook,
  checkPayment,
  getTop3Courses
=======
  paymentHook
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
} from '../controllers/course.controller';
import { UserRoles } from '../schemas';
import { uploadCourseBanner } from '../middleware/upload';
import { courseLimiter, paymentLimiter } from '../services';

const courseRoutes = express.Router();

// limiting public course fetching
courseRoutes.use('/public', courseLimiter);

<<<<<<< HEAD
courseRoutes.get("/public/top3", getTop3Courses);
=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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

courseRoutes.post(
  '/:id/purchase',
  paymentLimiter,
  authorize([UserRoles[0]]),
  createOrder,
);

courseRoutes.get(
  '/:id/purchased',
  paymentLimiter,
  authorize([UserRoles[0]]),
<<<<<<< HEAD
  checkPayment,
=======
  createOrder,
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
);

courseRoutes.post(
  '/:id/webhook',
  authorize([UserRoles[0]]),
  paymentHook,
);

export default courseRoutes;
