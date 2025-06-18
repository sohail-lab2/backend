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
  paymentHook,
  checkPayment,
  getTop3Courses
} from '../controllers/course.controller';
import { UserRoles } from '../schemas';
import { uploadCourseBanner } from '../middleware/upload';
import { courseLimiter, paymentLimiter } from '../services';

const courseRoutes = express.Router();

// limiting public course fetching
courseRoutes.use('/public', courseLimiter);

courseRoutes.get("/public/top3", getTop3Courses);
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
  checkPayment,
);

courseRoutes.post(
  '/:id/webhook',
  authorize([UserRoles[0]]),
  paymentHook,
);

export default courseRoutes;
