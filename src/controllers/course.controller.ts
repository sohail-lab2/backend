import { NextFunction, Request, Response } from 'express';
<<<<<<< HEAD
import { Course, Payment, School, User } from '../models';
=======
import { Chapter, Course, Module, Payment, School, User } from '../models';
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
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
        
=======

export const getPublicCourse = async (_req: Request, res: Response, next: NextFunction) => {  
  try {
    // Get all courses
    const course = await Course.find()
      .populate('instrID', 'name')
      .populate('reviews')
      .lean();
    if(!course){
      throw new NotFoundError("No course is available");
    }
      
    // Return courses
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    res.status(200).json(cleanMongoData(course));
  } catch (error) {
    next(error);
  }  
};

<<<<<<< HEAD
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
=======
export const getPublicCourseById = async (req: Request, res: Response, next: NextFunction) => {  
  try {
    // Get course by id
    const course = await Course.findById(req.params.id)
      .populate('instrID', 'name')
      .populate('reviews')
      .populate({
        path: 'chapters',
        options: { sort: { order: 1 } },
        populate: {
          path: 'modules',
          select: 'name order description',
          options: { sort: { order: 1 } }
        }
      })
      .lean();

    // Not found
    if(!course){
      throw new NotFoundError("No course is available");
    }

    // Return course
    res.status(200).json(cleanMongoData(course));
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
  } catch (error) {
    next(error);
  }  
};

export const getCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
<<<<<<< HEAD
    const { name, description } = req.query;
    const { role, uid } = req.user!;

=======
    // Get courses
    const { name, description } = req.query;
    const { role, uid } = req.user!;

    // Query
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    const query: any = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (description) query.description = { $regex: description, $options: 'i' };

<<<<<<< HEAD
    const user = await User.findOne({ uid }).select('_id').lean();
    if (!user) throw new NotFoundError("User not found");

=======
    // User
    const user = await User.findOne({ uid }).select('_id').lean();
    if (!user) throw new NotFoundError("User not found");

    // Role-based access check
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    if (role === UserRoles[0]) {
      const payments = await Payment.find({ userId: user._id }).select('courseId').lean();
      const courseIds = payments.map(p => p.courseId);
      query._id = { $in: courseIds };
    } else if (role === UserRoles[1]) {
      query.instrID = user._id;
    }

<<<<<<< HEAD
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

=======
    // Get courses
    const courses = await Course.find(query)
      .populate('instrID', 'name')
      .select('-chapters')
      .lean();

    // Not found
    if (!courses.length) throw new NotFoundError("No courses available");

    // Return courses
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    res.status(200).json(cleanMongoData(courses));
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
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
=======

export const getCourseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get course by id
    const { id } = req.params;
    const { role, uid } = req.user!;

    // User
    const user = await User.findOne({ uid }).select('_id').lean();
    if (!user) throw new NotFoundError("User not found");

    // Role-based access check
    let accessQuery: any = { _id: id };

    if (role === UserRoles[0]) { // Student
      const payment = await Payment.findOne({ userId: user._id, courseId: id }).lean();
      if (!payment) throw new NotFoundError("You have not purchased this course");
    } else if (role === UserRoles[1]) { // Instructor
      accessQuery.instrID = user._id;
    }

    // Fetch course with chapters and modules
    const course = await Course.findOne(accessQuery)
      .populate('instrID', 'name')
      .populate({
        path: 'chapters',
        options: { sort: { order: 1 } },
        populate: {
          path: 'modules',
          options: { sort: { order: 1 } }
        }
      })
      .lean();

    // Not found or not authorized
    if (!course) {
      // Optional cleanup if course not found and user is instructor
      if (role === UserRoles[1]) {
        await User.updateOne(
          { uid, coursesCreated: id },
          { $pull: { coursesCreated: id } }
        );
      }
      throw new NotFoundError("Course not found or unauthorized");
    }

    // Return course
    res.status(200).json(cleanMongoData(course));
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
    
<<<<<<< HEAD
    await User.findByIdAndUpdate(user._id, { $addToSet: { coursesCreated: course._id } });
=======
    // Update user's coursesCreated array with new course ID
    if (!user.coursesCreated) {
      user.coursesCreated = [];
    }
    user.coursesCreated.push(course._id as Types.ObjectId);
    await user.save();
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

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
<<<<<<< HEAD
      throw new NotFoundError("Course not found");
    }

