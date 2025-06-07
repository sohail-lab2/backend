// import { config } from '../config/variables.config';
// import axios from 'axios';
// import { v4 as uuidv4 } from 'uuid';
// import { Payment, Course } from '../models';
// import { AppError } from '../middleware/errorHandler';

// const CASHFREE_API_URL =
//   config.nodeEnv === 'production'
//     ? 'https://api.cashfree.com/pg'
//     : 'https://sandbox.cashfree.com/pg';

// interface CreateOrderParams {
//   courseId: string;
//   userId: string;
//   amount: number;
//   currency?: string;
// }

// interface PaymentCallbackParams {
//   orderId: string;
//   paymentId: string;
//   orderAmount: number;
//   txStatus: string;
//   paymentDetails: any;
// }

// export class PaymentService {
//   private static instance: PaymentService;
//   private readonly headers: Record<string, string>;

//   private constructor() {
//     this.headers = {
//       'x-api-version': config.cashfreeApiVersion,
//       'x-client-id': config.cashfreeAppId,
//       'x-client-secret': config.cashfreeSecretKey,
//       'Content-Type': 'application/json',
//     };
//   }

//   public static getInstance(): PaymentService {
//     if (!PaymentService.instance) {
//       PaymentService.instance = new PaymentService();
//     }
//     return PaymentService.instance;
//   }

//   async createOrder({
//     courseId,
//     userId,
//     amount,
//     currency = 'INR',
//   }: CreateOrderParams) {
//     try {
//       const orderId = `order_${uuidv4()}`;

//       // Create order in Cashfree
//       const response = await axios.post(
//         `${CASHFREE_API_URL}/orders`,
//         {
//           order_id: orderId,
//           order_amount: amount,
//           order_currency: currency,
//           customer_details: {
//             customer_id: userId,
//           },
//           order_meta: {
//             return_url: `http://localhost:${config.port}/payment/callback?order_id={order_id}`,
//           },
//         },
//         { headers: this.headers },
//       );

//       // Create payment record
//       const payment = await Payment.create({
//         orderId,
//         courseId,
//         userId,
//         amount,
//         currency,
//         status: 'PENDING',
//         orderDetails: response.data,
//       });

//       return {
//         orderId,
//         paymentLink: response.data.payment_link,
//         paymentDetails: payment,
//       };
//     } catch (error) {
//       console.error('Error creating order:', error);
//       throw new AppError('Failed to create payment order', 500);
//     }
//   }

//   async handlePaymentCallback({
//     orderId,
//     paymentId,
//     orderAmount,
//     txStatus,
//     paymentDetails,
//   }: PaymentCallbackParams) {
//     try {
//       const payment = await Payment.findOne({ orderId });
//       if (!payment) {
//         throw new AppError('Payment not found', 404);
//       }

//       if (!orderAmount || orderAmount <= 0){
//         throw new AppError('Zero or invalid payment amount is not allowed', 400);
//       }

//       // Verify payment with Cashfree
//       const response = await axios.get(
//         `${CASHFREE_API_URL}/orders/${orderId}`,
//         { headers: this.headers },
//       );

//       const orderStatus = response.data.order_status;

//       if (orderStatus === 'PAID' || txStatus === 'SUCCESS') {
//         // Update payment status
//         payment.status = 'SUCCESS';
//         payment.paymentId = paymentId;
//         payment.paymentDetails = paymentDetails;
//         await payment.save();

//         // Update course purchase status
//         const course = await courseModel.findById(payment.courseId);
//         if (course) {
//           course.purchased.set(payment.userId, true);
//           await course.save();
//         }

//         return {
//           status: 'SUCCESS',
//           message: 'Payment successful',
//           payment,
//         };
//       } else {
//         payment.status = 'FAILED';
//         payment.paymentDetails = paymentDetails;
//         await payment.save();

//         return {
//           status: 'FAILED',
//           message: 'Payment failed',
//           payment,
//         };
//       }
//     } catch (error) {
//       console.error('Error handling payment callback:', error);
//       throw new AppError('Failed to process payment callback', 500);
//     }
//   }

//   async getPaymentStatus(orderId: string) {
//     try {
//       const payment = await Payment.findOne({ orderId });
//       if (!payment) {
//         throw new AppError('Payment not found', 404);
//       }

//       if (payment.status === 'PENDING') {
//         // Verify with Cashfree
//         const response = await axios.get(
//           `${CASHFREE_API_URL}/orders/${orderId}`,
//           { headers: this.headers },
//         );

//         if (response.data.order_status === 'PAID') {
//           payment.status = 'SUCCESS';
//           payment.paymentId = response.data.payment_id;
//           payment.paymentDetails = response.data;
//           await payment.save();

//           // Update course purchase status
//           const course = await courseModel.findById(payment.courseId);
//           if (course) {
//             course.purchased.set(payment.userId, true);
//             await course.save();
//           }
//         }
//       }

//       return payment;
//     } catch (error) {
//       console.error('Error getting payment status:', error);
//       throw new AppError('Failed to get payment status', 500);
//     }
//   }
// }
// TODO redo this