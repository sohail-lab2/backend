import { NextFunction, Request, Response } from 'express';
import { Course, Payment, School, User } from '../models';
import { Types } from 'mongoose';
import { AppError, AuthenticationError, AuthorizationError, NotFoundError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { CourseInput, courseValidationSchema, paymentValidationSchema, UserRoles } from '../schemas';
import { cleanMongoData } from '../services/dataCleaner.service';
import fs from 'fs';
import { CashFree } from '../config/cashfree.config';
import path from 'path';
import { config } from '../config/variables.config';
import { auth } from '../config/firebase.config';
import {v4 as uuid} from 'uuid';
import { CreateOrderRequest, PaymentEntity, PaymentEntityPaymentStatusEnum } from 'cashfree-pg';
import { deleteFile } from '../services/dataCleaner.service';

export const getPublicCourse = async (_req: Request, res: Response, next: NextFunction) => {  
  try {
    const course = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews'
        }
      },
      {
        $project: {
          'instructor.name': 1,
          reviews: 1,
          name: 1,
          description: 1,
          price: 1,
          bannerUrl: 1,
          buysCnt: 1,
          isPublished: 1
        }
      }
    ]);

    if(!course || course.length === 0){
      throw new NotFoundError("No course is available");
    }
        
    res.status(200).json(cleanMongoData(course));
  } catch (error) {
    next(error);
  }  
};

export const getTop3Courses = async (_req: Request, res: Response, next: NextFunction) => {  
  try {
    const course = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews'
        }
      },
      {
        $project: {
          'instructor.name': 1,
          reviews: 1,
          name: 1,
          description: 1,
          price: 1,
          bannerUrl: 1,
          buysCnt: 1,
          isPublished: 1,
          aggregateRating: 1
        }
      },
      {
        $sort: { aggregateRating: -1 }
      },
      {
        $limit: 3
      }
    ]);

    if(!course || course.length === 0){
      throw new NotFoundError("No course is available");
    }
        
    res.status(200).json(cleanMongoData(course));
  } catch (error) {
    next(error);
  }
};

export const getPublicCourseById = async (req: Request, res: Response, next: NextFunction) => {  
  try {
    const course = await Course.aggregate([
      { $match: { _id: new Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews'
        }
      },
      {
        $lookup: {
          from: 'chapters',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$courseId', '$$courseId'] } } },
            { $sort: { order: 1 } },
            {
              $lookup: {
                from: 'modules',
                let: { chapterId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$chapterId', '$$chapterId'] } } },
                  { $sort: { order: 1 } },
                  { $project: { name: 1, order: 1, description: 1 } }
                ],
                as: 'modules'
              }
            }
          ],
          as: 'chapters'
        }
      },
      {
        $project: {
          'instructor.name': 1,
          reviews: 1,
          chapters: 1,
          name: 1,
          description: 1,
          price: 1,
          bannerUrl: 1,
          buysCnt: 1
        }
      }
    ]);

    if(!course || course.length === 0){
      throw new NotFoundError("No course is available");
    }

    res.status(200).json(cleanMongoData(course[0]));
  } catch (error) {
    next(error);
  }  
};

export const getCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.query;
    const { role, uid } = req.user!;

    const query: any = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (description) query.description = { $regex: description, $options: 'i' };

    const user = await User.findOne({ uid }).select('_id').lean();
    if (!user) throw new NotFoundError("User not found");

    if (role === UserRoles[0]) {
      const payments = await Payment.find({ userId: user._id }).select('courseId').lean();
      const courseIds = payments.map(p => p.courseId);
      query._id = { $in: courseIds };
    } else if (role === UserRoles[1]) {
      query.instrID = user._id;
    }

    const courses = await Course.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $project: {
          'instructor.name': 1,
          name: 1,
          description: 1,
          price: 1,
          bannerUrl: 1,
          buysCnt: 1
        }
      }
    ]);

    if (!courses.length) throw new NotFoundError("No courses available");

    res.status(200).json(cleanMongoData(courses));
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role, uid } = req.user!;

    const user = await User.findOne({ uid }).select('_id').lean();
    if (!user) throw new NotFoundError("User not found");

    let accessQuery: any = { _id: new Types.ObjectId(id) };

    if (role === UserRoles[0]) {
      const payment = await Payment.findOne({ userId: user._id, courseId: id }).lean();
      if (!payment) throw new NotFoundError("You have not purchased this course");
    } else if (role === UserRoles[1]) {
      accessQuery.instrID = user._id;
    }

    const course = await Course.aggregate([
      { $match: accessQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $lookup: {
          from: 'chapters',
          let: { courseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$courseId', '$$courseId'] } } },
            { $sort: { order: 1 } },
            {
              $lookup: {
                from: 'modules',
                let: { chapterId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$chapterId', '$$chapterId'] } } },
                  { $sort: { order: 1 } }
                ],
                as: 'modules'
              }
            }
          ],
          as: 'chapters'
        }
      },
      {
        $project: {
          'instructor.name': 1,
          name: 1,
          description: 1,
          price: 1,
          bannerUrl: 1,
          buysCnt: 1,
          chapters: 1
        }
      }
    ]);

    if (!course.length) throw new NotFoundError("Course not found or unauthorized");

    res.status(200).json(cleanMongoData(course[0]));
  } catch (error) {
    next(error);
  }
};