=======
      // remove from the instructor
      if(req.user?.role! === UserRoles[1]){
        User.updateOne(
          { uid: req.user?.uid, coursesCreated: id },
          { $pull: { coursesCreated: id } }
        )};
      throw new NotFoundError("Course not found");
    }

    // 🧹 Clean up previous uploaded banner on update
    if (file) {
      try {
        fs.unlinkSync(path.resolve(config.storagePath + course.bannerUrl));
      } catch (err) {
        console.warn(`Failed to delete PDF: ${config.storagePath + course.bannerUrl}`, err);
      }
    }

>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    // Verify instructor ownership or course manager/admin
    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== (course.instrID as any).uid
    ){
      throw new AuthorizationError("Not authorized to update this course");
    }

<<<<<<< HEAD
    // 🧹 Clean up previous uploaded banner on update
    if (file && course.bannerUrl) {
      const oldBannerPath = path.resolve(config.storagePath + course.bannerUrl);
      deleteFile(oldBannerPath); // Use the helper function
    }


=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: courseUpdateDetail },
      { new: true, runValidators: true }
    );
<<<<<<< HEAD
    
    if (!updatedCourse) { // Defensive check
      throw new AppError("Failed to update course after checks", 500, true);
    }
=======

>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    // Return updated course
    res.status(200).json(cleanMongoData(updatedCourse!.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
   
<<<<<<< HEAD
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
=======
    // Find course and check ownership
    const course = await Course.findById(id).populate('instrID', 'uid').lean();
    if (!course) throw new NotFoundError("Course not found");

    // Verify instructor ownership or course manager/admin
    if(req.user?.role! == UserRoles[1] &&
      req.user?.uid !== (course.instrID as any).uid
    ){
      // remove from the instructor
      User.updateOne(
        { uid: (course.instrID as any).uid, coursesCreated: id },
        { $pull: { coursesCreated: id } }
      );
      throw new AuthorizationError("Not authorized to update this course");
    }

    // Delete all modules in chapters first
    const chapters = await Chapter.find({ courseId: id });
    for (const chapter of chapters) {
      await Module.deleteMany({ _id: { $in: chapter.modules } });
    }

    // Delete all chapters
    await Chapter.deleteMany({ courseId: id });
    
    // Finally delete the course
    await Course.findByIdAndDelete(id);

    // Return success
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
      return;
=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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

<<<<<<< HEAD
    const baseURL = (config.nodeEnv === 'development') ? "http://localhost:5000" : config.frontendUrl;
=======
    const hostname = req.hostname + (config.nodeEnv === 'development') ? ':5000' : '';
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

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
<<<<<<< HEAD
        return_url: `${config.frontendUrl}/order-success/${course._id.toString()}?order_id={order_id}`,
        notify_url: `${baseURL}/api/v1/courses/${course._id.toString()}/webhook`,
      }
    };

    // School specific price
=======
        return_url: `${req.protocol}://${hostname}/checkout?order_id={order_id}`,
        notify_url: `${req.protocol}://${hostname}/api/v1/courses/${course._id.toString()}/webhook`,
      }
    };

    // SChool specific price
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    if (mUser.schoolName) {
      const school = await School.findOne({ name: mUser.schoolName });
      const customPrice = school?.coursesPricing.find(cp => cp.courseId.toString() === id)?.price;
      if (customPrice !== undefined) {
<<<<<<< HEAD
        orderPayload.order_amount = Math.round(customPrice * 100) / 100;
      }
    }

=======
        orderPayload.order_amount = customPrice;
      }
    }


>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
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
=======
      throw new AppError('No successful payment found', 400, true);
    }

    // Add entry to the payment model
    const payment = new Payment({
      userId: mUser._id,
      courseId,
      amount: successfulPayment.payment_amount,
      method: 'ONLINE',
      paymentId: successfulPayment.cf_payment_id
    });
    await payment.save();

>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    // Increase buy count in course
    await Course.findByIdAndUpdate(courseId, { $inc: { buysCnt: 1 } });

    res.status(200).json({ message: 'Payment successful' });
  } catch (err) {
    next(err);
  }
}

<<<<<<< HEAD
export const paymentHook = async (req: Request, res: Response, next: NextFunction) => {
=======
export const paymentHook = async (req: Request, _res: Response, next: NextFunction) => {
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
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
<<<<<<< HEAD
    res.status(200).send('Webhook received');
  }catch(err){
    res.status(200).send('Error processing webhook');
=======
  }catch(err){
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc
    next(err);
  }
}