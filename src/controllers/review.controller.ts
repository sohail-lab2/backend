import { NextFunction, Response } from 'express';
import { Course, Payment, Progress, Review, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';
import { ProgressStatuses, reviewQuerySchema, reviewValidationSchema, UserRoles } from '../schemas';
import { AppError, AuthenticationError, ConflictError, NotFoundError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services/dataCleaner.service';
import { updateCourseRating } from '../services/reviewState.service';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate input
    let reviewData: any = await reviewValidationSchema.parseAsync(req.body);

    const user = await User.findOne({ uid: req.user?.uid });
    reviewData.studentId = user!._id;
    
    // Check if student has purchased the course
    const hasPaid = await Payment.findOne({
      userId: reviewData.studentId,
      courseId: reviewData.courseId,
    });

    if (!hasPaid) {
      throw new AuthenticationError('You must purchase the course before reviewing it.');
    }

    // Calculate course completion percentage
    const allModules = await Progress.find({
      studentId: reviewData.studentId,
      courseId: reviewData.courseId,
    });

    const totalModules = allModules.length;
    const completedModules = allModules.filter(
      (p) => p.status === ProgressStatuses[2]
    ).length;

    if (totalModules === 0) {
      throw new NotFoundError('No progress found for this course.');
    }

    const percentCompleted = (completedModules / totalModules) * 100;

    if (percentCompleted < 80) {
      throw new AppError('You must complete at least 80% of the course to leave a review.', 409);
    }

    // Ensure the student hasn't already reviewed this course
    const existingReview = await Review.findOne({
      studentId: reviewData.studentId,
      courseId: reviewData.courseId,
    });

    if (existingReview) {
      throw new ConflictError('You have already submitted a review for this course.');
    }

    // Create and return the review, then push the review id to the course review field
    const review = await Review.create(reviewData);
    await Course.findByIdAndUpdate(reviewData.courseId, { $addToSet: { reviews: review._id } });
    await updateCourseRating(review.courseId);
    return res.status(201).json(cleanMongoData(review.toJSON()));
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;

    // Validation
    const updateData = await reviewValidationSchema.partial().parseAsync(req.body);
    const user = await User.findOne({ uid: req.user?.uid }).lean();
    if(!user) throw new AuthenticationError();    

    const review = await Review.findOne({_id:reviewId, studentId: user._id});
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Update allowed fields
    if (updateData.rating !== undefined) review.rating = updateData.rating;
    if (updateData.comment !== undefined) review.comment = updateData.comment;

    await review.save();
    await updateCourseRating(review.courseId);
    return res.json(cleanMongoData(review.toJSON()));
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const user = await User.findOne({ uid: req.user?.uid });
    if(!user) throw new AuthenticationError();    

    const review = req.user?.role === UserRoles[0] ? 
      await Review.findOne({ _id: reviewId, studentId: user._id }) : 
      await Review.findOne({ _id: reviewId });

    if (!review) throw new NotFoundError();

    await Course.findByIdAndUpdate(review.courseId, { $pull: { reviews: review._id } });
    await review.deleteOne();
    await updateCourseRating(review.courseId);
    return res.status(204).send();
  } catch (error) {
    return next(error)
  }
};

export const getCourseReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || '-createdAt';

    // Get reviews
    const reviews = await Review.find({ courseId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('studentId', 'name')
      .lean();

    const total = await Review.countDocuments({ courseId });

    // Aggregation for stats
    const statsResult = await Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' },
        },
      },
    ]);

    const stats = statsResult[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratings: [],
    };

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: stats.ratings.filter((r: number) => r === rating).length,
    }));

    return res.json({
      reviews: reviews.map(cleanMongoData),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats.averageRating.toFixed(1),
        totalReviews: stats.totalReviews,
        distribution,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findOne({ uid: req.user?.uid });
    if(!user) throw new AuthenticationError();    
    const studentId = user._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || '-createdAt';

    const reviews = await Review.find({ studentId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('courseId', 'title')
      .lean();

    const total = await Review.countDocuments({ studentId });

    return res.json({
      reviews: reviews.map(cleanMongoData),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};


export const getReviewsForAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, studentId, rating, comment, page = 1, limit = 10, sort = '-createdAt' } = await reviewQuerySchema.parseAsync(req.query);
    
    // Build query for search
    const query: Record<string, any> = {};
    
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;
    if (rating) query.rating = rating;
    if (comment) query.comment = { $regex: comment, $options: 'i' }; // Search comment text (case-insensitive)

    let reviews = await Review.find(query)
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('studentId', 'name')
      .populate('courseId', 'title')
      .lean();

    const total = await Review.countDocuments(query);

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found' });
    }
    return res.json({
      reviews: reviews.map(cleanMongoData),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};