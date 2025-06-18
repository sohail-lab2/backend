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

<<<<<<< HEAD
    // Combine both aggregations into a single pipeline for better performance
    const [sales] = await Payment.aggregate([
=======
    // Aggregate sales summary
    const sales = await Payment.aggregate([
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
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
=======
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
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
        },
      },
    ]);

<<<<<<< HEAD
    res.status(200).json({
      summary: cleanMongoData(sales.summary[0]) || { totalRevenue: 0, totalSales: 0, courses: [] },
      timeSeries: cleanMongoData(sales.timeSeries),
=======
    // Aggregate time-series daily revenue
    const timeSeriesData = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: '$amount',
        },
      },
      {
        $group: {
          _id: '$date',
          dailyRevenue: { $sum: '$revenue' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      summary: cleanMongoData(sales[0]) || { totalRevenue: 0, totalSales: 0, courses: [] },
      timeSeries: cleanMongoData(timeSeriesData),
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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

<<<<<<< HEAD
    // Combine both aggregations into a single pipeline
=======
    // 1. Course Enrollment Summary
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    const [summary] = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
<<<<<<< HEAD
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
=======
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
      { $sort: { enrollmentCount: -1 } }, // sort courses by popularity
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
    ]);

    // 2. Daily Enrollment Trends (Time Series)
    const timeSeries = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      },
      {
        $group: {
          _id: '$date',
          dailyEnrollments: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          dailyEnrollments: 1,
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
        },
      },
    ]);

    res.status(200).json({
<<<<<<< HEAD
      summary: cleanMongoData(summary.summary[0]) || { totalEnrollments: 0, courses: [] },
      timeSeries: cleanMongoData(summary.timeSeries),
=======
      summary: cleanMongoData(summary) || { totalEnrollments: 0, courses: [] },
      timeSeries,
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    });
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
=======
// export const getProgressAnalytics = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const timeRange = (req.query.timeRange as string) || 'month';
//     const startDate = getStartDate(timeRange);

//     // Get course completion statistics with detailed progress
//     const courseProgress = await Progress.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate },
//         },
//       },
//       {
//         $lookup: {
//           from: 'courses',
//           localField: 'courseId',
//           foreignField: '_id',
//           as: 'courseDetails',
//         },
//       },
//       {
//         $unwind: '$courseDetails',
//       },
//       {
//         $group: {
//           _id: '$courseId',
//           courseName: { $first: '$courseDetails.name' },
//           totalStudents: { $sum: 1 },
//           completedStudents: {
//             $sum: { $cond: ['$completed', 1, 0] },
//           },
//           averageWatchTime: { $avg: '$watchedDuration' },
//           averageProgress: { $avg: '$progress' },
//           chapterProgress: {
//             $push: {
//               chapterId: '$currentChapter',
//               progress: '$progress',
//               watchTime: '$watchedDuration',
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           courseId: '$_id',
//           courseName: 1,
//           totalStudents: 1,
//           completedStudents: 1,
//           completionRate: {
//             $multiply: [
//               { $divide: ['$completedStudents', '$totalStudents'] },
//               100,
//             ],
//           },
//           averageWatchTime: 1,
//           averageProgress: 1,
//           chapterProgress: 1,
//         },
//       },
//     ]);

//     // Get quiz performance statistics
//     const quizPerformance = await Quiz.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate },
//         },
//       },
//       {
//         $unwind: '$attempts',
//       },
//       {
//         $group: {
//           _id: '$courseId',
//           totalAttempts: { $sum: 1 },
//           averageScore: { $avg: '$attempts.score' },
//           passingRate: {
//             $avg: {
//               $cond: [
//                 {
//                   $gte: ['$attempts.score', { $ifNull: ['$passingScore', 80] }],
//                 },
//                 1,
//                 0,
//               ],
//             },
//           },
//           scoreDistribution: {
//             $push: {
//               score: '$attempts.score',
//               timestamp: '$attempts.completedAt',
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: 'courses',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'courseDetails',
//         },
//       },
//       {
//         $unwind: '$courseDetails',
//       },
//       {
//         $project: {
//           courseId: '$_id',
//           courseName: '$courseDetails.name',
//           totalAttempts: 1,
//           averageScore: 1,
//           passingRate: { $multiply: ['$passingRate', 100] },
//           scoreDistribution: 1,
//         },
//       },
//     ]);

//     // Get engagement metrics
//     const engagementMetrics = await Progress.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate },
//         },
//       },
//       {
//         $group: {
//           _id: '$courseId',
//           averageSessionDuration: { $avg: '$lastSessionDuration' },
//           totalWatchTime: { $sum: '$watchedDuration' },
//           activeStudents: {
//             $sum: {
//               $cond: [
//                 {
//                   $gt: [
//                     '$lastActive',
//                     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//                   ],
//                 },
//                 1,
//                 0,
//               ],
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: 'courses',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'courseDetails',
//         },
//       },
//       {
//         $unwind: '$courseDetails',
//       },
//       {
//         $project: {
//           courseId: '$_id',
//           courseName: '$courseDetails.name',
//           averageSessionDuration: 1,
//           totalWatchTime: 1,
//           activeStudents: 1,
//           engagementRate: {
//             $multiply: [
//               {
//                 $divide: ['$activeStudents', '$courseDetails.enrolledStudents'],
//               },
//               100,
//             ],
//           },
//         },
//       },
//     ]);

//     res.status(200).json({
//       courseProgress,
//       quizPerformance,
//       engagementMetrics,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// Helper function to get start date based on time range

>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