export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate user
    const user = await User.findOne({ uid: req.user?.uid });
    if (!user) throw new NotFoundError("User not found");

    // Validate course data
    const courseData:CourseInput = courseValidationSchema.parse(req.body);
    
    // Handle banner upload
    const file = req.file as Express.Multer.File;
    if(!file){
      throw new AppError("Banner is required", 400, true);
    }
    courseData.bannerUrl = `/courses/banners/${file.filename}`;

    // Create course
    const course = await Course.create({
      ...courseData,
      instrID: user._id
    });
    
    await User.findByIdAndUpdate(user._id, { $addToSet: { coursesCreated: course._id } });

    // Return created course
    return res.status(201).json(cleanMongoData(course.toJSON()));
  } catch (error) {
    // 🧹 Clean up uploaded banner on error
    const file = req.file as Express.Multer.File;
    if (file) {
      try {
        fs.unlinkSync(path.resolve(file.path));
      } catch (err) {
        console.warn(`Failed to delete PDF: ${file.path}`, err);
      }
    }
    return next(error);
  }
};

export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Validate course data
    const { id } = req.params;
    const courseUpdateDetail = await courseValidationSchema.partial().parseAsync(req.body);
    // ensure no forcefully access
    delete (courseUpdateDetail as any)._id;

    // Course banner change
    const file = req.file as Express.Multer.File;
    if(file){
      courseUpdateDetail.bannerUrl = `/courses/banners/${file.filename}`;
    }

    // Find course and check ownership
    const course = await Course.findById(id).populate('instrID', 'uid').lean();
    if (!course){
      throw new NotFoundError("Course not found");
    }

    // Verify instructor ownership or course manager/admin
    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== (course.instrID as any).uid
    ){
      throw new AuthorizationError("Not authorized to update this course");
    }

    // 🧹 Clean up previous uploaded banner on update
    if (file && course.bannerUrl) {
      const oldBannerPath = path.resolve(config.storagePath + course.bannerUrl);
      deleteFile(oldBannerPath); // Use the helper function
    }


    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: courseUpdateDetail },
      { new: true, runValidators: true }
    );
    
    if (!updatedCourse) { // Defensive check
      throw new AppError("Failed to update course after checks", 500, true);
    }
    // Return updated course
    res.status(200).json(cleanMongoData(updatedCourse!.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
   
    const [course] = await Course.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'instrID',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: '$instructor' },
      { $project: { 'instructor.uid': 1 } }
    ]);

    if (!course) throw new NotFoundError("Course not found");

    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== course.instructor.uid
    ){
      throw new AuthorizationError("Not authorized to update this course");
    }

    await Course.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const grantCourseToStudent = async(req: AuthRequest, res: Response, next: NextFunction) => {
  try{
    // Validate grant details
    const grantDetails = await paymentValidationSchema.parseAsync(req.body);
    
    // Check if grant already exists
    const existingGrant = await Payment.findOne({
      courseId: grantDetails.courseId,
      userId: grantDetails.userId
    });
    if (existingGrant) {
      throw new AppError('Grant already exists for this course and user', 400, true);
      return;
    }

    // Create grant
    const details = await Payment.create(grantDetails);

    // Increment buyCnt in course model
    await Course.findByIdAndUpdate(
      grantDetails.courseId,
      { $inc: { buysCnt: 1 } }
    );

    // Return grant details
    res.status(201).json(cleanMongoData(details.toJSON()));
  }catch(err){
    next(err);
  }
}

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try{
    const {id} = req.params;
    
    const mUser = await User.findOne({uid: req.user?.uid}).lean();
    if(!mUser) throw new AuthenticationError();
    if (!mUser.contactNumber) {
      throw new AppError('User does not have a phone number', 400, true);
    }

    const course = await Course.findById(id).lean();
    if(!course) throw new NotFoundError('Course not exist');
    const customer_email = (await auth.getUser(req.user?.uid!)).email;

    const baseURL = (config.nodeEnv === 'development') ? "http://localhost:5000" : config.frontendUrl;

    let orderPayload: CreateOrderRequest = {
      order_id: `order_${uuid()}`,
      order_currency: 'INR',
      order_amount: Math.round(course.price * 100) / 100,
      customer_details: {
        customer_id: mUser._id.toString(),
        customer_email,
        customer_phone: mUser.contactNumber,
      },
      order_meta: {
        return_url: `${config.frontendUrl}/order-success/${course._id.toString()}?order_id={order_id}`,
        notify_url: `${baseURL}/api/v1/courses/${course._id.toString()}/webhook`,
      }
    };

    // School specific price
    if (mUser.schoolName) {
      const school = await School.findOne({ name: mUser.schoolName });
      const customPrice = school?.coursesPricing.find(cp => cp.courseId.toString() === id)?.price;
      if (customPrice !== undefined) {
        orderPayload.order_amount = Math.round(customPrice * 100) / 100;
      }
    }

    const response = await CashFree.PGCreateOrder(orderPayload);
    res.status(201).json(response.data);
  }catch(err){
    next(err);
  }
}

