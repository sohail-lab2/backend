import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  getMyReviews,
  getReviewsForAdmin,
} from '../controllers/review.controller';
import { UserRoles } from '../schemas';

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/course/:courseId', getCourseReviews);

reviewRouter.use(authenticate);
reviewRouter.get('/', authorize([UserRoles[3], UserRoles[2]]), getReviewsForAdmin);

// Protected routes
reviewRouter.use(authorize([UserRoles[0], UserRoles[3], UserRoles[2]]));

// Student routes
reviewRouter.post('/me', createReview);
reviewRouter.get('/me', getMyReviews);
reviewRouter.patch('/:reviewId', updateReview);
reviewRouter.delete('/:reviewId', deleteReview);

export default reviewRouter;
