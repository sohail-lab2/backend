// import { Response, NextFunction } from 'express';
// import { AuthRequest } from '../middleware/auth';
// import { AppError } from '../middleware/errorHandler';
// import { PaymentService } from '../services/payment.service';
// import courseModel from '../models/course.model';

// const paymentService = PaymentService.getInstance();

// export const initiatePayment = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { courseId } = req.params;
//     const userId = req.user?.uid;
//     if (!userId) {
//       return next(new AppError('User not authenticated', 401));
//     }

//     const course = await courseModel.findById(courseId);
//     if (!course) {
//       return next(new AppError('Course not found', 404));
//     }

//     // Check if already purchased
//     if (course.purchased.get(userId)) {
//       return next(new AppError('Course already purchased', 400));
//     }

//     const { orderId, paymentLink, paymentDetails } =
//       await paymentService.createOrder({
//         courseId,
//         userId,
//         amount: course.price,
//       });

//     res.status(200).json({
//       orderId,
//       paymentLink,
//       paymentDetails,
//     });
//   } catch (error) {
//     next(new AppError('Failed to initiate payment', 500));
//   }
// };

// export const handlePaymentCallback = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { orderId, paymentId, orderAmount, txStatus } = req.body;
//     const paymentDetails = req.body;

//     const result = await paymentService.handlePaymentCallback({
//       orderId,
//       paymentId,
//       orderAmount,
//       txStatus,
//       paymentDetails,
//     });

//     res.status(200).json(result);
//   } catch (error) {
//     next(new AppError('Failed to process payment callback', 500));
//   }
// };

// export const getPaymentStatus = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { orderId } = req.params;
//     const userId = req.user?.uid;
//     if (!userId) {
//       return next(new AppError('User not authenticated', 401));
//     }

//     const payment = await paymentService.getPaymentStatus(orderId);

//     // Verify user owns this payment
//     if (payment.userId !== userId) {
//       return next(new AppError('Unauthorized access to payment', 403));
//     }

//     res.status(200).json(payment);
//   } catch (error) {
//     next(new AppError('Failed to get payment status', 500));
//   }
// };
// TODO handle after course making