export const checkPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order_id = req.query.order_id;
    const courseId = req.params.id;
    if (!order_id || !courseId) {
      throw new AppError('Missing order ID or course ID', 400, true);
    }
    const mUser = await User.findOne({uid: req.user?.uid}).lean();
    if(!mUser) throw new AuthenticationError();
    const orderDetails: PaymentEntity[] = (await CashFree.PGOrderFetchPayments(order_id!.toString())).data;
    const successfulPayment = orderDetails.find(payment => payment.payment_status === PaymentEntityPaymentStatusEnum.SUCCESS);
    if (!successfulPayment) {
      throw new NotFoundError("No successful payment found");
    }

    const existingPayment = await Payment.findOne({ courseId, userId: mUser._id });
    if (!existingPayment) {
      const payment = new Payment({
        userId: mUser._id,
        courseId,
        amount: successfulPayment.payment_amount,
        method: 'ONLINE',
        paymentId: successfulPayment.cf_payment_id
      });
      await payment.save();
    }
    // Increase buy count in course
    await Course.findByIdAndUpdate(courseId, { $inc: { buysCnt: 1 } });

    res.status(200).json({ message: 'Payment successful' });
  } catch (err) {
    next(err);
  }
}

export const paymentHook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;
    if (!courseId) {
      throw new AppError('Missing course ID', 400, true);
    }
    if (CashFree.PGVerifyWebhookSignature(req.headers["x-webhook-signature"] as string, (req as any).rawBody, req.headers["x-webhook-timestamp"] as string)) {
      const webhookData = JSON.parse((req as any).rawBody);
      const successfulPayment = webhookData.data.payment;
      if (successfulPayment.payment_status === PaymentEntityPaymentStatusEnum.SUCCESS) {
        const mUser = await User.findById(webhookData.data.customer_details.customer_id).lean();
        if (mUser) {
          const existingPayment = await Payment.findOne({ courseId, userId: mUser._id });
          if (!existingPayment) {
            const payment = new Payment({
              userId: mUser._id,
              courseId,
              amount: successfulPayment.payment_amount,
              method: 'ONLINE',
              paymentId: successfulPayment.cf_payment_id
            });
            await payment.save();
            await Course.findByIdAndUpdate(courseId, { $inc: { buysCnt: 1 } });
          }
        }
      }
    }
    res.status(200).send('Webhook received');
  }catch(err){
    res.status(200).send('Error processing webhook');
    next(err);
  }
}