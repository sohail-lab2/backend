import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models';
import { cleanMongoData } from '../services/dataCleaner.service';

export const getSalesAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const timeRange = (req.query.timeRange as string) || 'month';
    const startDate = getStartDate(timeRange);

    // Combine both aggregations into a single pipeline for better performance
    const [sales] = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: '$courseId',
                courseName: { $first: '$course.name' },
                price: { $first: '$course.price' },
                totalRevenue: { $sum: '$amount' },
                totalSales: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalRevenue' },
                totalSales: { $sum: '$totalSales' },
                courses: {
                  $push: {
                    courseId: '$_id',
                    name: '$courseName',
                    price: '$price',
                    totalRevenue: '$totalRevenue',
                    totalSales: '$totalSales',
                  },
                },
              },
            },
          ],
          timeSeries: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                dailyRevenue: { $sum: '$amount' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    res.status(200).json({
      summary: cleanMongoData(sales.summary[0]) || { totalRevenue: 0, totalSales: 0, courses: [] },
      timeSeries: cleanMongoData(sales.timeSeries),
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const timeRange = (req.query.timeRange as string) || 'month';
    const startDate = getStartDate(timeRange);

    // Combine both aggregations into a single pipeline
    const [summary] = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $facet: {
          summary: [
            {
              $lookup: {
                from: 'courses',
                localField: 'courseId',
                foreignField: '_id',
                as: 'course',
              },
            },
            { $unwind: '$course' },
            {
              $group: {
                _id: '$courseId',
                courseName: { $first: '$course.name' },
                createdAt: { $first: '$course.createdAt' },
                enrollmentCount: { $sum: 1 },
              },
            },
            { $sort: { enrollmentCount: -1 } },
            {
              $group: {
                _id: null,
                totalEnrollments: { $sum: '$enrollmentCount' },
                courses: {
                  $push: {
                    courseId: '$_id',
                    name: '$courseName',
                    enrollmentCount: '$enrollmentCount',
                    createdAt: '$createdAt',
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalEnrollments: 1,
                courses: 1,
              },
            },
          ],
          timeSeries: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                dailyEnrollments: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                date: '$_id',
                dailyEnrollments: 1,
                _id: 0,
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      summary: cleanMongoData(summary.summary[0]) || { totalEnrollments: 0, courses: [] },
      timeSeries: cleanMongoData(summary.timeSeries),
    });
  } catch (error) {
    next(error);
  }
};

function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}
